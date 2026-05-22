using exe201.Server.Models;
using EXE201.Server.DTOs;
using EXE201.Server.Repositories;

namespace EXE201.Server.Services
{
    public class BookingWorkflowService : IBookingWorkflowService
    {
        private readonly IBookingWorkflowRepository _repo;

        public BookingWorkflowService(IBookingWorkflowRepository repo)
        {
            _repo = repo;
        }

        // ── Working Schedule ─────────────────────────────────────────────────

        public async Task<List<WorkingScheduleResponse>> GetMySchedulesAsync(long ownerId)
        {
            var studio = await _repo.GetOwnedStudioAsync(ownerId);
            if (studio == null) return new List<WorkingScheduleResponse>();

            var schedules = await _repo.GetSchedulesByStudioIdAsync(studio.StudioId);
            return schedules.Select(MapSchedule).ToList();
        }

        public async Task<WorkingScheduleResponse?> UpsertScheduleAsync(long ownerId, UpsertWorkingScheduleRequest request)
        {
            if (!TimeOnly.TryParse(request.OpenTime, out var openTime) || !TimeOnly.TryParse(request.CloseTime, out var closeTime)) return null;
            if (request.DayOfWeek > 6 || openTime >= closeTime) return null;

            var studio = await _repo.GetOwnedStudioAsync(ownerId);
            if (studio == null) return null;

            var schedule = await _repo.GetScheduleAsync(studio.StudioId, request.DayOfWeek);
            var now = DateTime.UtcNow;
            if (schedule == null)
            {
                schedule = new WorkingSchedule
                {
                    StudioId = studio.StudioId,
                    DayOfWeek = request.DayOfWeek,
                    OpenTime = openTime,
                    CloseTime = closeTime,
                    IsActive = request.IsActive,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                _repo.AddSchedule(schedule);
            }
            else
            {
                schedule.OpenTime = openTime;
                schedule.CloseTime = closeTime;
                schedule.IsActive = request.IsActive;
                schedule.UpdatedAt = now;
            }

            await _repo.SaveChangesAsync();
            return MapSchedule(schedule);
        }

        // ── Working Day ──────────────────────────────────────────────────────

        public async Task<List<WorkingDayResponse>> GetStudioDaysAsync(long studioId, DateOnly? from, DateOnly? to, bool includeClosed)
        {
            var days = await _repo.GetWorkingDaysAsync(studioId, from, to, includeClosed);
            return days.Select(MapWorkingDay).ToList();
        }

        public async Task<WorkingDayResponse?> UpsertWorkingDayAsync(long ownerId, UpsertWorkingDayRequest request)
        {
            if (!DateOnly.TryParse(request.Date, out var date)) return null;

            var studio = await _repo.GetOwnedStudioAsync(ownerId);
            if (studio == null) return null;

            var day = await _repo.GetWorkingDayWithSlotsAsync(studio.StudioId, date);
            if (day == null)
            {
                day = new WorkingDay
                {
                    StudioId = studio.StudioId,
                    WorkingDate = date,
                    IsAvailable = request.IsAvailable,
                    Note = request.Note,
                    CreatedAt = DateTime.UtcNow
                };
                _repo.AddWorkingDay(day);
            }
            else
            {
                day.IsAvailable = request.IsAvailable;
                day.Note = request.Note;
                // Business rule: closing a day also closes all open slots
                if (!request.IsAvailable)
                {
                    foreach (var slot in day.TimeSlots.Where(s => s.Status == "OPEN"))
                    {
                        slot.Status = "CLOSED";
                    }
                }
            }

            await _repo.SaveChangesAsync();
            return MapWorkingDay(day);
        }

        // ── Time Slot ────────────────────────────────────────────────────────

        public async Task<TimeSlotResponse?> CreateSlotAsync(long ownerId, CreateTimeSlotRequest request)
        {
            if (!DateOnly.TryParse(request.Date, out var date) ||
                !TimeOnly.TryParse(request.StartTime, out var start) ||
                !TimeOnly.TryParse(request.EndTime, out var end) ||
                start >= end)
            {
                return null;
            }

            var studio = await _repo.GetOwnedStudioAsync(ownerId);
            if (studio == null) return null;

            var day = await _repo.GetWorkingDayWithSlotsAsync(studio.StudioId, date);
            if (day == null)
            {
                day = new WorkingDay { StudioId = studio.StudioId, WorkingDate = date, IsAvailable = true, CreatedAt = DateTime.UtcNow };
                _repo.AddWorkingDay(day);
                await _repo.SaveChangesAsync();
            }

            // Business rule: no duplicate start times in the same day
            if (day.TimeSlots.Any(s => s.StartTime == start)) return null;

            var slot = new TimeSlot { WorkingDayId = day.WorkingDayId, StartTime = start, EndTime = end, Status = "OPEN" };
            _repo.AddSlot(slot);
            await _repo.SaveChangesAsync();

            slot.WorkingDay = day;
            return MapSlot(slot);
        }

        public async Task<bool> UpdateSlotStatusAsync(long ownerId, long slotId, string status)
        {
            status = status.ToUpperInvariant();
            // Business rule: only OPEN/CLOSED transitions are allowed via this method; BOOKED is set by the booking flow
            if (status != "OPEN" && status != "CLOSED") return false;

            var studio = await _repo.GetOwnedStudioAsync(ownerId);
            var slot = await _repo.GetSlotWithWorkingDayAsync(slotId);
            if (studio == null || slot == null || slot.WorkingDay.StudioId != studio.StudioId || slot.Status == "BOOKED") return false;

            slot.Status = status;
            await _repo.SaveChangesAsync();
            return true;
        }

        // ── Booking ──────────────────────────────────────────────────────────

        public async Task<BookingResponse?> CreateBookingAsync(long customerId, CreateBookingRequest request)
        {
            // Validate package and slot exist and belong to the same studio
            var package = await _repo.GetActivePackageWithStudioAsync(request.PackageId);
            var slot    = await _repo.GetSlotWithWorkingDayAsync(request.SlotId);

            if (package == null || slot == null) return null;
            if (slot.Status != "OPEN") return null;
            if (slot.WorkingDay.StudioId != package.Service.StudioId) return null;

            // Business rule: studio must be approved and not deleted
            if (package.Service.Studio.Status != "APPROVED" || package.Service.Studio.DeletedAt != null) return null;

            var pendingStatusId = await _repo.GetBookingStatusIdAsync("PENDING");
            if (pendingStatusId == null) return null;

            // Begin transaction — re-check slot status inside the transaction to guard against
            // double-booking race conditions (two customers submitting for the same slot at once).
            await using var tx = await _repo.BeginTransactionAsync();

            var freshSlot = await _repo.GetSlotForUpdateAsync(request.SlotId);
            if (freshSlot == null || freshSlot.Status != "OPEN")
            {
                // Another request already booked this slot — abort
                return null;
            }

            // Calculate commission (business logic stays in service)
            var commissionPercent = package.Service.Studio.CommissionPercent;
            var commissionAmount  = Math.Round(package.Price * commissionPercent / 100m, 0);

            var booking = new Booking
            {
                CustomerId       = customerId,
                StudioId         = package.Service.StudioId,
                PackageId        = package.PackageId,
                SlotId           = slot.SlotId,
                StatusId         = pendingStatusId.Value,
                BookingCode      = $"BK-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
                ShootingDate     = slot.WorkingDay.WorkingDate,
                ShootingLocation = request.ShootingLocation,
                Note             = request.Note,
                TotalPrice       = package.Price,
                CommissionPercent = commissionPercent,
                CommissionAmount = commissionAmount,
                StudioRevenue    = package.Price - commissionAmount,
                CreatedAt        = DateTime.UtcNow,
                UpdatedAt        = DateTime.UtcNow,
                CreatedBy        = customerId,
                UpdatedBy        = customerId
            };

            _repo.AddBooking(booking);
            freshSlot.Status = "BOOKED";
            await _repo.SaveChangesAsync();

            AddBookingLogEntry(booking.BookingId, null, "PENDING", customerId, "Booking created");
            await CreatePendingPaymentAsync(booking, "BANK_TRANSFER");
            await _repo.SaveChangesAsync();

            await tx.CommitAsync();

            return await GetBookingForUserAsync(customerId, "CUSTOMER", booking.BookingId);
        }

        public async Task<List<BookingResponse>> GetBookingsForUserAsync(long userId, string role, string? status)
        {
            List<Booking> bookings;

            if (role == "CUSTOMER")
            {
                bookings = await _repo.GetBookingsByCustomerAsync(userId, status);
            }
            else if (role == "STUDIO_OWNER")
            {
                var studio = await _repo.GetOwnedStudioAsync(userId);
                if (studio == null) return new List<BookingResponse>();
                bookings = await _repo.GetBookingsByStudioAsync(studio.StudioId, status);
            }
            else
            {
                // ADMIN: return all (not currently exposed via this method, but safe fallback)
                bookings = new List<Booking>();
            }

            return bookings.Select(MapBooking).ToList();
        }

        public async Task<BookingResponse?> GetBookingForUserAsync(long userId, string role, long bookingId)
        {
            var booking = await _repo.GetFullBookingAsync(bookingId);
            if (booking == null) return null;
            if (!await CanAccessBookingAsync(userId, role, booking)) return null;
            return MapBooking(booking);
        }

        public async Task<BookingResponse?> ConfirmBookingAsync(long ownerId, long bookingId)
            => await StudioTransitionAsync(ownerId, bookingId, "PENDING", "CONFIRMED", b => b.ConfirmedAt = DateTime.UtcNow, "Studio confirmed");

        public async Task<BookingResponse?> RejectBookingAsync(long ownerId, long bookingId, string? reason)
            => await StudioTransitionAsync(ownerId, bookingId, "PENDING", "REJECTED", b =>
            {
                b.RejectedAt   = DateTime.UtcNow;
                b.RejectReason = reason;
                // Business rule: rejecting a booking releases the slot
                b.Slot.Status  = "OPEN";
            }, reason ?? "Studio rejected");

        public async Task<BookingResponse?> MarkInProgressAsync(long ownerId, long bookingId)
            => await StudioTransitionAsync(ownerId, bookingId, "CONFIRMED", "IN_PROGRESS", _ => { }, "Studio started booking");

        public async Task<BookingResponse?> CompleteBookingAsync(long ownerId, long bookingId)
            => await StudioTransitionAsync(ownerId, bookingId, "IN_PROGRESS", "COMPLETED", b => b.CompletedAt = DateTime.UtcNow, "Studio completed booking");

        public async Task<BookingResponse?> CancelBookingAsync(long userId, string role, long bookingId, string? reason)
        {
            var booking = await _repo.GetFullBookingAsync(bookingId);
            if (booking == null || !await CanAccessBookingAsync(userId, role, booking)) return null;

            // Business rule: terminal states cannot be cancelled
            if (booking.Status.StatusName is "COMPLETED" or "CANCELLED" or "REJECTED") return null;

            var oldStatus   = booking.Status.StatusName;
            var cancelledId = await _repo.GetBookingStatusIdAsync("CANCELLED");
            if (cancelledId == null) return null;

            booking.StatusId     = cancelledId.Value;
            booking.CancelledAt  = DateTime.UtcNow;
            booking.CancelledBy  = userId;
            booking.CancelReason = reason;
            booking.UpdatedAt    = DateTime.UtcNow;
            booking.UpdatedBy    = userId;
            // Business rule: cancelling a booking releases the slot
            booking.Slot.Status  = "OPEN";

            await _repo.SaveChangesAsync();
            AddBookingLogEntry(booking.BookingId, oldStatus, "CANCELLED", userId, reason);
            await _repo.SaveChangesAsync();

            return await GetBookingForUserAsync(userId, role, booking.BookingId);
        }

        // ── Payment ──────────────────────────────────────────────────────────

        public async Task<List<PaymentResponse>> GetPaymentsForUserAsync(long userId, string role)
        {
            if (role == "CUSTOMER")
                return (await _repo.GetPaymentsByCustomerAsync(userId)).Select(MapPayment).ToList();

            if (role == "STUDIO_OWNER")
            {
                var studio = await _repo.GetOwnedStudioAsync(userId);
                if (studio == null) return new List<PaymentResponse>();
                return (await _repo.GetPaymentsByStudioAsync(studio.StudioId)).Select(MapPayment).ToList();
            }

            return new List<PaymentResponse>();
        }

        public async Task<PaymentResponse?> PayBookingAsync(long customerId, PayBookingRequest request)
        {
            var booking = await _repo.GetFullBookingAsync(request.BookingId);
            if (booking == null || booking.CustomerId != customerId) return null;

            var payment = booking.Payments.OrderByDescending(p => p.CreatedAt).FirstOrDefault()
                ?? await CreatePendingPaymentAsync(booking, request.MethodName);

            var method     = await _repo.GetPaymentMethodAsync(request.MethodName)
                          ?? await _repo.GetPaymentMethodAsync("BANK_TRANSFER");
            var paidStatus = await _repo.GetPaymentStatusAsync("PAID");
            if (method == null || paidStatus == null) return null;

            payment.MethodId         = method.MethodId;
            payment.PaymentStatusId  = paidStatus.PaymentStatusId;
            payment.TransactionCode  = request.TransactionCode ?? $"SIM-{Guid.NewGuid().ToString("N")[..12].ToUpperInvariant()}";
            payment.PaidAt           = DateTime.UtcNow;
            payment.UpdatedAt        = DateTime.UtcNow;
            await _repo.SaveChangesAsync();

            payment.Method        = method;
            payment.PaymentStatus = paidStatus;
            return MapPayment(payment);
        }

        // ── Private: business logic helpers ──────────────────────────────────

        private async Task<BookingResponse?> StudioTransitionAsync(
            long ownerId, long bookingId,
            string expectedStatus, string nextStatus,
            Action<Booking> mutate, string? note)
        {
            var studio  = await _repo.GetOwnedStudioAsync(ownerId);
            var booking = await _repo.GetFullBookingAsync(bookingId);

            // Business rule: studio must own this booking and booking must be in the expected state
            if (studio == null || booking == null || booking.StudioId != studio.StudioId) return null;
            if (booking.Status.StatusName != expectedStatus) return null;

            var nextStatusId = await _repo.GetBookingStatusIdAsync(nextStatus);
            if (nextStatusId == null) return null;

            mutate(booking);
            booking.StatusId  = nextStatusId.Value;
            booking.UpdatedAt = DateTime.UtcNow;
            booking.UpdatedBy = ownerId;
            await _repo.SaveChangesAsync();

            AddBookingLogEntry(booking.BookingId, expectedStatus, nextStatus, ownerId, note);
            await _repo.SaveChangesAsync();

            return await GetBookingForUserAsync(ownerId, "STUDIO_OWNER", bookingId);
        }

        /// <summary>
        /// Business rule: customers see their own bookings; studio owners see their studio's bookings;
        /// admins see all.
        /// </summary>
        private async Task<bool> CanAccessBookingAsync(long userId, string role, Booking booking)
        {
            if (role == "ADMIN") return true;
            if (role == "CUSTOMER") return booking.CustomerId == userId;
            if (role == "STUDIO_OWNER") return await _repo.IsStudioOwnerAsync(booking.StudioId, userId);
            return false;
        }

        /// <summary>Adds a log entry to the change tracker (caller must SaveChanges).</summary>
        private void AddBookingLogEntry(long bookingId, string? oldStatus, string newStatus, long changedBy, string? note)
        {
            _repo.AddBookingLog(new BookingLog
            {
                BookingId = bookingId,
                OldStatus = oldStatus,
                NewStatus = newStatus,
                ChangedBy = changedBy,
                Note      = note,
                ChangedAt = DateTime.UtcNow
            });
        }

        private async Task<Payment> CreatePendingPaymentAsync(Booking booking, string methodName)
        {
            var method  = await _repo.GetPaymentMethodAsync(methodName)
                       ?? await _repo.GetPaymentMethodAsync("BANK_TRANSFER")
                       ?? throw new InvalidOperationException("Default payment method BANK_TRANSFER not found.");
            var pending = await _repo.GetPaymentStatusAsync("PENDING")
                       ?? throw new InvalidOperationException("Payment status PENDING not found.");

            var payment = new Payment
            {
                BookingId       = booking.BookingId,
                MethodId        = method.MethodId,
                PaymentStatusId = pending.PaymentStatusId,
                PaymentCode     = $"PAY-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
                Amount          = booking.TotalPrice,
                CurrencyCode    = "VND",
                CreatedAt       = DateTime.UtcNow,
                UpdatedAt       = DateTime.UtcNow
            };
            _repo.AddPayment(payment);
            // Caller is responsible for SaveChangesAsync
            payment.Method        = method;
            payment.PaymentStatus = pending;
            return payment;
        }

        // ── Private: mappers (entity → DTO, no DB calls) ─────────────────────

        private static WorkingScheduleResponse MapSchedule(WorkingSchedule s) => new()
        {
            Id         = s.ScheduleId,
            StudioId   = s.StudioId,
            DayOfWeek  = s.DayOfWeek,
            OpenTime   = s.OpenTime.ToString("HH:mm"),
            CloseTime  = s.CloseTime.ToString("HH:mm"),
            IsActive   = s.IsActive
        };

        private static WorkingDayResponse MapWorkingDay(WorkingDay d) => new()
        {
            Id          = d.WorkingDayId,
            StudioId    = d.StudioId,
            Date        = d.WorkingDate.ToString("yyyy-MM-dd"),
            IsAvailable = d.IsAvailable,
            Note        = d.Note,
            Slots       = d.TimeSlots.OrderBy(s => s.StartTime).Select(MapSlot).ToList()
        };

        private static TimeSlotResponse MapSlot(TimeSlot s) => new()
        {
            Id           = s.SlotId,
            WorkingDayId = s.WorkingDayId,
            Date         = s.WorkingDay.WorkingDate.ToString("yyyy-MM-dd"),
            StartTime    = s.StartTime.ToString("HH:mm"),
            EndTime      = s.EndTime.ToString("HH:mm"),
            Status       = s.Status
        };

        private static BookingResponse MapBooking(Booking b) => new()
        {
            Id               = b.BookingId,
            BookingCode      = b.BookingCode,
            CustomerId       = b.CustomerId,
            CustomerName     = b.Customer.FullName,
            StudioId         = b.StudioId,
            StudioName       = b.Studio.StudioName,
            PackageId        = b.PackageId,
            PackageName      = b.Package.PackageName,
            SlotId           = b.SlotId,
            ShootingDate     = b.ShootingDate.ToString("yyyy-MM-dd"),
            StartTime        = b.Slot.StartTime.ToString("HH:mm"),
            EndTime          = b.Slot.EndTime.ToString("HH:mm"),
            ShootingLocation = b.ShootingLocation,
            Note             = b.Note,
            Status           = b.Status.StatusName,
            TotalPrice       = b.TotalPrice,
            CommissionAmount = b.CommissionAmount,
            StudioRevenue    = b.StudioRevenue,
            CreatedAt        = b.CreatedAt.ToString("O"),
            LatestPayment    = b.Payments.OrderByDescending(p => p.CreatedAt).Select(MapPayment).FirstOrDefault()
        };

        private static PaymentResponse MapPayment(Payment p) => new()
        {
            Id              = p.PaymentId,
            BookingId       = p.BookingId,
            PaymentCode     = p.PaymentCode,
            MethodName      = p.Method.MethodName,
            Status          = p.PaymentStatus.StatusName,
            Amount          = p.Amount,
            CurrencyCode    = p.CurrencyCode,
            TransactionCode = p.TransactionCode,
            PaidAt          = p.PaidAt?.ToString("O"),
            RefundedAt      = p.RefundedAt?.ToString("O"),
            CreatedAt       = p.CreatedAt.ToString("O")
        };
    }
}
