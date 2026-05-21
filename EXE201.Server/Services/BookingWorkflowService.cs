using exe201.Server.Models;
using EXE201.Server.DTOs;
using Microsoft.EntityFrameworkCore;

namespace EXE201.Server.Services
{
    public class BookingWorkflowService : IBookingWorkflowService
    {
        private readonly PhotoStudioBookingContext _context;

        public BookingWorkflowService(PhotoStudioBookingContext context)
        {
            _context = context;
        }

        public async Task<List<WorkingScheduleResponse>> GetMySchedulesAsync(long ownerId)
        {
            var studio = await GetOwnedStudioAsync(ownerId);
            if (studio == null) return new List<WorkingScheduleResponse>();

            return await _context.WorkingSchedules
                .Where(s => s.StudioId == studio.StudioId)
                .OrderBy(s => s.DayOfWeek)
                .Select(s => MapSchedule(s))
                .ToListAsync();
        }

        public async Task<WorkingScheduleResponse?> UpsertScheduleAsync(long ownerId, UpsertWorkingScheduleRequest request)
        {
            if (!TimeOnly.TryParse(request.OpenTime, out var openTime) || !TimeOnly.TryParse(request.CloseTime, out var closeTime)) return null;
            if (request.DayOfWeek > 6 || openTime >= closeTime) return null;

            var studio = await GetOwnedStudioAsync(ownerId);
            if (studio == null) return null;

            var schedule = await _context.WorkingSchedules.FirstOrDefaultAsync(s => s.StudioId == studio.StudioId && s.DayOfWeek == request.DayOfWeek);
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
                _context.WorkingSchedules.Add(schedule);
            }
            else
            {
                schedule.OpenTime = openTime;
                schedule.CloseTime = closeTime;
                schedule.IsActive = request.IsActive;
                schedule.UpdatedAt = now;
            }

            await _context.SaveChangesAsync();
            return MapSchedule(schedule);
        }

        public async Task<List<WorkingDayResponse>> GetStudioDaysAsync(long studioId, DateOnly? from, DateOnly? to, bool includeClosed)
        {
            var query = _context.WorkingDays
                .Include(d => d.TimeSlots)
                .Where(d => d.StudioId == studioId)
                .AsQueryable();

            if (from.HasValue) query = query.Where(d => d.WorkingDate >= from);
            if (to.HasValue) query = query.Where(d => d.WorkingDate <= to);
            if (!includeClosed) query = query.Where(d => d.IsAvailable);

            var days = await query.OrderBy(d => d.WorkingDate).ToListAsync();
            return days.Select(MapWorkingDay).ToList();
        }

        public async Task<WorkingDayResponse?> UpsertWorkingDayAsync(long ownerId, UpsertWorkingDayRequest request)
        {
            if (!DateOnly.TryParse(request.Date, out var date)) return null;

            var studio = await GetOwnedStudioAsync(ownerId);
            if (studio == null) return null;

            var day = await _context.WorkingDays.Include(d => d.TimeSlots).FirstOrDefaultAsync(d => d.StudioId == studio.StudioId && d.WorkingDate == date);
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
                _context.WorkingDays.Add(day);
            }
            else
            {
                day.IsAvailable = request.IsAvailable;
                day.Note = request.Note;
                if (!request.IsAvailable)
                {
                    foreach (var slot in day.TimeSlots.Where(s => s.Status == "OPEN"))
                    {
                        slot.Status = "CLOSED";
                    }
                }
            }

            await _context.SaveChangesAsync();
            return MapWorkingDay(day);
        }

        public async Task<TimeSlotResponse?> CreateSlotAsync(long ownerId, CreateTimeSlotRequest request)
        {
            if (!DateOnly.TryParse(request.Date, out var date) ||
                !TimeOnly.TryParse(request.StartTime, out var start) ||
                !TimeOnly.TryParse(request.EndTime, out var end) ||
                start >= end)
            {
                return null;
            }

            var studio = await GetOwnedStudioAsync(ownerId);
            if (studio == null) return null;

            var day = await _context.WorkingDays.Include(d => d.TimeSlots).FirstOrDefaultAsync(d => d.StudioId == studio.StudioId && d.WorkingDate == date);
            if (day == null)
            {
                day = new WorkingDay { StudioId = studio.StudioId, WorkingDate = date, IsAvailable = true, CreatedAt = DateTime.UtcNow };
                _context.WorkingDays.Add(day);
                await _context.SaveChangesAsync();
            }

            if (day.TimeSlots.Any(s => s.StartTime == start)) return null;

            var slot = new TimeSlot { WorkingDayId = day.WorkingDayId, StartTime = start, EndTime = end, Status = "OPEN" };
            _context.TimeSlots.Add(slot);
            await _context.SaveChangesAsync();

            slot.WorkingDay = day;
            return MapSlot(slot);
        }

        public async Task<bool> UpdateSlotStatusAsync(long ownerId, long slotId, string status)
        {
            status = status.ToUpperInvariant();
            if (status != "OPEN" && status != "CLOSED") return false;

            var studio = await GetOwnedStudioAsync(ownerId);
            var slot = await _context.TimeSlots.Include(s => s.WorkingDay).FirstOrDefaultAsync(s => s.SlotId == slotId);
            if (studio == null || slot == null || slot.WorkingDay.StudioId != studio.StudioId || slot.Status == "BOOKED") return false;

            slot.Status = status;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<BookingResponse?> CreateBookingAsync(long customerId, CreateBookingRequest request)
        {
            var package = await _context.Packages
                .Include(p => p.Service).ThenInclude(s => s.Studio)
                .FirstOrDefaultAsync(p => p.PackageId == request.PackageId && p.DeletedAt == null && p.IsActive);
            var slot = await _context.TimeSlots.Include(s => s.WorkingDay).FirstOrDefaultAsync(s => s.SlotId == request.SlotId);

            if (package == null || slot == null || slot.Status != "OPEN" || slot.WorkingDay.StudioId != package.Service.StudioId) return null;
            if (package.Service.Studio.Status != "APPROVED" || package.Service.Studio.DeletedAt != null) return null;

            var pending = await GetBookingStatusIdAsync("PENDING");
            if (pending == null) return null;

            await using var tx = await _context.Database.BeginTransactionAsync();
            var reloadedSlot = await _context.TimeSlots.FirstAsync(s => s.SlotId == request.SlotId);
            if (reloadedSlot.Status != "OPEN") return null;

            var commissionPercent = package.Service.Studio.CommissionPercent;
            var commissionAmount = Math.Round(package.Price * commissionPercent / 100m, 0);
            var booking = new Booking
            {
                CustomerId = customerId,
                StudioId = package.Service.StudioId,
                PackageId = package.PackageId,
                SlotId = slot.SlotId,
                StatusId = pending.Value,
                BookingCode = $"BK-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
                ShootingDate = slot.WorkingDay.WorkingDate,
                ShootingLocation = request.ShootingLocation,
                Note = request.Note,
                TotalPrice = package.Price,
                CommissionPercent = commissionPercent,
                CommissionAmount = commissionAmount,
                StudioRevenue = package.Price - commissionAmount,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = customerId,
                UpdatedBy = customerId
            };

            _context.Bookings.Add(booking);
            reloadedSlot.Status = "BOOKED";
            await _context.SaveChangesAsync();
            await AddBookingLogAsync(booking.BookingId, null, "PENDING", customerId, "Booking created");
            await CreatePendingPaymentAsync(booking, "BANK_TRANSFER");
            await tx.CommitAsync();

            return await GetBookingForUserAsync(customerId, "CUSTOMER", booking.BookingId);
        }

        public async Task<List<BookingResponse>> GetBookingsForUserAsync(long userId, string role, string? status)
        {
            var query = BookingQuery();

            if (role == "CUSTOMER")
            {
                query = query.Where(b => b.CustomerId == userId);
            }
            else if (role == "STUDIO_OWNER")
            {
                var studio = await GetOwnedStudioAsync(userId);
                if (studio == null) return new List<BookingResponse>();
                query = query.Where(b => b.StudioId == studio.StudioId);
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
            {
                query = query.Where(b => b.Status.StatusName == status);
            }

            var bookings = await query.OrderByDescending(b => b.CreatedAt).ToListAsync();
            return bookings.Select(MapBooking).ToList();
        }

        public async Task<BookingResponse?> GetBookingForUserAsync(long userId, string role, long bookingId)
        {
            var booking = await BookingQuery().FirstOrDefaultAsync(b => b.BookingId == bookingId);
            if (booking == null) return null;
            if (!CanAccessBooking(userId, role, booking)) return null;
            return MapBooking(booking);
        }

        public async Task<BookingResponse?> ConfirmBookingAsync(long ownerId, long bookingId)
        {
            return await StudioTransitionAsync(ownerId, bookingId, "PENDING", "CONFIRMED", b => b.ConfirmedAt = DateTime.UtcNow, "Studio confirmed");
        }

        public async Task<BookingResponse?> RejectBookingAsync(long ownerId, long bookingId, string? reason)
        {
            return await StudioTransitionAsync(ownerId, bookingId, "PENDING", "REJECTED", b =>
            {
                b.RejectedAt = DateTime.UtcNow;
                b.RejectReason = reason;
                b.Slot.Status = "OPEN";
            }, reason ?? "Studio rejected");
        }

        public async Task<BookingResponse?> MarkInProgressAsync(long ownerId, long bookingId)
        {
            return await StudioTransitionAsync(ownerId, bookingId, "CONFIRMED", "IN_PROGRESS", _ => { }, "Studio started booking");
        }

        public async Task<BookingResponse?> CompleteBookingAsync(long ownerId, long bookingId)
        {
            return await StudioTransitionAsync(ownerId, bookingId, "IN_PROGRESS", "COMPLETED", b => b.CompletedAt = DateTime.UtcNow, "Studio completed booking");
        }

        public async Task<BookingResponse?> CancelBookingAsync(long userId, string role, long bookingId, string? reason)
        {
            var booking = await BookingQuery().FirstOrDefaultAsync(b => b.BookingId == bookingId);
            if (booking == null || !CanAccessBooking(userId, role, booking)) return null;
            if (booking.Status.StatusName is "COMPLETED" or "CANCELLED" or "REJECTED") return null;

            var oldStatus = booking.Status.StatusName;
            var cancelled = await GetBookingStatusIdAsync("CANCELLED");
            if (cancelled == null) return null;

            booking.StatusId = cancelled.Value;
            booking.CancelledAt = DateTime.UtcNow;
            booking.CancelledBy = userId;
            booking.CancelReason = reason;
            booking.UpdatedAt = DateTime.UtcNow;
            booking.UpdatedBy = userId;
            booking.Slot.Status = "OPEN";
            await _context.SaveChangesAsync();
            await AddBookingLogAsync(booking.BookingId, oldStatus, "CANCELLED", userId, reason);

            return await GetBookingForUserAsync(userId, role, booking.BookingId);
        }

        public async Task<List<PaymentResponse>> GetPaymentsForUserAsync(long userId, string role)
        {
            var query = _context.Payments
                .Include(p => p.Booking).ThenInclude(b => b.Studio)
                .Include(p => p.Method)
                .Include(p => p.PaymentStatus)
                .AsQueryable();

            if (role == "CUSTOMER")
            {
                query = query.Where(p => p.Booking.CustomerId == userId);
            }
            else if (role == "STUDIO_OWNER")
            {
                var studio = await GetOwnedStudioAsync(userId);
                if (studio == null) return new List<PaymentResponse>();
                query = query.Where(p => p.Booking.StudioId == studio.StudioId);
            }

            return await query.OrderByDescending(p => p.CreatedAt).Select(p => MapPayment(p)).ToListAsync();
        }

        public async Task<PaymentResponse?> PayBookingAsync(long customerId, PayBookingRequest request)
        {
            var booking = await BookingQuery().FirstOrDefaultAsync(b => b.BookingId == request.BookingId && b.CustomerId == customerId);
            if (booking == null) return null;

            var payment = booking.Payments.OrderByDescending(p => p.CreatedAt).FirstOrDefault()
                ?? await CreatePendingPaymentAsync(booking, request.MethodName);

            var method = await _context.PaymentMethods.FirstOrDefaultAsync(m => m.MethodName == request.MethodName)
                ?? await _context.PaymentMethods.FirstOrDefaultAsync(m => m.MethodName == "BANK_TRANSFER");
            var paidStatus = await _context.PaymentStatuses.FirstOrDefaultAsync(s => s.StatusName == "PAID");
            if (method == null || paidStatus == null) return null;

            payment.MethodId = method.MethodId;
            payment.PaymentStatusId = paidStatus.PaymentStatusId;
            payment.TransactionCode = request.TransactionCode ?? $"SIM-{Guid.NewGuid().ToString("N")[..12].ToUpperInvariant()}";
            payment.PaidAt = DateTime.UtcNow;
            payment.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            payment.Method = method;
            payment.PaymentStatus = paidStatus;
            return MapPayment(payment);
        }

        private async Task<BookingResponse?> StudioTransitionAsync(long ownerId, long bookingId, string expectedStatus, string nextStatus, Action<Booking> mutate, string? note)
        {
            var studio = await GetOwnedStudioAsync(ownerId);
            var booking = await BookingQuery().FirstOrDefaultAsync(b => b.BookingId == bookingId);
            if (studio == null || booking == null || booking.StudioId != studio.StudioId || booking.Status.StatusName != expectedStatus) return null;

            var nextStatusId = await GetBookingStatusIdAsync(nextStatus);
            if (nextStatusId == null) return null;

            mutate(booking);
            booking.StatusId = nextStatusId.Value;
            booking.UpdatedAt = DateTime.UtcNow;
            booking.UpdatedBy = ownerId;
            await _context.SaveChangesAsync();
            await AddBookingLogAsync(booking.BookingId, expectedStatus, nextStatus, ownerId, note);

            return await GetBookingForUserAsync(ownerId, "STUDIO_OWNER", bookingId);
        }

        private IQueryable<Booking> BookingQuery()
        {
            return _context.Bookings
                .Include(b => b.Customer)
                .Include(b => b.Studio)
                .Include(b => b.Package)
                .Include(b => b.Status)
                .Include(b => b.Slot).ThenInclude(s => s.WorkingDay)
                .Include(b => b.Payments).ThenInclude(p => p.Method)
                .Include(b => b.Payments).ThenInclude(p => p.PaymentStatus);
        }

        private async Task<Studio?> GetOwnedStudioAsync(long ownerId)
        {
            return await _context.Studios.FirstOrDefaultAsync(s => s.OwnerId == ownerId && s.DeletedAt == null);
        }

        private bool CanAccessBooking(long userId, string role, Booking booking)
        {
            if (role == "ADMIN") return true;
            if (role == "CUSTOMER") return booking.CustomerId == userId;
            if (role == "STUDIO_OWNER") return _context.Studios.Any(s => s.StudioId == booking.StudioId && s.OwnerId == userId && s.DeletedAt == null);
            return false;
        }

        private async Task<long?> GetBookingStatusIdAsync(string status)
        {
            return await _context.BookingStatuses.Where(s => s.StatusName == status).Select(s => (long?)s.StatusId).FirstOrDefaultAsync();
        }

        private async Task AddBookingLogAsync(long bookingId, string? oldStatus, string newStatus, long changedBy, string? note)
        {
            _context.BookingLogs.Add(new BookingLog
            {
                BookingId = bookingId,
                OldStatus = oldStatus,
                NewStatus = newStatus,
                ChangedBy = changedBy,
                Note = note,
                ChangedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }

        private async Task<Payment> CreatePendingPaymentAsync(Booking booking, string methodName)
        {
            var method = await _context.PaymentMethods.FirstOrDefaultAsync(m => m.MethodName == methodName)
                ?? await _context.PaymentMethods.FirstAsync(m => m.MethodName == "BANK_TRANSFER");
            var pending = await _context.PaymentStatuses.FirstAsync(s => s.StatusName == "PENDING");
            var payment = new Payment
            {
                BookingId = booking.BookingId,
                MethodId = method.MethodId,
                PaymentStatusId = pending.PaymentStatusId,
                PaymentCode = $"PAY-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
                Amount = booking.TotalPrice,
                CurrencyCode = "VND",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();
            payment.Method = method;
            payment.PaymentStatus = pending;
            return payment;
        }

        private static WorkingScheduleResponse MapSchedule(WorkingSchedule s) => new()
        {
            Id = s.ScheduleId,
            StudioId = s.StudioId,
            DayOfWeek = s.DayOfWeek,
            OpenTime = s.OpenTime.ToString("HH:mm"),
            CloseTime = s.CloseTime.ToString("HH:mm"),
            IsActive = s.IsActive
        };

        private static WorkingDayResponse MapWorkingDay(WorkingDay d) => new()
        {
            Id = d.WorkingDayId,
            StudioId = d.StudioId,
            Date = d.WorkingDate.ToString("yyyy-MM-dd"),
            IsAvailable = d.IsAvailable,
            Note = d.Note,
            Slots = d.TimeSlots.OrderBy(s => s.StartTime).Select(MapSlot).ToList()
        };

        private static TimeSlotResponse MapSlot(TimeSlot s) => new()
        {
            Id = s.SlotId,
            WorkingDayId = s.WorkingDayId,
            Date = s.WorkingDay.WorkingDate.ToString("yyyy-MM-dd"),
            StartTime = s.StartTime.ToString("HH:mm"),
            EndTime = s.EndTime.ToString("HH:mm"),
            Status = s.Status
        };

        private static BookingResponse MapBooking(Booking b) => new()
        {
            Id = b.BookingId,
            BookingCode = b.BookingCode,
            CustomerId = b.CustomerId,
            CustomerName = b.Customer.FullName,
            StudioId = b.StudioId,
            StudioName = b.Studio.StudioName,
            PackageId = b.PackageId,
            PackageName = b.Package.PackageName,
            SlotId = b.SlotId,
            ShootingDate = b.ShootingDate.ToString("yyyy-MM-dd"),
            StartTime = b.Slot.StartTime.ToString("HH:mm"),
            EndTime = b.Slot.EndTime.ToString("HH:mm"),
            ShootingLocation = b.ShootingLocation,
            Note = b.Note,
            Status = b.Status.StatusName,
            TotalPrice = b.TotalPrice,
            CommissionAmount = b.CommissionAmount,
            StudioRevenue = b.StudioRevenue,
            CreatedAt = b.CreatedAt.ToString("O"),
            LatestPayment = b.Payments.OrderByDescending(p => p.CreatedAt).Select(MapPayment).FirstOrDefault()
        };

        private static PaymentResponse MapPayment(Payment p) => new()
        {
            Id = p.PaymentId,
            BookingId = p.BookingId,
            PaymentCode = p.PaymentCode,
            MethodName = p.Method.MethodName,
            Status = p.PaymentStatus.StatusName,
            Amount = p.Amount,
            CurrencyCode = p.CurrencyCode,
            TransactionCode = p.TransactionCode,
            PaidAt = p.PaidAt?.ToString("O"),
            RefundedAt = p.RefundedAt?.ToString("O"),
            CreatedAt = p.CreatedAt.ToString("O")
        };
    }
}
