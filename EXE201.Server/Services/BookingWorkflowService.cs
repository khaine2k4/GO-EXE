using exe201.Server.Models;
using EXE201.Server.DTOs;
using EXE201.Server.Repositories;
using Microsoft.Extensions.Configuration;
using EXE201.Server.Utils;
using System.Text.Json;

namespace EXE201.Server.Services
{
    public class BookingWorkflowService : IBookingWorkflowService
    {
        private const string BookingPendingPayment = "PENDING_PAYMENT";
        private const string BookingPendingConfirmation = "PENDING_CONFIRMATION";
        private const string BookingConfirmed = "CONFIRMED";
        private const string BookingInProgress = "IN_PROGRESS";
        private const string BookingDemoUploaded = "DEMO_UPLOADED";
        private const string BookingEditing = "EDITING";
        private const string BookingFinalDelivered = "FINAL_DELIVERED";
        private const string BookingCompleted = "COMPLETED";
        private const string BookingCancelled = "CANCELLED";
        private const string BookingRejected = "REJECTED";
        private const string BookingNoShow = "NO_SHOW";
        private const string BookingRescheduleRequested = "RESCHEDULE_REQUESTED";
        private const string BookingRescheduleApproved = "RESCHEDULE_APPROVED";
        private const string BookingRescheduleRejected = "RESCHEDULE_REJECTED";

        private const string PaymentPending = "PENDING";
        private const string PaymentPaid = "PAID";
        private const string PaymentFailed = "FAILED";
        private const string PaymentRefundPending = "REFUND_PENDING";
        private const string PaymentRefunded = "REFUNDED";
        private const string PaymentPartiallyRefunded = "PARTIALLY_REFUNDED";
        private const string PaymentForfeited = "FORFEITED";

        private const string SlotOpen = "OPEN";
        private const string SlotHolding = "HOLDING";
        private const string SlotBooked = "BOOKED";
        private const string SlotClosed = "CLOSED";

        private readonly IBookingWorkflowRepository _repo;
        private readonly IConfiguration _configuration;
        private readonly IPayOsService _payOsService;
        private readonly IWalletService _walletService;
        private readonly INotificationService _notificationService;

        public BookingWorkflowService(
            IBookingWorkflowRepository repo, 
            IConfiguration configuration, 
            IPayOsService payOsService, 
            IWalletService walletService,
            INotificationService notificationService)
        {
            _repo = repo;
            _configuration = configuration;
            _payOsService = payOsService;
            _walletService = walletService;
            _notificationService = notificationService;
        }

        public async Task<List<WorkingScheduleResponse>> GetMySchedulesAsync(long ownerId)
        {
            var studio = await _repo.GetOwnedStudioAsync(ownerId);
            if (studio == null) return new List<WorkingScheduleResponse>();

            var schedules = await _repo.GetSchedulesByStudioIdAsync(studio.StudioId);
            return schedules.Select(MapSchedule).ToList();
        }

        public async Task<WorkingScheduleResponse?> UpsertScheduleAsync(long ownerId, UpsertWorkingScheduleRequest request)
        {
            if (!TimeOnly.TryParse(request.OpenTime, out var openTime) ||
                !TimeOnly.TryParse(request.CloseTime, out var closeTime))
            {
                return null;
            }

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

        public async Task<bool> UpdateSlotDurationAsync(long ownerId, int slotDurationMinutes)
        {
            var allowed = new[] { 30, 60, 90, 120, 180, 240 };
            if (!allowed.Contains(slotDurationMinutes)) return false;

            var studio = await _repo.GetOwnedStudioAsync(ownerId);
            if (studio == null) return false;

            studio.SlotDurationMinutes = slotDurationMinutes;
            studio.UpdatedAt = DateTime.UtcNow;
            studio.UpdatedBy = ownerId;
            await _repo.SaveChangesAsync();
            return true;
        }

        public async Task<List<WorkingDayResponse>> GetStudioDaysAsync(long studioId, DateOnly? from, DateOnly? to, bool includeClosed)
        {
            var days = await _repo.GetWorkingDaysAsync(studioId, from, to, includeClosed);
            return days.Select(MapWorkingDay).ToList();
        }

        public async Task<List<TimeSlotResponse>> GetStudioSlotsByDateAsync(long studioId, DateOnly date)
        {
            var slots = await _repo.GetSlotsByStudioDateAsync(studioId, date);
            return slots.Select(MapSlot).ToList();
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

                if (request.IsAvailable)
                {
                    var schedule = await _repo.GetScheduleAsync(studio.StudioId, (byte)date.DayOfWeek);
                    if (schedule != null && schedule.IsActive)
                    {
                        GenerateSlots(day, schedule.OpenTime, schedule.CloseTime, studio.SlotDurationMinutes);
                    }
                }
            }
            else
            {
                day.IsAvailable = request.IsAvailable;
                day.Note = request.Note;

                if (!request.IsAvailable)
                {
                    foreach (var slot in day.TimeSlots.Where(s => s.Status == SlotOpen))
                    {
                        slot.Status = SlotClosed;
                    }
                }
                else if (!day.TimeSlots.Any())
                {
                    var schedule = await _repo.GetScheduleAsync(studio.StudioId, (byte)date.DayOfWeek);
                    if (schedule != null && schedule.IsActive)
                    {
                        GenerateSlots(day, schedule.OpenTime, schedule.CloseTime, studio.SlotDurationMinutes);
                    }
                }
            }

            await _repo.SaveChangesAsync();
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

            var studio = await _repo.GetOwnedStudioAsync(ownerId);
            if (studio == null) return null;

            var day = await _repo.GetWorkingDayWithSlotsAsync(studio.StudioId, date);
            if (day == null)
            {
                day = new WorkingDay
                {
                    StudioId = studio.StudioId,
                    WorkingDate = date,
                    IsAvailable = true,
                    CreatedAt = DateTime.UtcNow
                };
                _repo.AddWorkingDay(day);
                await _repo.SaveChangesAsync();
            }

            if (!day.IsAvailable) return null;
            if (IsSlotInPast(date, start)) return null;
            if (day.TimeSlots.Any(s => start < s.EndTime && s.StartTime < end)) return null;

            var slot = new TimeSlot
            {
                WorkingDayId = day.WorkingDayId,
                StartTime = start,
                EndTime = end,
                Status = SlotOpen
            };
            _repo.AddSlot(slot);
            await _repo.SaveChangesAsync();

            slot.WorkingDay = day;
            return MapSlot(slot);
        }

        public async Task<bool> UpdateSlotStatusAsync(long ownerId, long slotId, string status)
        {
            status = status.ToUpperInvariant();
            if (status != SlotOpen && status != SlotClosed) return false;

            var studio = await _repo.GetOwnedStudioAsync(ownerId);
            var slot = await _repo.GetSlotWithWorkingDayAsync(slotId);
            if (studio == null || slot == null || slot.WorkingDay.StudioId != studio.StudioId) return false;
            if (slot.Status is SlotBooked or SlotHolding) return false;

            slot.Status = status;
            await _repo.SaveChangesAsync();
            return true;
        }

        public async Task<BookingResponse?> CreateBookingAsync(long customerId, CreateBookingRequest request)
        {
            var package = await _repo.GetActivePackageWithStudioAsync(request.PackageId);
            var slot = await _repo.GetSlotWithWorkingDayAsync(request.SlotId);

            if (package == null || slot == null) return null;
            if (slot.Status != SlotOpen) return null;
            if (!slot.WorkingDay.IsAvailable) return null;
            if (IsSlotInPast(slot.WorkingDay.WorkingDate, slot.StartTime)) return null;
            if (slot.WorkingDay.StudioId != package.Service.StudioId) return null;
            if (await _repo.SlotHasActiveBookingAsync(request.SlotId)) return null;
            if (package.Service.Studio.Status != "APPROVED" || package.Service.Studio.DeletedAt != null) return null;

            var pendingStatusId = await _repo.GetBookingStatusIdAsync(BookingPendingPayment);
            if (pendingStatusId == null) return null;

            await using var tx = await _repo.BeginTransactionAsync();

            var freshSlot = await _repo.GetSlotForUpdateAsync(request.SlotId);
            if (freshSlot == null || freshSlot.Status != SlotOpen) return null;
            if (await _repo.SlotHasActiveBookingAsync(request.SlotId)) return null;

            var commissionPercent = package.Service.Studio.CommissionPercent;
            var commissionAmount = Math.Round(package.Price * commissionPercent / 100m, 0);
            var now = DateTime.UtcNow;

            var booking = new Booking
            {
                CustomerId = customerId,
                StudioId = package.Service.StudioId,
                PackageId = package.PackageId,
                SlotId = slot.SlotId,
                StatusId = pendingStatusId.Value,
                BookingCode = $"BK-{now:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
                ShootingDate = slot.WorkingDay.WorkingDate,
                ShootingLocation = request.ShootingLocation,
                ShootingLat = request.ShootingLat,
                ShootingLng = request.ShootingLng,
                Note = request.Note,
                TotalPrice = package.Price,
                CommissionPercent = commissionPercent,
                CommissionAmount = commissionAmount,
                StudioRevenue = package.Price - commissionAmount,
                PaymentExpiresAt = now.AddMinutes(GetIntSetting("BookingHoldMinutes", 15)),
                PackageNameSnapshot = package.PackageName,
                ServiceNameSnapshot = package.Service.ServiceName,
                PackageDescriptionSnapshot = package.Description,
                PackageDurationHoursSnapshot = package.DurationHours,
                PackageMaxPhotosSnapshot = package.MaxPhotos,
                PackageInclusionsSnapshot = package.Inclusions,
                CreatedAt = now,
                UpdatedAt = now,
                CreatedBy = customerId,
                UpdatedBy = customerId
            };

            _repo.AddBooking(booking);
            freshSlot.Status = SlotHolding;
            await _repo.SaveChangesAsync();

            AddBookingLogEntry(booking.BookingId, null, BookingPendingPayment, customerId, "Booking created and slot held");
            await CreatePendingPaymentAsync(booking, "BANK_TRANSFER");
            await _repo.SaveChangesAsync();

            await tx.CommitAsync();

            try
            {
                await _notificationService.CreateNotificationAsync(
                    userId: package.Service.Studio.OwnerId,
                    title: "Yeu cau dat lich moi",
                    content: $"Khach hang vua gui yeu cau dat lich cho goi '{package.PackageName}' vao ngay {slot.WorkingDay.WorkingDate:dd/MM/yyyy}.",
                    type: "BOOKING",
                    refType: "BOOKING",
                    refId: booking.BookingId
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Notification] Error in CreateBookingAsync: {ex.Message}");
            }

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
                bookings = new List<Booking>();
            }

            return bookings.Select(booking => MapBooking(booking, role)).ToList();
        }

        public async Task<BookingResponse?> GetBookingForUserAsync(long userId, string role, long bookingId)
        {
            var booking = await _repo.GetFullBookingAsync(bookingId);
            if (booking == null) return null;
            if (!await CanAccessBookingAsync(userId, role, booking)) return null;
            return MapBooking(booking, role);
        }

        public async Task<string?> GetCustomerPhotoPreviewUrlAsync(long customerId, long bookingId, string deliveryType, int photoIndex)
        {
            if (photoIndex < 0) return null;

            var booking = await _repo.GetFullBookingAsync(bookingId);
            if (booking == null || booking.CustomerId != customerId) return null;

            var normalizedType = deliveryType.Trim().ToUpperInvariant();
            var urls = normalizedType switch
            {
                "DEMO" => ParseDeliveryUrls(booking.BookingLogs, BookingDemoUploaded),
                "FINAL" when booking.Status.StatusName != BookingCompleted => ParseDeliveryUrls(booking.BookingLogs, BookingFinalDelivered),
                _ => new List<string>()
            };

            if (photoIndex >= urls.Count) return null;
            return ToCloudinaryWatermarkedPreviewUrl(urls[photoIndex]);
        }

        public async Task<BookingResponse?> ConfirmBookingAsync(long ownerId, long bookingId)
            => await StudioTransitionAsync(
                ownerId,
                bookingId,
                BookingPendingConfirmation,
                BookingConfirmed,
                b => b.ConfirmedAt = DateTime.UtcNow,
                "Studio confirmed");

        public async Task<BookingResponse?> RejectBookingAsync(long ownerId, long bookingId, string? reason)
            => await StudioTransitionAsync(
                ownerId,
                bookingId,
                BookingPendingConfirmation,
                BookingRejected,
                async b =>
                {
                    b.RejectedAt = DateTime.UtcNow;
                    b.RejectReason = reason;
                    b.Slot.Status = SlotOpen;
                    await MarkLatestPaidPaymentForRefundAsync(b, reason ?? "Studio rejected booking");
                },
                reason ?? "Studio rejected");

        public async Task<BookingResponse?> MarkInProgressAsync(long ownerId, long bookingId)
            => await StudioTransitionAsync(ownerId, bookingId, BookingConfirmed, BookingInProgress, _ => { }, "Studio started booking");

        public async Task<BookingResponse?> UploadDemoPhotosAsync(long ownerId, long bookingId, PhotoDeliveryRequest request)
        {
            var urls = CleanPhotoUrls(request.PhotoUrls);
            if (urls.Count == 0) return null;

            return await StudioTransitionAsync(
                ownerId,
                bookingId,
                BookingInProgress,
                BookingDemoUploaded,
                _ => { },
                SerializeDeliveryNote(urls, request.Note));
        }

        public async Task<BookingResponse?> SubmitPhotoFeedbackAsync(long customerId, long bookingId, CustomerPhotoFeedbackRequest request)
        {
            var feedback = request.Feedback?.Trim();
            if (string.IsNullOrWhiteSpace(feedback)) return null;

            await using var tx = await _repo.BeginTransactionAsync();

            var booking = await _repo.GetBookingForUpdateAsync(bookingId);
            if (booking == null || booking.CustomerId != customerId) return null;
            if (IsDisputed(booking)) return null;
            if (booking.Status.StatusName != BookingDemoUploaded) return null;

            var editingId = await _repo.GetOrCreateBookingStatusIdAsync(BookingEditing);
            booking.StatusId = editingId;
            booking.UpdatedAt = DateTime.UtcNow;
            booking.UpdatedBy = customerId;

            AddBookingLogEntry(booking.BookingId, BookingDemoUploaded, BookingEditing, customerId, feedback);
            await _repo.SaveChangesAsync();
            await tx.CommitAsync();

            // â”€â”€ THÃŠM THÃ”NG BÃO CHO PHOTOGRAPHER KHI CÃ“ PHáº¢N Há»’I â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            try
            {
                await _notificationService.CreateNotificationAsync(
                    userId: booking.Studio.OwnerId,
                    title: "ðŸ’¬ Pháº£n há»“i áº£nh tá»« khÃ¡ch hÃ ng",
                    content: $"KhÃ¡ch hÃ ng Ä‘Ã£ gá»­i yÃªu cáº§u chá»‰nh sá»­a cho Ä‘Æ¡n Ä‘áº·t lá»‹ch #{booking.BookingCode}.",
                    type: "BOOKING",
                    refType: "BOOKING",
                    refId: booking.BookingId
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Notification] Error in SubmitPhotoFeedbackAsync: {ex.Message}");
            }

            return await GetBookingForUserAsync(customerId, "CUSTOMER", booking.BookingId);
        }

        public async Task<BookingResponse?> UploadFinalPhotosAsync(long ownerId, long bookingId, PhotoDeliveryRequest request)
        {
            var urls = CleanPhotoUrls(request.PhotoUrls);
            if (urls.Count == 0) return null;

            await using var tx = await _repo.BeginTransactionAsync();

            var studio = await _repo.GetOwnedStudioAsync(ownerId);
            var booking = await _repo.GetBookingForUpdateAsync(bookingId);
            if (studio == null || booking == null || booking.StudioId != studio.StudioId) return null;
            if (IsDisputed(booking)) return null;
            if (booking.Status.StatusName is not (BookingDemoUploaded or BookingEditing)) return null;

            var oldStatus = booking.Status.StatusName;
            var finalDeliveredId = await _repo.GetOrCreateBookingStatusIdAsync(BookingFinalDelivered);
            booking.StatusId = finalDeliveredId;
            booking.UpdatedAt = DateTime.UtcNow;
            booking.UpdatedBy = ownerId;

            AddBookingLogEntry(booking.BookingId, oldStatus, BookingFinalDelivered, ownerId, SerializeDeliveryNote(urls, request.Note));
            await _repo.SaveChangesAsync();
            await tx.CommitAsync();

            // â”€â”€ THÃŠM THÃ”NG BÃO CHO KHÃCH HÃ€NG KHI BÃ€N GIAO áº¢NH HOÃ€N CHá»ˆNH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            try
            {
                await _notificationService.CreateNotificationAsync(
                    userId: booking.CustomerId,
                    title: "ðŸŽ¨ ÄÃ£ bÃ n giao áº£nh hoÃ n chá»‰nh!",
                    content: $"Studio '{studio.StudioName}' Ä‘Ã£ táº£i lÃªn bá»™ áº£nh hoÃ n chá»‰nh. Vui lÃ²ng kiá»ƒm tra vÃ  xÃ¡c nháº­n hoÃ n thÃ nh.",
                    type: "BOOKING",
                    refType: "BOOKING",
                    refId: booking.BookingId
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Notification] Error in UploadFinalPhotosAsync: {ex.Message}");
            }

            return await GetBookingForUserAsync(ownerId, "STUDIO_OWNER", booking.BookingId);
        }

        public async Task<BookingResponse?> CompleteBookingAsync(long ownerId, long bookingId)
        {
            await using var tx = await _repo.BeginTransactionAsync();

            var studio = await _repo.GetOwnedStudioAsync(ownerId);
            var booking = await _repo.GetBookingForUpdateAsync(bookingId);
            if (studio == null || booking == null || booking.StudioId != studio.StudioId) return null;
            if (IsDisputed(booking)) return null;
            if (booking.Status.StatusName != BookingFinalDelivered) return null;

            var awaitingId = await _repo.GetOrCreateBookingStatusIdAsync("AWAITING_CUSTOMER");
            booking.StatusId = awaitingId;
            booking.UpdatedAt = DateTime.UtcNow;
            booking.UpdatedBy = ownerId;

            AddBookingLogEntry(booking.BookingId, BookingFinalDelivered, "AWAITING_CUSTOMER", ownerId, "Studio requested customer confirmation after final delivery");
            await _repo.SaveChangesAsync();
            await tx.CommitAsync();

            try
            {
                await _notificationService.CreateNotificationAsync(
                    userId: booking.CustomerId,
                    title: "Studio yÃªu cáº§u xÃ¡c nháº­n hoÃ n táº¥t",
                    content: $"Studio '{studio.StudioName}' Ä‘Ã£ giao áº£nh final cho Ä‘Æ¡n #{booking.BookingCode}. Vui lÃ²ng kiá»ƒm tra vÃ  xÃ¡c nháº­n hoÃ n táº¥t náº¿u má»i thá»© Ä‘Ãºng cam káº¿t.",
                    type: "BOOKING",
                    refType: "BOOKING",
                    refId: booking.BookingId
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Notification] Error in CompleteBookingAsync: {ex.Message}");
            }

            return await GetBookingForUserAsync(ownerId, "STUDIO_OWNER", booking.BookingId);
        }

        public async Task<BookingReviewResponse?> CreateReviewAsync(long customerId, long bookingId, CreateBookingReviewRequest request)
        {
            if (request.Rating is < 1 or > 5) return null;

            await using var tx = await _repo.BeginTransactionAsync();

            var booking = await _repo.GetBookingForUpdateAsync(bookingId);
            if (booking == null || booking.CustomerId != customerId) return null;
            if (booking.Status.StatusName != BookingCompleted) return null;
            if (await _repo.ReviewExistsAsync(bookingId)) return null;

            var now = DateTime.UtcNow;
            var review = new Review
            {
                BookingId = booking.BookingId,
                CustomerId = customerId,
                StudioId = booking.StudioId,
                Rating = request.Rating,
                Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim(),
                IsHidden = false,
                CreatedAt = now,
                UpdatedAt = now,
                UpdatedBy = customerId
            };

            _repo.AddReview(review);
            AddBookingLogEntry(booking.BookingId, BookingCompleted, "REVIEWED", customerId, "Customer reviewed booking");
            await _repo.SaveChangesAsync();
            await _repo.RecalculateStudioRatingAsync(booking.StudioId);
            await _repo.SaveChangesAsync();
            await tx.CommitAsync();

            return new BookingReviewResponse
            {
                Id = review.ReviewId,
                Rating = review.Rating,
                Comment = review.Comment,
                CreatedAt = review.CreatedAt.ToString("O")
            };
        }

        public async Task<BookingResponse?> ConfirmCompletionAsync(long customerId, long bookingId)
        {
            await using var tx = await _repo.BeginTransactionAsync();

            var booking = await _repo.GetBookingForUpdateAsync(bookingId);
            if (booking == null || booking.CustomerId != customerId) return null;
            if (IsDisputed(booking)) return null;
            if (booking.Status.StatusName != BookingFinalDelivered && booking.Status.StatusName != "AWAITING_CUSTOMER") return null;

            var completedId = await _repo.GetBookingStatusIdAsync(BookingCompleted);
            if (completedId == null) return null;

            var oldStatus = booking.Status.StatusName;

            booking.StatusId = completedId.Value;
            booking.CompletedAt = DateTime.UtcNow;
            booking.UpdatedAt = DateTime.UtcNow;
            booking.UpdatedBy = customerId;

            await CreateSettlementIfNeededAsync(booking);

            await _walletService.CreditStudioEarningAsync(
                booking.StudioId,
                booking.StudioRevenue,
                booking.BookingId,
                $"Studio revenue from Booking #{booking.BookingCode}");

            AddBookingLogEntry(booking.BookingId, oldStatus, BookingCompleted, customerId, "Customer confirmed final photos received");
            await _repo.SaveChangesAsync();
            await tx.CommitAsync();

            // â”€â”€ THÃŠM THÃ”NG BÃO CHO PHOTOGRAPHER KHI HOÃ€N THÃ€NH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            try
            {
                await _notificationService.CreateNotificationAsync(
                    userId: booking.Studio.OwnerId,
                    title: "ðŸŽ‰ Äáº·t lá»‹ch hoÃ n thÃ nh thÃ nh cÃ´ng!",
                    content: $"KhÃ¡ch hÃ ng Ä‘Ã£ xÃ¡c nháº­n hoÃ n thÃ nh Ä‘Æ¡n hÃ ng #{booking.BookingCode}. Tiá»n thanh toÃ¡n Ä‘Ã£ Ä‘Æ°á»£c cá»™ng vÃ o VÃ­ cá»§a báº¡n.",
                    type: "BOOKING",
                    refType: "BOOKING",
                    refId: booking.BookingId
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Notification] Error in ConfirmCompletionAsync: {ex.Message}");
            }

            return await GetBookingForUserAsync(customerId, "CUSTOMER", booking.BookingId);
        }

        public async Task<int> AutoCompleteDeliveredBookingsAsync()
        {
            var finalDeliveredId = await _repo.GetBookingStatusIdAsync(BookingFinalDelivered);
            var awaitingCustomerId = await _repo.GetBookingStatusIdAsync("AWAITING_CUSTOMER");
            if (finalDeliveredId == null || awaitingCustomerId == null) return 0;

            // 3 days threshold
            var threshold = DateTime.UtcNow.AddDays(-3);
            var expiredBookings = await _repo.GetExpiredFinalDeliveredBookingsAsync(finalDeliveredId.Value, awaitingCustomerId.Value, threshold, 50);
            var completedId = await _repo.GetBookingStatusIdAsync(BookingCompleted);
            if (completedId == null) return 0;

            var count = 0;
            foreach (var b in expiredBookings)
            {
                await using var tx = await _repo.BeginTransactionAsync();
                var booking = await _repo.GetBookingForUpdateAsync(b.BookingId);
                if (booking == null) continue;
                if (booking.Status.StatusName != BookingFinalDelivered && booking.Status.StatusName != "AWAITING_CUSTOMER") continue;
                if (booking.DisputedAt != null) continue; // safety check

                var oldStatus = booking.Status.StatusName;
                booking.StatusId = completedId.Value;
                booking.CompletedAt = DateTime.UtcNow;
                booking.UpdatedAt = DateTime.UtcNow;
                booking.UpdatedBy = 0; // 0 represents System auto-complete

                await CreateSettlementIfNeededAsync(booking);

                await _walletService.CreditStudioEarningAsync(
                    booking.StudioId,
                    booking.StudioRevenue,
                    booking.BookingId,
                    $"Studio revenue from Booking #{booking.BookingCode} (Auto-completed)");

                AddBookingLogEntry(booking.BookingId, oldStatus, BookingCompleted, 0, "System auto-completed booking (customer did not dispute/confirm in 3 days)");
                await _repo.SaveChangesAsync();
                await tx.CommitAsync();

                // Send notifications
                try
                {
                    // Notify Studio Owner
                    await _notificationService.CreateNotificationAsync(
                        userId: booking.Studio.OwnerId,
                        title: "ðŸŽ‰ Äáº·t lá»‹ch tá»± Ä‘á»™ng hoÃ n thÃ nh!",
                        content: $"ÄÆ¡n hÃ ng #{booking.BookingCode} Ä‘Ã£ Ä‘Æ°á»£c há»‡ thá»‘ng tá»± Ä‘á»™ng hoÃ n thÃ nh do quÃ¡ háº¡n nháº­n áº£nh 3 ngÃ y. Doanh thu Ä‘Ã£ Ä‘Æ°á»£c cá»™ng vÃ o VÃ­ cá»§a báº¡n.",
                        type: "BOOKING",
                        refType: "BOOKING",
                        refId: booking.BookingId
                    );

                    // Notify Customer
                    await _notificationService.CreateNotificationAsync(
                        userId: booking.CustomerId,
                        title: "ðŸ“… Äáº·t lá»‹ch Ä‘Ã£ Ä‘Æ°á»£c hoÃ n thÃ nh tá»± Ä‘á»™ng",
                        content: $"ÄÆ¡n hÃ ng #{booking.BookingCode} Ä‘Ã£ Ä‘Æ°á»£c há»‡ thá»‘ng tá»± Ä‘á»™ng hoÃ n thÃ nh do khÃ´ng cÃ³ khiáº¿u náº¡i trong vÃ²ng 3 ngÃ y ká»ƒ tá»« khi nháº­n áº£nh.",
                        type: "BOOKING",
                        refType: "BOOKING",
                        refId: booking.BookingId
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Notification] Error in AutoCompleteDeliveredBookingsAsync: {ex.Message}");
                }

                count++;
            }

            return count;
        }

        public async Task<BookingResponse?> CancelBookingAsync(long userId, string role, long bookingId, string? reason)
        {
            await using var tx = await _repo.BeginTransactionAsync();

            var booking = await _repo.GetBookingForUpdateAsync(bookingId);
            if (booking == null || !await CanAccessBookingAsync(userId, role, booking)) return null;

            var oldStatus = booking.Status.StatusName;
            var oldEffectiveStatus = IsDisputed(booking) ? "DISPUTED" : oldStatus;
            var canCancel = role switch
            {
                "CUSTOMER" => oldStatus is BookingPendingPayment or BookingPendingConfirmation or BookingConfirmed && !IsDisputed(booking),
                "STUDIO_OWNER" => oldStatus is BookingPendingConfirmation or BookingConfirmed && !IsDisputed(booking),
                "ADMIN" => oldStatus is BookingPendingPayment or BookingPendingConfirmation or BookingConfirmed or BookingInProgress,
                _ => false
            };

            if (!canCancel) return null;

            var cancelledId = await _repo.GetBookingStatusIdAsync(BookingCancelled);
            if (cancelledId == null) return null;

            booking.StatusId = cancelledId.Value;
            booking.CancelledAt = DateTime.UtcNow;
            booking.CancelledBy = userId;
            booking.CancelReason = reason;
            booking.UpdatedAt = DateTime.UtcNow;
            booking.UpdatedBy = userId;
            booking.Slot.Status = SlotOpen;

            await ReleasePendingRescheduleSlotAsync(booking, userId, "Booking cancelled");

            if (oldStatus == BookingPendingPayment)
            {
                MarkLatestPayment(booking, PaymentFailed, "Booking cancelled before payment");
            }
            else
            {
                var cancellationQuote = CalculateCancellationQuote(booking, role);
                await ApplyCancellationFinancialsAsync(booking, cancellationQuote, reason ?? $"{role} cancelled booking");
                AddBookingLogEntry(
                    booking.BookingId,
                    oldEffectiveStatus,
                    BookingCancelled,
                    userId,
                    BuildCancellationLogNote(reason ?? $"{role} cancelled booking", cancellationQuote));
            }

            if (oldStatus == BookingPendingPayment)
            {
                AddBookingLogEntry(booking.BookingId, oldEffectiveStatus, BookingCancelled, userId, reason ?? $"{role} cancelled booking");
            }
            await _repo.SaveChangesAsync();
            await tx.CommitAsync();

            try
            {
                if (role == "CUSTOMER")
                {
                    await _notificationService.CreateNotificationAsync(
                        userId: booking.Studio.OwnerId,
                        title: "Booking bi huy boi khach hang",
                        content: $"Khach hang da huy booking #{booking.BookingCode}. Ly do: {reason ?? "Khong co ly do cu the"}.",
                        type: "BOOKING",
                        refType: "BOOKING",
                        refId: booking.BookingId
                    );
                }
                else if (role == "STUDIO_OWNER")
                {
                    await _notificationService.CreateNotificationAsync(
                        userId: booking.CustomerId,
                        title: "Booking bi huy boi Studio",
                        content: $"Studio da huy booking #{booking.BookingCode}. Ly do: {reason ?? "Khong co ly do cu the"}.",
                        type: "BOOKING",
                        refType: "BOOKING",
                        refId: booking.BookingId
                    );
                }
                else if (role == "ADMIN")
                {
                    await _notificationService.CreateNotificationAsync(
                        userId: booking.CustomerId,
                        title: "Booking bi huy boi he thong",
                        content: $"Booking #{booking.BookingCode} da bi huy boi quan tri vien.",
                        type: "BOOKING",
                        refType: "BOOKING",
                        refId: booking.BookingId
                    );
                    await _notificationService.CreateNotificationAsync(
                        userId: booking.Studio.OwnerId,
                        title: "Booking bi huy boi he thong",
                        content: $"Booking #{booking.BookingCode} da bi huy boi quan tri vien.",
                        type: "BOOKING",
                        refType: "BOOKING",
                        refId: booking.BookingId
                    );
                }
            }
            catch (Exception ex)
            {
                 Console.WriteLine($"[Notification] Error in CancelBookingAsync: {ex.Message}");
            }

            return await GetBookingForUserAsync(userId, role, booking.BookingId);
        }

        public async Task<BookingResponse?> RequestRescheduleAsync(long customerId, long bookingId, RescheduleBookingRequest request)
        {
            if (request.NewSlotId <= 0) return null;

            await using var tx = await _repo.BeginTransactionAsync();

            var booking = await _repo.GetBookingForUpdateAsync(bookingId);
            if (booking == null || booking.CustomerId != customerId) return null;
            if (IsDisputed(booking)) return null;
            if (booking.Status.StatusName is not (BookingPendingConfirmation or BookingConfirmed)) return null;
            if (GetPendingRescheduleRequest(booking) != null) return null;
            if (request.NewSlotId == booking.SlotId) return null;

            var newSlot = await _repo.GetSlotForUpdateWithWorkingDayAsync(request.NewSlotId);
            if (newSlot == null) return null;
            if (!await IsSlotUsableForRescheduleAsync(newSlot, booking.StudioId)) return null;

            newSlot.Status = SlotHolding;
            var payload = BuildRescheduleRequestPayload(customerId, "CUSTOMER", newSlot, request.Reason);
            AddBookingLogEntry(booking.BookingId, booking.Status.StatusName, BookingRescheduleRequested, customerId, JsonSerializer.Serialize(payload));

            booking.UpdatedAt = DateTime.UtcNow;
            booking.UpdatedBy = customerId;
            await _repo.SaveChangesAsync();
            await tx.CommitAsync();

            try
            {
                await _notificationService.CreateNotificationAsync(
                    userId: booking.Studio.OwnerId,
                    title: "Khach yeu cau doi lich",
                    content: $"Khach hang yeu cau doi booking #{booking.BookingCode} sang {payload.NewDate} {payload.NewStartTime}-{payload.NewEndTime}.",
                    type: "BOOKING",
                    refType: "BOOKING",
                    refId: booking.BookingId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Notification] Error in RequestRescheduleAsync: {ex.Message}");
            }

            return await GetBookingForUserAsync(customerId, "CUSTOMER", booking.BookingId);
        }

        public async Task<BookingResponse?> RespondRescheduleAsync(long ownerId, long bookingId, bool approve, string? reason)
        {
            await using var tx = await _repo.BeginTransactionAsync();

            var booking = await _repo.GetBookingForUpdateAsync(bookingId);
            if (booking == null) return null;
            if (!await _repo.IsStudioOwnerAsync(booking.StudioId, ownerId)) return null;
            if (IsDisputed(booking)) return null;

            var pending = GetPendingRescheduleRequest(booking);
            if (pending == null) return null;
            if (booking.Status.StatusName is not (BookingPendingConfirmation or BookingConfirmed)) return null;

            var newSlot = await _repo.GetSlotForUpdateWithWorkingDayAsync(pending.NewSlotId);
            if (newSlot == null) return null;

            if (approve)
            {
                if (newSlot.WorkingDay.StudioId != booking.StudioId) return null;
                if (!newSlot.WorkingDay.IsAvailable) return null;
                if (IsSlotInPast(newSlot.WorkingDay.WorkingDate, newSlot.StartTime)) return null;
                if (newSlot.Status is not (SlotHolding or SlotOpen)) return null;
                if (await _repo.SlotHasActiveBookingAsync(newSlot.SlotId)) return null;

                booking.Slot.Status = SlotOpen;
                booking.SlotId = newSlot.SlotId;
                booking.ShootingDate = newSlot.WorkingDay.WorkingDate;
                newSlot.Status = SlotBooked;
                booking.UpdatedAt = DateTime.UtcNow;
                booking.UpdatedBy = ownerId;

                AddBookingLogEntry(
                    booking.BookingId,
                    booking.Status.StatusName,
                    BookingRescheduleApproved,
                    ownerId,
                    BuildRescheduleDecisionNote(pending, reason ?? "Studio approved reschedule"));
            }
            else
            {
                if (newSlot.Status == SlotHolding)
                {
                    newSlot.Status = SlotOpen;
                }

                booking.UpdatedAt = DateTime.UtcNow;
                booking.UpdatedBy = ownerId;
                AddBookingLogEntry(
                    booking.BookingId,
                    booking.Status.StatusName,
                    BookingRescheduleRejected,
                    ownerId,
                    BuildRescheduleDecisionNote(pending, reason ?? "Studio rejected reschedule"));
            }

            await _repo.SaveChangesAsync();
            await tx.CommitAsync();

            try
            {
                await _notificationService.CreateNotificationAsync(
                    userId: booking.CustomerId,
                    title: approve ? "Studio da duyet doi lich" : "Studio tu choi doi lich",
                    content: approve
                        ? $"Booking #{booking.BookingCode} da duoc doi sang lich moi."
                        : $"Yeu cau doi lich booking #{booking.BookingCode} da bi tu choi.",
                    type: "BOOKING",
                    refType: "BOOKING",
                    refId: booking.BookingId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Notification] Error in RespondRescheduleAsync: {ex.Message}");
            }

            return await GetBookingForUserAsync(ownerId, "STUDIO_OWNER", booking.BookingId);
        }

        public async Task<BookingResponse?> MarkCustomerNoShowAsync(long ownerId, long bookingId, string? reason)
        {
            await using var tx = await _repo.BeginTransactionAsync();

            var booking = await _repo.GetBookingForUpdateAsync(bookingId);
            if (booking == null) return null;
            if (!await _repo.IsStudioOwnerAsync(booking.StudioId, ownerId)) return null;
            if (IsDisputed(booking)) return null;
            if (booking.Status.StatusName is not (BookingConfirmed or BookingInProgress)) return null;
            if (!IsNoShowAllowed(booking)) return null;

            var oldStatus = booking.Status.StatusName;
            var cancelledId = await _repo.GetBookingStatusIdAsync(BookingCancelled);
            if (cancelledId == null) return null;

            booking.StatusId = cancelledId.Value;
            booking.CancelledAt = DateTime.UtcNow;
            booking.CancelledBy = ownerId;
            booking.CancelReason = reason ?? "Customer no-show";
            booking.UpdatedAt = DateTime.UtcNow;
            booking.UpdatedBy = ownerId;
            booking.Slot.Status = SlotOpen;

            await ReleasePendingRescheduleSlotAsync(booking, ownerId, "Customer no-show");

            var quote = CalculateNoShowQuote(booking);
            await ApplyCancellationFinancialsAsync(booking, quote, reason ?? "Customer no-show");
            AddBookingLogEntry(booking.BookingId, oldStatus, BookingNoShow, ownerId, BuildCancellationLogNote(reason ?? "Customer no-show", quote));

            await _repo.SaveChangesAsync();
            await tx.CommitAsync();

            try
            {
                await _notificationService.CreateNotificationAsync(
                    userId: booking.CustomerId,
                    title: "Studio bao khach khong den",
                    content: $"Studio da danh dau booking #{booking.BookingCode} la khach khong den. Neu khong dong y, ban co the khieu nai de Admin xu ly.",
                    type: "BOOKING",
                    refType: "BOOKING",
                    refId: booking.BookingId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Notification] Error in MarkCustomerNoShowAsync: {ex.Message}");
            }

            return await GetBookingForUserAsync(ownerId, "STUDIO_OWNER", booking.BookingId);
        }

        public async Task<BookingResponse?> DisputeBookingAsync(long userId, string role, long bookingId, string reason)
        {
            if (string.IsNullOrWhiteSpace(reason)) return null;

            await using var tx = await _repo.BeginTransactionAsync();

            var booking = await _repo.GetBookingForUpdateAsync(bookingId);
            if (booking == null) return null;

            // PhÃ¢n quyá»n
            if (role == "CUSTOMER")
            {
                if (booking.CustomerId != userId) return null;
            }
            else if (role == "STUDIO_OWNER")
            {
                if (!await _repo.IsStudioOwnerAsync(booking.StudioId, userId)) return null;
            }
            else
            {
                return null;
            }

            var currentStatus = booking.Status.StatusName;
            if (currentStatus != BookingConfirmed &&
                currentStatus != BookingInProgress && 
                currentStatus != BookingDemoUploaded && 
                currentStatus != BookingEditing && 
                currentStatus != BookingFinalDelivered && 
                currentStatus != "AWAITING_CUSTOMER")
            {
                return null;
            }
            if (IsDisputed(booking)) return null;

            booking.DisputedAt = DateTime.UtcNow;
            booking.DisputeNote = reason.Trim();
            booking.DisputeCreatedBy = userId;
            booking.DisputeCreatedByRole = role;
            booking.UpdatedAt = DateTime.UtcNow;
            booking.UpdatedBy = userId;

            AddBookingLogEntry(booking.BookingId, currentStatus, "DISPUTED", userId, reason.Trim());
            await _repo.SaveChangesAsync();
            await tx.CommitAsync();

            // â”€â”€ THÃŠM THÃ”NG BÃO KHI CÃ“ KHIáº¾U Náº I â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            try
            {
                if (role == "CUSTOMER")
                {
                    // ThÃ´ng bÃ¡o cho Studio Owner
                    await _notificationService.CreateNotificationAsync(
                        userId: booking.Studio.OwnerId,
                        title: "âš ï¸ Khiáº¿u náº¡i Ä‘áº·t lá»‹ch má»›i",
                        content: $"KhÃ¡ch hÃ ng Ä‘Ã£ gá»­i khiáº¿u náº¡i cho Ä‘Æ¡n hÃ ng #{booking.BookingCode}. Chi tiáº¿t: {reason.Trim()}.",
                        type: "BOOKING",
                        refType: "BOOKING",
                        refId: booking.BookingId
                    );
                }
                else if (role == "STUDIO_OWNER")
                {
                    // ThÃ´ng bÃ¡o cho Customer
                    await _notificationService.CreateNotificationAsync(
                        userId: booking.CustomerId,
                        title: "âš ï¸ Studio khiáº¿u náº¡i Ä‘Æ¡n hÃ ng",
                        content: $"Studio '{booking.Studio.StudioName}' Ä‘Ã£ gá»­i khiáº¿u náº¡i cho Ä‘Æ¡n hÃ ng #{booking.BookingCode}. Chi tiáº¿t: {reason.Trim()}.",
                        type: "BOOKING",
                        refType: "BOOKING",
                        refId: booking.BookingId
                    );
                }

                // ThÃ´ng bÃ¡o cho táº¥t cáº£ Admin
                var adminIds = await _notificationService.GetAdminUserIdsAsync();
                var initiatorName = role == "CUSTOMER" ? booking.Customer.FullName : booking.Studio.StudioName;
                var initiatorType = role == "CUSTOMER" ? "KhÃ¡ch hÃ ng" : "Studio";
                foreach (var adminId in adminIds)
                {
                    await _notificationService.CreateNotificationAsync(
                        userId: adminId,
                        title: "ðŸ›¡ï¸ YÃªu cáº§u há»— trá»£ khiáº¿u náº¡i má»›i",
                        content: $"{initiatorType} '{initiatorName}' Ä‘Ã£ khiáº¿u náº¡i Ä‘Æ¡n #{booking.BookingCode}.",
                        type: "SYSTEM",
                        refType: "BOOKING",
                        refId: booking.BookingId
                    );
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Notification] Error in DisputeBookingAsync: {ex.Message}");
            }

            return await GetBookingForUserAsync(userId, role, booking.BookingId);
        }

        public async Task<List<BookingDisputeEvidenceResponse>?> GetDisputeEvidencesAsync(long userId, string role, long bookingId)
        {
            var booking = await _repo.GetFullBookingAsync(bookingId);
            if (booking == null) return null;
            if (!await CanAccessDisputeEvidenceAsync(userId, role, booking)) return null;

            var evidences = await _repo.GetDisputeEvidencesByBookingAsync(bookingId);
            return evidences.Select(MapDisputeEvidence).ToList();
        }

        public async Task<BookingDisputeEvidenceResponse?> AddDisputeEvidenceAsync(long userId, string role, long bookingId, CreateBookingDisputeEvidenceRequest request)
        {
            if (role is not ("CUSTOMER" or "STUDIO_OWNER")) return null;

            var fileUrl = request.FileUrl?.Trim();
            if (!IsValidEvidenceUrl(fileUrl)) return null;

            await using var tx = await _repo.BeginTransactionAsync();

            var booking = await _repo.GetBookingForUpdateAsync(bookingId);
            if (booking == null) return null;
            if (!await CanAccessDisputeEvidenceAsync(userId, role, booking)) return null;
            if (!IsDisputed(booking)) return null;

            var now = DateTime.UtcNow;
            var fileType = NormalizeEvidenceFileType(request.FileType, fileUrl!);
            var note = TrimToNull(request.Note, 2000);

            var evidence = new BookingDisputeEvidence
            {
                BookingId = booking.BookingId,
                UploadedBy = userId,
                UploadedByRole = role,
                FileUrl = fileUrl!,
                FileType = fileType,
                Note = note,
                CreatedAt = now
            };

            _repo.AddDisputeEvidence(evidence);
            booking.UpdatedAt = now;
            booking.UpdatedBy = userId;

            var logNote = string.IsNullOrWhiteSpace(note)
                ? $"Dispute evidence uploaded ({fileType})"
                : $"Dispute evidence uploaded ({fileType}): {note}";
            AddBookingLogEntry(booking.BookingId, "DISPUTED", "DISPUTE_EVIDENCE", userId, logNote);

            await _repo.SaveChangesAsync();
            await tx.CommitAsync();

            var saved = (await _repo.GetDisputeEvidencesByBookingAsync(booking.BookingId))
                .FirstOrDefault(e => e.EvidenceId == evidence.EvidenceId);

            return MapDisputeEvidence(saved ?? evidence);
        }

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
            await using var tx = await _repo.BeginTransactionAsync();

            var booking = await _repo.GetBookingForUpdateAsync(request.BookingId);
            if (booking == null || booking.CustomerId != customerId) return null;
            if (booking.Status.StatusName != BookingPendingPayment) return null;
            if (booking.PaymentExpiresAt != null && booking.PaymentExpiresAt <= DateTime.UtcNow) return null;

            var payment = booking.Payments.OrderByDescending(p => p.CreatedAt).FirstOrDefault()
                ?? await CreatePendingPaymentAsync(booking, request.MethodName);

            var method = await _repo.GetPaymentMethodAsync(request.MethodName)
                ?? await _repo.GetPaymentMethodAsync("BANK_TRANSFER");
            var paidStatus = await _repo.GetPaymentStatusAsync(PaymentPaid);
            var pendingConfirmationId = await _repo.GetBookingStatusIdAsync(BookingPendingConfirmation);
            if (method == null || paidStatus == null || pendingConfirmationId == null) return null;
            if (booking.Slot.Status != SlotHolding) return null;

            payment.MethodId = method.MethodId;
            payment.Method = method;
            payment.PaymentStatusId = paidStatus.PaymentStatusId;
            payment.PaymentStatus = paidStatus;
            payment.PaymentProvider = method.MethodName;
            payment.TransactionCode = request.TransactionCode ?? $"SIM-{Guid.NewGuid().ToString("N")[..12].ToUpperInvariant()}";
            payment.PaidAt = DateTime.UtcNow;
            payment.UpdatedAt = DateTime.UtcNow;

            booking.StatusId = pendingConfirmationId.Value;
            booking.PaymentExpiresAt = null;
            booking.UpdatedAt = DateTime.UtcNow;
            booking.UpdatedBy = customerId;
            booking.Slot.Status = SlotBooked;

            AddBookingLogEntry(booking.BookingId, BookingPendingPayment, BookingPendingConfirmation, customerId, $"Payment simulated via {method.MethodName}");
            await _repo.SaveChangesAsync();
            await tx.CommitAsync();

            // â”€â”€ THÃŠM THÃ”NG BÃO CHO PHOTOGRAPHER KHI Lá»ŠCH ÄÃƒ THANH TOÃN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            try
            {
                await _notificationService.CreateNotificationAsync(
                    userId: booking.Studio.OwnerId,
                    title: "ðŸ’° Äáº·t lá»‹ch Ä‘Ã£ Ä‘Æ°á»£c thanh toÃ¡n",
                    content: $"Lá»‹ch chá»¥p ngÃ y {booking.ShootingDate:dd/MM/yyyy} Ä‘Ã£ Ä‘Æ°á»£c thanh toÃ¡n. Vui lÃ²ng vÃ o xÃ¡c nháº­n lá»‹ch chá»¥p.",
                    type: "BOOKING",
                    refType: "BOOKING",
                    refId: booking.BookingId
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Notification] Error in PayBookingAsync: {ex.Message}");
            }

            return MapPayment(payment);
        }

        public async Task<int> ExpirePendingBookingsAsync()
        {
            var pendingStatusId = await _repo.GetBookingStatusIdAsync(BookingPendingPayment);
            if (pendingStatusId == null) return 0;

            var now = DateTime.UtcNow;
            var batchSize = GetIntSetting("BookingExpiryBatchSize", 100);
            var expired = await _repo.GetExpiredPendingPaymentBookingsAsync(pendingStatusId.Value, now, batchSize);
            var count = 0;

            foreach (var item in expired)
            {
                await using var tx = await _repo.BeginTransactionAsync();
                var booking = await _repo.GetBookingForUpdateAsync(item.BookingId);
                if (booking == null ||
                    booking.Status.StatusName != BookingPendingPayment ||
                    booking.PaymentExpiresAt == null ||
                    booking.PaymentExpiresAt > now)
                {
                    continue;
                }

                var cancelledId = await _repo.GetBookingStatusIdAsync(BookingCancelled);
                if (cancelledId == null) continue;

                booking.StatusId = cancelledId.Value;
                booking.CancelledAt = now;
                booking.CancelReason = "Payment hold expired";
                booking.UpdatedAt = now;
                booking.Slot.Status = SlotOpen;
                MarkLatestPayment(booking, PaymentFailed, "Payment hold expired");
                AddBookingLogEntry(booking.BookingId, BookingPendingPayment, BookingCancelled, booking.CustomerId, "Payment hold expired");

                await _repo.SaveChangesAsync();
                await tx.CommitAsync();
                count++;
            }

            return count;
        }

        public async Task<string?> CreateVnPayPaymentUrlAsync(long customerId, long bookingId, string ipAddress)
        {
            var booking = await _repo.GetBookingForUpdateAsync(bookingId);
            if (booking == null || booking.CustomerId != customerId) return null;
            if (booking.Status.StatusName != BookingPendingPayment) return null;
            if (booking.PaymentExpiresAt != null && booking.PaymentExpiresAt <= DateTime.UtcNow) return null;

            var version = GetVnPaySetting("Version", "2.1.0");
            var command = GetVnPaySetting("Command", "pay");
            var tmnCode = GetRequiredVnPaySetting("TmnCode");
            var hashSecret = GetRequiredVnPaySetting("HashSecret");
            var returnUrl = GetRequiredVnPaySetting("ReturnUrl");
            var baseUrl = GetVnPaySetting("BaseUrl", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");

            if (!Uri.TryCreate(baseUrl, UriKind.Absolute, out _))
            {
                throw new InvalidOperationException("Invalid VNPay configuration: VnPay:BaseUrl must be an absolute URL.");
            }

            if (!Uri.TryCreate(returnUrl, UriKind.Absolute, out _))
            {
                throw new InvalidOperationException("Invalid VNPay configuration: VnPay:ReturnUrl must be an absolute URL.");
            }

            var vnpayMethod = await _repo.GetPaymentMethodAsync("VNPAY")
                ?? throw new InvalidOperationException("Payment method VNPAY was not found. Please seed payment_methods first.");

            // Get or create pending payment for VNPAY
            var payment = booking.Payments.OrderByDescending(p => p.CreatedAt).FirstOrDefault()
                ?? await CreatePendingPaymentAsync(booking, "VNPAY");

            payment.MethodId = vnpayMethod.MethodId;
            payment.Method = vnpayMethod;
            payment.PaymentProvider = baseUrl.Contains("sandbox", StringComparison.OrdinalIgnoreCase)
                ? "VNPAY_SANDBOX"
                : "VNPAY_PRODUCTION";

            await _repo.SaveChangesAsync();

            // Build VNPay request URL
            var vnpay = new VnPayLibrary();
            vnpay.AddRequestData("vnp_Version", version);
            vnpay.AddRequestData("vnp_Command", command);
            vnpay.AddRequestData("vnp_TmnCode", tmnCode);
            vnpay.AddRequestData("vnp_Amount", ((long)(payment.Amount * 100)).ToString());
            vnpay.AddRequestData("vnp_CreateDate", DateTime.UtcNow.AddHours(7).ToString("yyyyMMddHHmmss")); // VNPay expects Vietnam local time (UTC+7)
            vnpay.AddRequestData("vnp_CurrCode", "VND");
            vnpay.AddRequestData("vnp_IpAddr", ipAddress);
            vnpay.AddRequestData("vnp_Locale", "vn");
            vnpay.AddRequestData("vnp_OrderInfo", $"Thanh toan booking {booking.BookingCode}");
            vnpay.AddRequestData("vnp_OrderType", "other");
            vnpay.AddRequestData("vnp_ReturnUrl", returnUrl);
            vnpay.AddRequestData("vnp_TxnRef", payment.PaymentCode);
            if (booking.PaymentExpiresAt != null)
            {
                vnpay.AddRequestData("vnp_ExpireDate", booking.PaymentExpiresAt.Value.AddHours(7).ToString("yyyyMMddHHmmss"));
            }

            return vnpay.CreateRequestUrl(baseUrl, hashSecret);
        }

        public async Task<bool> ProcessVnPayReturnAsync(Dictionary<string, string> vnpayParams)
        {
            var hashSecret = GetVnPaySetting("HashSecret");
            if (string.IsNullOrWhiteSpace(hashSecret)) return false;

            var vnpay = new VnPayLibrary();
            foreach (var kv in vnpayParams)
            {
                vnpay.AddResponseData(kv.Key, kv.Value);
            }

            vnpayParams.TryGetValue("vnp_SecureHash", out var secureHash);
            if (string.IsNullOrEmpty(secureHash) || !vnpay.ValidateSignature(secureHash, hashSecret))
            {
                return false; // Signature invalid
            }

            vnpayParams.TryGetValue("vnp_TxnRef", out var paymentCode);
            if (string.IsNullOrEmpty(paymentCode)) return false;

            await using var tx = await _repo.BeginTransactionAsync();

            var booking = await _repo.GetBookingByPaymentCodeAsync(paymentCode);
            if (booking == null) return false;

            var payment = booking.Payments.FirstOrDefault(p => p.PaymentCode == paymentCode);
            if (payment == null) return false;

            // Only process if payment is PENDING (prevents duplicate requests - idempotent check)
            if (payment.PaymentStatus.StatusName != PaymentPending)
            {
                await tx.CommitAsync();
                return true; // Already processed
            }

            vnpayParams.TryGetValue("vnp_ResponseCode", out var responseCode);
            vnpayParams.TryGetValue("vnp_TransactionStatus", out var transactionStatus);
            vnpayParams.TryGetValue("vnp_TransactionNo", out var transactionNo);

            var success = responseCode == "00" && transactionStatus == "00";

            if (success)
            {
                var paidStatus = await _repo.GetPaymentStatusAsync(PaymentPaid);
                var pendingConfirmationId = await _repo.GetBookingStatusIdAsync(BookingPendingConfirmation);
                if (paidStatus == null || pendingConfirmationId == null) return false;

                payment.PaymentStatusId = paidStatus.PaymentStatusId;
                payment.PaymentStatus = paidStatus;
                payment.TransactionCode = transactionNo ?? $"VNP-{Guid.NewGuid().ToString("N")[..12].ToUpperInvariant()}";
                payment.PaidAt = DateTime.UtcNow;
                payment.UpdatedAt = DateTime.UtcNow;

                booking.StatusId = pendingConfirmationId.Value;
                booking.PaymentExpiresAt = null;
                booking.UpdatedAt = DateTime.UtcNow;
                booking.Slot.Status = SlotBooked;

                AddBookingLogEntry(booking.BookingId, BookingPendingPayment, BookingPendingConfirmation, booking.CustomerId, "Paid successfully via VNPAY Sandbox");
            }
            else
            {
                var failedStatus = await _repo.GetPaymentStatusAsync(PaymentFailed);
                var cancelledId = await _repo.GetBookingStatusIdAsync(BookingCancelled);
                if (failedStatus == null || cancelledId == null) return false;

                payment.PaymentStatusId = failedStatus.PaymentStatusId;
                payment.PaymentStatus = failedStatus;
                payment.FailureReason = $"VNPay failed code {responseCode}";
                payment.UpdatedAt = DateTime.UtcNow;

                booking.StatusId = cancelledId.Value;
                booking.CancelledAt = DateTime.UtcNow;
                booking.CancelReason = $"Payment failed via VNPay";
                booking.UpdatedAt = DateTime.UtcNow;
                booking.Slot.Status = SlotOpen;

                AddBookingLogEntry(booking.BookingId, BookingPendingPayment, BookingCancelled, booking.CustomerId, $"Payment failed via VNPay: {responseCode}");
            }

            await _repo.SaveChangesAsync();
            await tx.CommitAsync();

            return success;
        }

        private async Task<BookingResponse?> StudioTransitionAsync(
            long ownerId,
            long bookingId,
            string expectedStatus,
            string nextStatus,
            Action<Booking> mutate,
            string? note)
        {
            return await StudioTransitionAsync(ownerId, bookingId, expectedStatus, nextStatus, b =>
            {
                mutate(b);
                return Task.CompletedTask;
            }, note);
        }

        private async Task<BookingResponse?> StudioTransitionAsync(
            long ownerId,
            long bookingId,
            string expectedStatus,
            string nextStatus,
            Func<Booking, Task> mutate,
            string? note)
        {
            await using var tx = await _repo.BeginTransactionAsync();

            var studio = await _repo.GetOwnedStudioAsync(ownerId);
            var booking = await _repo.GetBookingForUpdateAsync(bookingId);
            if (studio == null || booking == null || booking.StudioId != studio.StudioId) return null;
            if (IsDisputed(booking)) return null;
            if (booking.Status.StatusName != expectedStatus) return null;

            var nextStatusId = await _repo.GetOrCreateBookingStatusIdAsync(nextStatus);

            await mutate(booking);
            booking.StatusId = nextStatusId;
            booking.UpdatedAt = DateTime.UtcNow;
            booking.UpdatedBy = ownerId;
            AddBookingLogEntry(booking.BookingId, expectedStatus, nextStatus, ownerId, note);

            await _repo.SaveChangesAsync();
            await tx.CommitAsync();

            // â”€â”€ THÃŠM THÃ”NG BÃO CHO KHÃCH HÃ€NG KHI STUDIO CÃ“ Sá»° THAY Äá»”I TRáº NG THÃI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            try
            {
                string title = "ðŸ“… Cáº­p nháº­t Ä‘Æ¡n Ä‘áº·t lá»‹ch";
                string content = $"ÄÆ¡n Ä‘áº·t lá»‹ch cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c cáº­p nháº­t tráº¡ng thÃ¡i má»›i: {nextStatus}.";

                if (nextStatus == BookingConfirmed)
                {
                    title = "ðŸŽ‰ Äáº·t lá»‹ch Ä‘Ã£ Ä‘Æ°á»£c xÃ¡c nháº­n!";
                    content = $"Studio '{studio.StudioName}' Ä‘Ã£ xÃ¡c nháº­n yÃªu cáº§u Ä‘áº·t lá»‹ch cá»§a báº¡n cho ngÃ y {booking.ShootingDate:dd/MM/yyyy}.";
                }
                else if (nextStatus == BookingRejected)
                {
                    title = "âŒ YÃªu cáº§u Ä‘áº·t lá»‹ch bá»‹ tá»« chá»‘i";
                    content = $"YÃªu cáº§u Ä‘áº·t lá»‹ch cá»§a báº¡n Ä‘Ã£ bá»‹ tá»« chá»‘i bá»Ÿi Studio. LÃ½ do: {booking.RejectReason ?? "KhÃ´ng cÃ³ lÃ½ do cá»¥ thá»ƒ"}.";
                }
                else if (nextStatus == BookingInProgress)
                {
                    title = "ðŸ“¸ Buá»•i chá»¥p áº£nh Ä‘Ã£ báº¯t Ä‘áº§u";
                    content = $"Studio '{studio.StudioName}' Ä‘Ã£ báº¯t Ä‘áº§u tiáº¿n hÃ nh buá»•i chá»¥p cá»§a báº¡n.";
                }
                else if (nextStatus == BookingDemoUploaded)
                {
                    title = "ðŸ–¼ï¸ ÄÃ£ cÃ³ áº£nh demo má»›i";
                    content = $"Studio '{studio.StudioName}' Ä‘Ã£ táº£i lÃªn áº£nh demo cho buá»•i chá»¥p ngÃ y {booking.ShootingDate:dd/MM/yyyy}. Vui lÃ²ng xem vÃ  pháº£n há»“i.";
                }

                await _notificationService.CreateNotificationAsync(
                    userId: booking.CustomerId,
                    title: title,
                    content: content,
                    type: "BOOKING",
                    refType: "BOOKING",
                    refId: booking.BookingId
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Notification] Error in StudioTransitionAsync: {ex.Message}");
            }

            return await GetBookingForUserAsync(ownerId, "STUDIO_OWNER", bookingId);
        }

        private async Task<bool> CanAccessBookingAsync(long userId, string role, Booking booking)
        {
            if (role == "ADMIN") return true;
            if (role == "CUSTOMER") return booking.CustomerId == userId;
            if (role == "STUDIO_OWNER") return await _repo.IsStudioOwnerAsync(booking.StudioId, userId);
            return false;
        }

        private async Task<bool> CanAccessDisputeEvidenceAsync(long userId, string role, Booking booking)
            => role == "ADMIN" || await CanAccessBookingAsync(userId, role, booking);

        private static bool IsValidEvidenceUrl(string? fileUrl)
        {
            if (string.IsNullOrWhiteSpace(fileUrl) || fileUrl.Length > 1000) return false;
            return Uri.TryCreate(fileUrl, UriKind.Absolute, out var uri) &&
                   (uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp);
        }

        private static string NormalizeEvidenceFileType(string? fileType, string fileUrl)
        {
            var normalized = TrimToNull(fileType, 100);
            if (!string.IsNullOrWhiteSpace(normalized)) return normalized!;

            var extension = Path.GetExtension(fileUrl);
            if (!string.IsNullOrWhiteSpace(extension))
            {
                return extension.TrimStart('.').ToLowerInvariant();
            }

            return "file";
        }

        private static string? TrimToNull(string? value, int maxLength)
        {
            var trimmed = value?.Trim();
            if (string.IsNullOrWhiteSpace(trimmed)) return null;
            return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
        }

        private static bool IsDisputed(Booking booking)
            => booking.DisputedAt.HasValue && !booking.DisputeResolvedAt.HasValue;

        private static bool IsSlotInPast(DateOnly date, TimeOnly start)
        {
            var now = DateTime.UtcNow.AddHours(7);
            var today = DateOnly.FromDateTime(now);
            if (date < today) return true;
            return date == today && start <= TimeOnly.FromDateTime(now);
        }

        private void AddBookingLogEntry(long bookingId, string? oldStatus, string newStatus, long changedBy, string? note)
        {
            _repo.AddBookingLog(new BookingLog
            {
                BookingId = bookingId,
                OldStatus = oldStatus,
                NewStatus = newStatus,
                ChangedBy = changedBy,
                Note = note,
                ChangedAt = DateTime.UtcNow
            });
        }

        private BookingCancellationQuote CalculateCancellationQuote(Booking booking, string role)
        {
            var payment = GetLatestPaidPayment(booking);
            if (payment == null)
            {
                return new BookingCancellationQuote(0, 0, 0, "NO_PAID_PAYMENT", "Booking chua co thanh toan PAID de hoan tien.");
            }

            if (string.Equals(payment.Method.MethodName, "CASH", StringComparison.OrdinalIgnoreCase))
            {
                return new BookingCancellationQuote(0, 0, 0, "MANUAL_CASH", "Booking thanh toan tien mat, can xu ly hoan tien/phi ngoai he thong.");
            }

            var paidAmount = payment.Amount;
            if (role == "CUSTOMER")
            {
                var daysUntilShoot = GetDaysUntilShoot(booking);
                decimal refundRate;
                string policyCode;
                string message;

                if (daysUntilShoot >= 7)
                {
                    refundRate = 1m;
                    policyCode = "CUSTOMER_CANCEL_FULL_REFUND";
                    message = "Khach huy truoc tu 7 ngay: hoan 100%.";
                }
                else if (daysUntilShoot >= 3)
                {
                    refundRate = 0.5m;
                    policyCode = "CUSTOMER_CANCEL_HALF_REFUND";
                    message = "Khach huy trong khoang 3-6 ngay: hoan 50%, phan con lai chia theo commission.";
                }
                else
                {
                    refundRate = 0m;
                    policyCode = "CUSTOMER_CANCEL_FORFEIT";
                    message = "Khach huy duoi 3 ngay: khong hoan, Studio nhan phan doanh thu sau commission.";
                }

                var refundAmount = Math.Round(paidAmount * refundRate, 0);
                var retainedAmount = Math.Max(0, paidAmount - refundAmount);
                return new BookingCancellationQuote(
                    refundAmount,
                    retainedAmount,
                    CalculateStudioCompensation(booking, retainedAmount),
                    policyCode,
                    message);
            }

            return new BookingCancellationQuote(
                paidAmount,
                0,
                0,
                role == "STUDIO_OWNER" ? "STUDIO_CANCEL_FULL_REFUND" : "ADMIN_CANCEL_FULL_REFUND",
                "Studio/Admin huy booking: hoan 100% cho khach hang.");
        }

        private BookingCancellationQuote CalculateNoShowQuote(Booking booking)
        {
            var payment = GetLatestPaidPayment(booking);
            if (payment == null)
            {
                return new BookingCancellationQuote(0, 0, 0, "NO_PAID_PAYMENT", "Booking chua co thanh toan PAID.");
            }

            if (string.Equals(payment.Method.MethodName, "CASH", StringComparison.OrdinalIgnoreCase))
            {
                return new BookingCancellationQuote(0, 0, 0, "MANUAL_CASH", "Booking thanh toan tien mat, can xu ly no-show ngoai he thong.");
            }

            var retainedAmount = payment.Amount;
            return new BookingCancellationQuote(
                0,
                retainedAmount,
                CalculateStudioCompensation(booking, retainedAmount),
                "CUSTOMER_NO_SHOW",
                "Khach khong den buoi chup: khong hoan, Studio nhan phan doanh thu sau commission.");
        }

        private async Task ApplyCancellationFinancialsAsync(Booking booking, BookingCancellationQuote quote, string reason)
        {
            var payment = GetLatestPaidPayment(booking);
            if (payment == null) return;
            if (string.Equals(payment.Method.MethodName, "CASH", StringComparison.OrdinalIgnoreCase)) return;

            if (quote.RefundAmount > 0)
            {
                var statusName = quote.RefundAmount >= payment.Amount ? PaymentRefunded : PaymentPartiallyRefunded;
                var status = await _repo.GetOrCreatePaymentStatusAsync(statusName);
                payment.PaymentStatusId = status.PaymentStatusId;
                payment.PaymentStatus = status;
                payment.RefundedAt = DateTime.UtcNow;
                payment.RefundMethod = "WALLET";
                payment.RefundReason = reason;
                payment.RefundPendingReason = quote.Message;
                payment.RefundAmount = quote.RefundAmount;
                payment.RetainedAmount = quote.CustomerChargeAmount;
                payment.StudioCompensationAmount = quote.StudioCompensationAmount;
                payment.PolicyCode = quote.PolicyCode;
                payment.PolicyNote = quote.Message;
                payment.UpdatedAt = DateTime.UtcNow;

                await _walletService.CreditCustomerRefundAsync(
                    booking.CustomerId,
                    quote.RefundAmount,
                    booking.BookingId,
                    $"Hoan tien Booking #{booking.BookingCode}: {quote.Message}");
            }
            else if (quote.CustomerChargeAmount > 0)
            {
                var status = await _repo.GetOrCreatePaymentStatusAsync(PaymentForfeited);
                payment.PaymentStatusId = status.PaymentStatusId;
                payment.PaymentStatus = status;
                payment.RefundReason = reason;
                payment.RefundPendingReason = quote.Message;
                payment.RefundAmount = 0;
                payment.RetainedAmount = quote.CustomerChargeAmount;
                payment.StudioCompensationAmount = quote.StudioCompensationAmount;
                payment.PolicyCode = quote.PolicyCode;
                payment.PolicyNote = quote.Message;
                payment.UpdatedAt = DateTime.UtcNow;
            }

            if (quote.StudioCompensationAmount > 0)
            {
                await CreateSettlementIfNeededAsync(booking, quote.CustomerChargeAmount);
                await _walletService.CreditStudioEarningAsync(
                    booking.StudioId,
                    quote.StudioCompensationAmount,
                    booking.BookingId,
                    $"Studio compensation for Booking #{booking.BookingCode}: {quote.PolicyCode}");
            }
        }

        private async Task<bool> IsSlotUsableForRescheduleAsync(TimeSlot slot, long studioId)
        {
            if (slot.WorkingDay.StudioId != studioId) return false;
            if (!slot.WorkingDay.IsAvailable) return false;
            if (slot.Status != SlotOpen) return false;
            if (IsSlotInPast(slot.WorkingDay.WorkingDate, slot.StartTime)) return false;
            return !await _repo.SlotHasActiveBookingAsync(slot.SlotId);
        }

        private static BookingRescheduleRequestResponse BuildRescheduleRequestPayload(
            long requestedBy,
            string requestedByRole,
            TimeSlot slot,
            string? reason)
            => new()
            {
                NewSlotId = slot.SlotId,
                NewDate = slot.WorkingDay.WorkingDate.ToString("yyyy-MM-dd"),
                NewStartTime = slot.StartTime.ToString("HH:mm"),
                NewEndTime = slot.EndTime.ToString("HH:mm"),
                RequestedBy = requestedBy,
                RequestedByRole = requestedByRole,
                Reason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim(),
                RequestedAt = DateTime.UtcNow.ToString("O")
            };

        private static BookingRescheduleRequestResponse? GetPendingRescheduleRequest(Booking booking)
        {
            var latestRequestLog = booking.BookingLogs
                .Where(log => log.NewStatus == BookingRescheduleRequested)
                .OrderByDescending(log => log.ChangedAt)
                .FirstOrDefault();
            if (latestRequestLog == null || string.IsNullOrWhiteSpace(latestRequestLog.Note)) return null;

            var hasLaterDecision = booking.BookingLogs.Any(log =>
                (log.NewStatus == BookingRescheduleApproved || log.NewStatus == BookingRescheduleRejected) &&
                log.ChangedAt >= latestRequestLog.ChangedAt);
            if (hasLaterDecision) return null;

            try
            {
                var parsed = JsonSerializer.Deserialize<BookingRescheduleRequestResponse>(latestRequestLog.Note);
                if (parsed == null || parsed.NewSlotId <= 0) return null;
                if (string.IsNullOrWhiteSpace(parsed.RequestedAt))
                {
                    parsed.RequestedAt = latestRequestLog.ChangedAt.ToString("O");
                }
                return parsed;
            }
            catch
            {
                return null;
            }
        }

        private static string BuildRescheduleDecisionNote(BookingRescheduleRequestResponse request, string reason)
            => JsonSerializer.Serialize(new
            {
                request.NewSlotId,
                request.NewDate,
                request.NewStartTime,
                request.NewEndTime,
                Reason = reason
            });

        private async Task ReleasePendingRescheduleSlotAsync(Booking booking, long changedBy, string reason)
        {
            var pending = GetPendingRescheduleRequest(booking);
            if (pending == null) return;

            var slot = await _repo.GetSlotForUpdateWithWorkingDayAsync(pending.NewSlotId);
            if (slot != null && slot.Status == SlotHolding)
            {
                slot.Status = SlotOpen;
            }

            AddBookingLogEntry(booking.BookingId, booking.Status.StatusName, BookingRescheduleRejected, changedBy, reason);
        }

        private static bool IsNoShowAllowed(Booking booking)
            => GetLocalShootingStart(booking) <= DateTime.UtcNow.AddHours(7);

        private static int GetDaysUntilShoot(Booking booking)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
            return booking.ShootingDate.DayNumber - today.DayNumber;
        }

        private static DateTime GetLocalShootingStart(Booking booking)
            => booking.ShootingDate.ToDateTime(booking.Slot.StartTime);

        private static Payment? GetLatestPaidPayment(Booking booking)
            => booking.Payments
                .Where(payment => payment.PaymentStatus.StatusName == PaymentPaid)
                .OrderByDescending(payment => payment.CreatedAt)
                .FirstOrDefault();

        private static decimal CalculateStudioCompensation(Booking booking, decimal retainedAmount)
        {
            if (retainedAmount <= 0) return 0;
            var platformFee = Math.Round(retainedAmount * booking.CommissionPercent / 100m, 0);
            return Math.Max(0, retainedAmount - platformFee);
        }

        private static BookingCancellationPolicyResponse MapCancellationPolicy(BookingCancellationQuote quote)
            => new()
            {
                RefundAmount = quote.RefundAmount,
                CustomerChargeAmount = quote.CustomerChargeAmount,
                StudioCompensationAmount = quote.StudioCompensationAmount,
                PolicyCode = quote.PolicyCode,
                Message = quote.Message
            };

        private static string BuildCancellationLogNote(string reason, BookingCancellationQuote quote)
            => $"{reason} | Policy={quote.PolicyCode}; Refund={quote.RefundAmount}; CustomerCharge={quote.CustomerChargeAmount}; StudioCompensation={quote.StudioCompensationAmount}";

        private static bool IsNoShowBooking(Booking booking)
            => booking.Status.StatusName == BookingCancelled &&
               booking.BookingLogs.Any(log => log.NewStatus == BookingNoShow);

        private static string GetEffectiveBookingStatus(Booking booking)
        {
            if (IsDisputed(booking)) return "DISPUTED";
            if (IsNoShowBooking(booking)) return BookingNoShow;
            return booking.Status.StatusName;
        }

        private static bool CanCancelFromResponseStatus(string role, string status)
            => role switch
            {
                "CUSTOMER" => status is BookingPendingPayment or BookingPendingConfirmation or BookingConfirmed,
                "STUDIO_OWNER" => status is BookingPendingConfirmation or BookingConfirmed,
                "ADMIN" => status is BookingPendingPayment or BookingPendingConfirmation or BookingConfirmed or BookingInProgress,
                _ => false
            };

        private sealed record BookingCancellationQuote(
            decimal RefundAmount,
            decimal CustomerChargeAmount,
            decimal StudioCompensationAmount,
            string PolicyCode,
            string Message);

        private static List<string> CleanPhotoUrls(IEnumerable<string>? urls)
            => urls?
                .Select(url => url.Trim())
                .Where(url => !string.IsNullOrWhiteSpace(url))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(30)
                .ToList() ?? new List<string>();

        private static string SerializeDeliveryNote(List<string> photoUrls, string? note)
            => JsonSerializer.Serialize(new PhotoDeliveryLog(photoUrls, string.IsNullOrWhiteSpace(note) ? null : note.Trim()));

        private static List<string> ParseDeliveryUrls(IEnumerable<BookingLog> logs, string status)
        {
            var targetStatuses = status == BookingFinalDelivered
                ? new[] { BookingFinalDelivered, "AWAITING_CUSTOMER" }
                : new[] { status };

            var note = logs
                .Where(log => targetStatuses.Contains(log.NewStatus) && !string.IsNullOrWhiteSpace(log.Note))
                .OrderByDescending(log => log.ChangedAt)
                .Select(log => log.Note)
                .FirstOrDefault();

            if (string.IsNullOrWhiteSpace(note)) return new List<string>();

            try
            {
                return JsonSerializer.Deserialize<PhotoDeliveryLog>(note)?.PhotoUrls ?? new List<string>();
            }
            catch
            {
                return note
                    .Split(new[] { '\r', '\n', ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(url => url.Trim())
                    .Where(url => !string.IsNullOrWhiteSpace(url))
                    .ToList();
            }
        }

        private static string? ParseCustomerFeedback(IEnumerable<BookingLog> logs)
            => logs
                .Where(log => log.NewStatus == BookingEditing && !string.IsNullOrWhiteSpace(log.Note))
                .OrderByDescending(log => log.ChangedAt)
                .Select(log => log.Note)
                .FirstOrDefault();

        private async Task CreateSettlementIfNeededAsync(Booking booking, decimal? grossAmountOverride = null)
        {
            if (await _repo.SettlementExistsAsync(booking.BookingId)) return;

            var grossAmount = grossAmountOverride ?? booking.TotalPrice;
            var platformFeeAmount = grossAmountOverride.HasValue
                ? Math.Round(grossAmount * booking.CommissionPercent / 100m, 0)
                : booking.CommissionAmount;
            var studioAmount = grossAmountOverride.HasValue
                ? Math.Max(0, grossAmount - platformFeeAmount)
                : booking.StudioRevenue;

            _repo.AddSettlement(new Settlement
            {
                BookingId = booking.BookingId,
                StudioId = booking.StudioId,
                GrossAmount = grossAmount,
                PlatformFeePercent = booking.CommissionPercent,
                PlatformFeeAmount = platformFeeAmount,
                StudioAmount = studioAmount,
                Status = "READY",
                PayoutMethod = "MANUAL",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        private async Task<Payment> CreatePendingPaymentAsync(Booking booking, string methodName)
        {
            var method = await _repo.GetPaymentMethodAsync(methodName)
                ?? await _repo.GetPaymentMethodAsync("BANK_TRANSFER")
                ?? throw new InvalidOperationException("Default payment method BANK_TRANSFER not found.");
            var pending = await _repo.GetPaymentStatusAsync(PaymentPending)
                ?? throw new InvalidOperationException("Payment status PENDING not found.");

            var payment = new Payment
            {
                BookingId = booking.BookingId,
                MethodId = method.MethodId,
                Method = method,
                PaymentStatusId = pending.PaymentStatusId,
                PaymentStatus = pending,
                PaymentCode = $"PAY-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
                Amount = booking.TotalPrice,
                CurrencyCode = "VND",
                PaymentProvider = method.MethodName,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _repo.AddPayment(payment);
            return payment;
        }

        private void MarkLatestPayment(Booking booking, string statusName, string reason)
        {
            var payment = booking.Payments.OrderByDescending(p => p.CreatedAt).FirstOrDefault();
            if (payment == null) return;

            var status = _repo.GetPaymentStatusAsync(statusName).GetAwaiter().GetResult();
            if (status == null) return;

            payment.PaymentStatusId = status.PaymentStatusId;
            payment.PaymentStatus = status;
            payment.FailureReason = statusName == PaymentFailed ? reason : payment.FailureReason;
            payment.UpdatedAt = DateTime.UtcNow;
        }

        private async Task MarkLatestPaidPaymentForRefundAsync(Booking booking, string reason)
        {
            var payment = booking.Payments.OrderByDescending(p => p.CreatedAt).FirstOrDefault();
            if (payment == null || payment.PaymentStatus.StatusName != PaymentPaid) return;
            if (payment.Method.MethodName == "CASH") return;

            var refundedStatus = await _repo.GetPaymentStatusAsync("REFUNDED");
            if (refundedStatus == null) return;

            payment.PaymentStatusId = refundedStatus.PaymentStatusId;
            payment.PaymentStatus = refundedStatus;
            payment.RefundedAt = DateTime.UtcNow;
            payment.RefundMethod = "WALLET";
            payment.RefundReason = reason;
            payment.RefundAmount = booking.TotalPrice;
            payment.RetainedAmount = 0;
            payment.StudioCompensationAmount = 0;
            payment.PolicyCode = "FULL_REFUND";
            payment.PolicyNote = reason;
            payment.UpdatedAt = DateTime.UtcNow;

            // Credit the customer's wallet
            await _walletService.CreditCustomerRefundAsync(
                booking.CustomerId,
                booking.TotalPrice,
                booking.BookingId,
                $"HoÃ n tiá»n Booking #{booking.BookingCode} (lÃ½ do: {reason})"
            );
        }

        private static void GenerateSlots(WorkingDay day, TimeOnly openTime, TimeOnly closeTime, int durationMinutes)
        {
            if (durationMinutes <= 0) durationMinutes = 60;
            var cursor = openTime;
            var span = TimeSpan.FromMinutes(durationMinutes);
            while (cursor.Add(span) <= closeTime)
            {
                var end = cursor.Add(span);
                if (!day.TimeSlots.Any(s => s.StartTime == cursor))
                {
                    day.TimeSlots.Add(new TimeSlot
                    {
                        StartTime = cursor,
                        EndTime = end,
                        Status = SlotOpen
                    });
                }
                cursor = end;
            }
        }

        private int GetIntSetting(string key, int fallback)
        {
            return int.TryParse(_configuration[key], out var value) && value > 0 ? value : fallback;
        }

        private string GetVnPaySetting(string key, string fallback = "")
        {
            var value = _configuration[$"VnPay:{key}"];
            return string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
        }

        private string GetRequiredVnPaySetting(string key)
        {
            var value = GetVnPaySetting(key);
            if (string.IsNullOrWhiteSpace(value))
            {
                throw new InvalidOperationException($"Missing VNPay configuration: VnPay:{key}.");
            }

            return value;
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
            Status = GetEffectiveSlotStatus(s)
        };

        private static string GetEffectiveSlotStatus(TimeSlot slot)
        {
            var hasActiveBooking = slot.Bookings.Any(b =>
                b.Status?.StatusName != BookingCancelled &&
                b.Status?.StatusName != BookingRejected);

            return hasActiveBooking && slot.Status == SlotOpen ? SlotBooked : slot.Status;
        }

        private BookingResponse MapBooking(Booking b, string role)
        {
            var status = GetEffectiveBookingStatus(b);
            var pendingReschedule = GetPendingRescheduleRequest(b);
            var cancellationPolicy = (status is BookingPendingPayment or BookingPendingConfirmation or BookingConfirmed)
                ? MapCancellationPolicy(CalculateCancellationQuote(b, role))
                : null;
            var review = b.Review == null ? null : new BookingReviewResponse
            {
                Id = b.Review.ReviewId,
                Rating = b.Review.Rating,
                Comment = b.Review.Comment,
                CreatedAt = b.Review.CreatedAt.ToString("O")
            };
            var demoPhotoUrls = ParseDeliveryUrls(b.BookingLogs, BookingDemoUploaded);
            var finalPhotoUrls = ParseDeliveryUrls(b.BookingLogs, BookingFinalDelivered);

            if (role == "CUSTOMER")
            {
                demoPhotoUrls = demoPhotoUrls
                    .Select((_, index) => $"/api/bookings/{b.BookingId}/photo-preview/demo/{index}")
                    .ToList();

                if (status != BookingCompleted)
                {
                    finalPhotoUrls = finalPhotoUrls
                        .Select((_, index) => $"/api/bookings/{b.BookingId}/photo-preview/final/{index}")
                        .ToList();
                }
            }

            return new BookingResponse
            {
                Id = b.BookingId,
                BookingCode = b.BookingCode,
                CustomerId = b.CustomerId,
                CustomerName = b.Customer.FullName,
                StudioId = b.StudioId,
                StudioName = b.Studio.StudioName,
                PackageId = b.PackageId,
                PackageName = b.PackageNameSnapshot ?? b.Package.PackageName,
                ServiceName = b.ServiceNameSnapshot ?? b.Package.Service?.ServiceName,
                PackageDescription = b.PackageDescriptionSnapshot ?? b.Package.Description,
                PackageDurationHours = b.PackageDurationHoursSnapshot ?? b.Package.DurationHours,
                PackageMaxPhotos = b.PackageMaxPhotosSnapshot ?? b.Package.MaxPhotos,
                PackageInclusions = b.PackageInclusionsSnapshot ?? b.Package.Inclusions,
                SlotId = b.SlotId,
                ShootingDate = b.ShootingDate.ToString("yyyy-MM-dd"),
                StartTime = b.Slot.StartTime.ToString("HH:mm"),
                EndTime = b.Slot.EndTime.ToString("HH:mm"),
                ShootingLocation = b.ShootingLocation,
                ShootingLat = b.ShootingLat,
                ShootingLng = b.ShootingLng,
                Note = b.Note,
                Status = status,
                TotalPrice = b.TotalPrice,
                CommissionAmount = b.CommissionAmount,
                StudioRevenue = b.StudioRevenue,
                PaymentExpiresAt = b.PaymentExpiresAt?.ToString("O"),
                CanCancel = CanCancelFromResponseStatus(role, status),
                CanRequestReschedule = role == "CUSTOMER" &&
                    status is BookingPendingConfirmation or BookingConfirmed &&
                    pendingReschedule == null,
                CanRespondReschedule = role == "STUDIO_OWNER" &&
                    status is BookingPendingConfirmation or BookingConfirmed &&
                    pendingReschedule != null,
                CanMarkNoShow = role == "STUDIO_OWNER" &&
                    status is BookingConfirmed or BookingInProgress &&
                    IsNoShowAllowed(b),
                CancellationPolicy = cancellationPolicy,
                PendingReschedule = pendingReschedule,
                DemoPhotoUrls = demoPhotoUrls,
                FinalPhotoUrls = finalPhotoUrls,
                CustomerFeedback = ParseCustomerFeedback(b.BookingLogs),
                CanReview = status == BookingCompleted && review == null,
                Review = review,
                CreatedAt = b.CreatedAt.ToString("O"),
                LatestPayment = b.Payments.OrderByDescending(p => p.CreatedAt).Select(MapPayment).FirstOrDefault()
            };
        }

        private string ToCloudinaryWatermarkedPreviewUrl(string url)
        {
            const string uploadSegment = "/image/upload/";
            var uploadIndex = url.IndexOf(uploadSegment, StringComparison.OrdinalIgnoreCase);
            if (uploadIndex < 0) return url;

            var insertIndex = uploadIndex + uploadSegment.Length;
            var previewTransform = BuildCloudinaryPreviewTransform();

            if (url[insertIndex..].StartsWith(previewTransform, StringComparison.OrdinalIgnoreCase))
            {
                return url;
            }

            return url.Insert(insertIndex, previewTransform);
        }

        private string BuildCloudinaryPreviewTransform()
        {
            var watermarkPublicId = _configuration["Cloudinary:WatermarkPublicId"]?.Trim();
            if (string.IsNullOrWhiteSpace(watermarkPublicId))
            {
                watermarkPublicId = "exe201/brand/go-watermark-full-50";
            }

            var overlayPublicId = NormalizeCloudinaryOverlayPublicId(watermarkPublicId);
            return $"c_limit,w_1400,q_auto:good/l_{overlayPublicId},fl_relative,c_fill,w_1.0,h_1.0,g_center/fl_layer_apply/";
        }

        private static string NormalizeCloudinaryOverlayPublicId(string publicId)
        {
            var normalized = publicId.Replace('\\', '/').Trim();
            foreach (var extension in new[] { ".png", ".jpg", ".jpeg", ".webp", ".svg" })
            {
                if (normalized.EndsWith(extension, StringComparison.OrdinalIgnoreCase))
                {
                    normalized = normalized[..^extension.Length];
                    break;
                }
            }

            return Uri.EscapeDataString(normalized.Replace('/', ':')).Replace("%3A", ":", StringComparison.OrdinalIgnoreCase);
        }

        private sealed record PhotoDeliveryLog(List<string> PhotoUrls, string? Note);

        private static PaymentResponse MapPayment(Payment p) => new()
        {
            Id = p.PaymentId,
            BookingId = p.BookingId,
            PaymentCode = p.PaymentCode,
            MethodName = p.Method.MethodName,
            Status = p.PaymentStatus.StatusName,
            PaymentProvider = p.PaymentProvider,
            Amount = p.Amount,
            CurrencyCode = p.CurrencyCode,
            TransactionCode = p.TransactionCode,
            PaidAt = p.PaidAt?.ToString("O"),
            RefundedAt = p.RefundedAt?.ToString("O"),
            RefundMethod = p.RefundMethod,
            RefundPendingReason = p.RefundPendingReason,
            RefundAmount = p.RefundAmount,
            RetainedAmount = p.RetainedAmount,
            StudioCompensationAmount = p.StudioCompensationAmount,
            PolicyCode = p.PolicyCode,
            PolicyNote = p.PolicyNote,
            CreatedAt = p.CreatedAt.ToString("O")
        };

        private static BookingDisputeEvidenceResponse MapDisputeEvidence(BookingDisputeEvidence evidence) => new()
        {
            Id = evidence.EvidenceId,
            BookingId = evidence.BookingId,
            UploadedBy = evidence.UploadedBy,
            UploadedByName = evidence.UploadedByNavigation?.FullName,
            UploadedByRole = evidence.UploadedByRole,
            FileUrl = evidence.FileUrl,
            FileType = evidence.FileType,
            Note = evidence.Note,
            CreatedAt = evidence.CreatedAt.ToString("O")
        };

        // payOS
        public async Task<string?> CreatePayOsPaymentUrlAsync(long customerId, long bookingId)
        {
            var booking = await _repo.GetBookingForUpdateAsync(bookingId);
            if (booking == null || booking.CustomerId != customerId) return null;
            if (booking.Status.StatusName != BookingPendingPayment) return null;
            if (booking.PaymentExpiresAt != null && booking.PaymentExpiresAt <= DateTime.UtcNow) return null;

            var payosMethod = await _repo.GetPaymentMethodAsync("PAYOS")
                ?? await _repo.GetPaymentMethodAsync("BANK_TRANSFER")
                ?? throw new InvalidOperationException("Payment method PAYOS was not found.");

            // Get or create pending payment for PAYOS
            var payment = booking.Payments.OrderByDescending(p => p.CreatedAt).FirstOrDefault();

            if (payment != null && payment.PaymentStatus.StatusName == PaymentPending)
            {
                // Cancel the old PayOS order via its stored ProviderRef (best-effort â€” ignore if already gone)
                if (!string.IsNullOrEmpty(payment.ProviderRef) &&
                    long.TryParse(payment.ProviderRef, out var oldOrderCode))
                {
                    await _payOsService.CancelPaymentLinkAsync(oldOrderCode);
                }

                // Reset the payment record for reuse
                payment.PaymentCode = $"PAY-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
                payment.ProviderRef = null;
                payment.UpdatedAt = DateTime.UtcNow;
            }
            else if (payment == null)
            {
                payment = await CreatePendingPaymentAsync(booking, "PAYOS");
            }

            payment.MethodId = payosMethod.MethodId;
            payment.Method = payosMethod;
            payment.PaymentProvider = "PAYOS";

            // Generate a truly unique orderCode using Unix timestamp (seconds) * 100 + random 2-digit suffix.
            // PayOS rejects ANY previously used orderCode (even after cancel), so we must never reuse one.
            // This gives a 12-digit number, well within int64 range, unique to the millisecond.
            var orderCode = DateTimeOffset.UtcNow.ToUnixTimeSeconds() * 100L + new Random().Next(10, 99);
            payment.ProviderRef = orderCode.ToString();

            await _repo.SaveChangesAsync();

            var amount = (int)payment.Amount;
            var description = $"Thanh toan BK{booking.BookingId}";
            if (description.Length > 25) description = description.Substring(0, 25);
            var returnUrl = _configuration["PayOS:ReturnUrl"] ?? "http://localhost:5289/api/payments/payos-return";
            var cancelUrl = _configuration["PayOS:CancelUrl"] ?? returnUrl;

            try
            {
                var result = await _payOsService.CreatePaymentLinkAsync(orderCode, amount, description, cancelUrl, returnUrl);
                return result.CheckoutUrl;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating PayOS payment link: {ex.Message}");
                return null;
            }
        }

        public async Task<bool> ProcessPayOsWebhookAsync(string webhookBodyJson)
        {
            try
            {
                var verifiedData = await _payOsService.VerifyWebhookDataAsync(webhookBodyJson);
                if (verifiedData == null) return false;

                // orderCode = PaymentId stored in payment.ProviderRef
                return await MarkBookingPaidByOrderCodeAsync(verifiedData.OrderCode, verifiedData.Reference);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error processing PayOS Webhook: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> ProcessPayOsReturnAsync(long orderCode, string status)
        {
            try
            {
                // Retrieve actual status directly from payOS API
                var paymentInfo = await _payOsService.GetPaymentLinkInformationAsync(orderCode);
                if (paymentInfo == null) return false;

                var payOsStatus = paymentInfo.Status.ToString();
                if (IsPayOsPaidStatus(payOsStatus) || IsPayOsPaidStatus(status))
                {
                    string? transactionRef = null;
                    if (paymentInfo.Transactions != null && paymentInfo.Transactions.Count > 0)
                    {
                        transactionRef = paymentInfo.Transactions.LastOrDefault()?.Reference;
                    }
                    return await MarkBookingPaidByOrderCodeAsync(orderCode, transactionRef);
                }

                if (IsPayOsFailedStatus(payOsStatus) || IsPayOsFailedStatus(status))
                {
                    return await MarkBookingFailedByOrderCodeAsync(orderCode, $"Payment {payOsStatus} via payOS");
                }

                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error processing PayOS Return for orderCode {orderCode}: {ex.Message}");
                return false;
            }
        }

        /// <summary>Look up a booking via payment.ProviderRef = orderCode, then mark it paid.</summary>
        private async Task<bool> MarkBookingPaidByOrderCodeAsync(long orderCode, string? transactionCode)
        {
            // Try ProviderRef first (new flow: orderCode = PaymentId)
            var booking = await _repo.GetBookingByProviderRefAsync(orderCode.ToString());
            // Fallback: old bookings where orderCode == bookingId
            if (booking == null) booking = await _repo.GetBookingForUpdateAsync(orderCode);
            if (booking == null) return false;
            return await MarkBookingPaidAsync(booking.BookingId, transactionCode);
        }

        /// <summary>Look up a booking via payment.ProviderRef = orderCode, then mark payment failed.</summary>
        private async Task<bool> MarkBookingFailedByOrderCodeAsync(long orderCode, string reason)
        {
            var booking = await _repo.GetBookingByProviderRefAsync(orderCode.ToString());
            if (booking == null) booking = await _repo.GetBookingForUpdateAsync(orderCode);
            if (booking == null) return false;
            return await MarkBookingPaymentFailedAsync(booking.BookingId, reason);
        }


        private async Task<bool> MarkBookingPaidAsync(long bookingId, string? transactionCode)
        {
            await using var tx = await _repo.BeginTransactionAsync();

            var booking = await _repo.GetBookingForUpdateAsync(bookingId);
            if (booking == null) return false;

            var payment = booking.Payments.OrderByDescending(p => p.CreatedAt).FirstOrDefault();
            if (payment == null) return false;

            // Idempotency check: only process if payment is PENDING
            if (payment.PaymentStatus.StatusName != PaymentPending)
            {
                await tx.CommitAsync();
                return true;
            }

            var paidStatus = await _repo.GetPaymentStatusAsync(PaymentPaid);
            var pendingConfirmationId = await _repo.GetBookingStatusIdAsync(BookingPendingConfirmation);
            if (paidStatus == null || pendingConfirmationId == null) return false;

            payment.PaymentStatusId = paidStatus.PaymentStatusId;
            payment.PaymentStatus = paidStatus;
            payment.TransactionCode = transactionCode ?? $"PAYOS-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
            payment.PaidAt = DateTime.UtcNow;
            payment.UpdatedAt = DateTime.UtcNow;

            booking.StatusId = pendingConfirmationId.Value;
            booking.PaymentExpiresAt = null;
            booking.UpdatedAt = DateTime.UtcNow;
            booking.Slot.Status = SlotBooked;

            AddBookingLogEntry(booking.BookingId, BookingPendingPayment, BookingPendingConfirmation, booking.CustomerId, "Paid successfully via payOS (VietQR)");

            await _repo.SaveChangesAsync();
            await tx.CommitAsync();
            return true;
        }

        private async Task<bool> MarkBookingPaymentFailedAsync(long bookingId, string reason)
        {
            await using var tx = await _repo.BeginTransactionAsync();

            var booking = await _repo.GetBookingForUpdateAsync(bookingId);
            if (booking == null) return false;

            var payment = booking.Payments.OrderByDescending(p => p.CreatedAt).FirstOrDefault();
            if (payment == null) return false;

            if (payment.PaymentStatus.StatusName != PaymentPending)
            {
                await tx.CommitAsync();
                return true;
            }

            var failedStatus = await _repo.GetPaymentStatusAsync(PaymentFailed);
            var cancelledId = await _repo.GetBookingStatusIdAsync(BookingCancelled);
            if (failedStatus == null || cancelledId == null) return false;

            payment.PaymentStatusId = failedStatus.PaymentStatusId;
            payment.PaymentStatus = failedStatus;
            payment.FailureReason = reason;
            payment.UpdatedAt = DateTime.UtcNow;

            booking.StatusId = cancelledId.Value;
            booking.CancelledAt = DateTime.UtcNow;
            booking.CancelReason = reason;
            booking.UpdatedAt = DateTime.UtcNow;
            booking.Slot.Status = SlotOpen;

            AddBookingLogEntry(booking.BookingId, BookingPendingPayment, BookingCancelled, booking.CustomerId, reason);

            await _repo.SaveChangesAsync();
            await tx.CommitAsync();
            return true;
        }

        private static bool IsPayOsPaidStatus(string? status)
            => string.Equals(status, "PAID", StringComparison.OrdinalIgnoreCase)
               || string.Equals(status, "PAID_SUCCESS", StringComparison.OrdinalIgnoreCase)
               || string.Equals(status, "SUCCESS", StringComparison.OrdinalIgnoreCase)
               || string.Equals(status, "SUCCEEDED", StringComparison.OrdinalIgnoreCase)
               || string.Equals(status, "Paid", StringComparison.OrdinalIgnoreCase);

        private static bool IsPayOsFailedStatus(string? status)
            => string.Equals(status, "CANCELLED", StringComparison.OrdinalIgnoreCase)
               || string.Equals(status, "CANCELED", StringComparison.OrdinalIgnoreCase)
               || string.Equals(status, "EXPIRED", StringComparison.OrdinalIgnoreCase)
               || string.Equals(status, "FAILED", StringComparison.OrdinalIgnoreCase)
               || string.Equals(status, "Cancelled", StringComparison.OrdinalIgnoreCase)
               || string.Equals(status, "Expired", StringComparison.OrdinalIgnoreCase)
               || string.Equals(status, "Failed", StringComparison.OrdinalIgnoreCase);
    }
}
