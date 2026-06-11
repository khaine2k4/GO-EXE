using exe201.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace EXE201.Server.Repositories
{
    public class BookingWorkflowRepository : IBookingWorkflowRepository
    {
        private readonly PhotoStudioBookingContext _context;

        public BookingWorkflowRepository(PhotoStudioBookingContext context)
        {
            _context = context;
        }

        // ── Transaction ──────────────────────────────────────────────────────

        public async Task<IDbContextTransaction> BeginTransactionAsync()
            => await _context.Database.BeginTransactionAsync();

        public async Task SaveChangesAsync()
            => await _context.SaveChangesAsync();

        // ── Studio lookup ────────────────────────────────────────────────────

        public async Task<Studio?> GetOwnedStudioAsync(long ownerId)
            => await _context.Studios.FirstOrDefaultAsync(s => s.OwnerId == ownerId && s.DeletedAt == null);

        public async Task<bool> IsStudioOwnerAsync(long studioId, long ownerId)
            => await _context.Studios.AnyAsync(s => s.StudioId == studioId && s.OwnerId == ownerId && s.DeletedAt == null);

        // ── Working Schedule ─────────────────────────────────────────────────

        public async Task<List<WorkingSchedule>> GetSchedulesByStudioIdAsync(long studioId)
            => await _context.WorkingSchedules
                .Where(s => s.StudioId == studioId)
                .OrderBy(s => s.DayOfWeek)
                .ToListAsync();

        public async Task<WorkingSchedule?> GetScheduleAsync(long studioId, int dayOfWeek)
            => await _context.WorkingSchedules
                .FirstOrDefaultAsync(s => s.StudioId == studioId && s.DayOfWeek == dayOfWeek);

        public void AddSchedule(WorkingSchedule schedule)
            => _context.WorkingSchedules.Add(schedule);

        // ── Working Day ──────────────────────────────────────────────────────

        public async Task<List<WorkingDay>> GetWorkingDaysAsync(long studioId, DateOnly? from, DateOnly? to, bool includeClosed)
        {
            var query = _context.WorkingDays
                .Include(d => d.TimeSlots)
                    .ThenInclude(s => s.Bookings)
                    .ThenInclude(b => b.Status)
                .Where(d => d.StudioId == studioId)
                .AsQueryable();

            if (from.HasValue) query = query.Where(d => d.WorkingDate >= from);
            if (to.HasValue)   query = query.Where(d => d.WorkingDate <= to);
            if (!includeClosed) query = query.Where(d => d.IsAvailable);

            return await query.OrderBy(d => d.WorkingDate).ToListAsync();
        }

        public async Task<WorkingDay?> GetWorkingDayWithSlotsAsync(long studioId, DateOnly date)
            => await _context.WorkingDays
                .Include(d => d.TimeSlots)
                    .ThenInclude(s => s.Bookings)
                    .ThenInclude(b => b.Status)
                .FirstOrDefaultAsync(d => d.StudioId == studioId && d.WorkingDate == date);

        public void AddWorkingDay(WorkingDay day)
            => _context.WorkingDays.Add(day);

        // ── Time Slot ────────────────────────────────────────────────────────

        public async Task<TimeSlot?> GetSlotWithWorkingDayAsync(long slotId)
            => await _context.TimeSlots
                .Include(s => s.WorkingDay)
                .FirstOrDefaultAsync(s => s.SlotId == slotId);

        public async Task<List<TimeSlot>> GetSlotsByStudioDateAsync(long studioId, DateOnly date)
            => await _context.TimeSlots
                .Include(s => s.WorkingDay)
                .Include(s => s.Bookings)
                    .ThenInclude(b => b.Status)
                .Where(s => s.WorkingDay.StudioId == studioId && s.WorkingDay.WorkingDate == date)
                .OrderBy(s => s.StartTime)
                .ToListAsync();

        /// <summary>
        /// Reload slot directly (no Include) for use inside a transaction to check status before
        /// committing — prevents double-booking race conditions when two requests race for the same slot.
        /// </summary>
        public async Task<TimeSlot?> GetSlotForUpdateAsync(long slotId)
            => await _context.TimeSlots
                .FromSqlInterpolated($"SELECT * FROM time_slots WITH (UPDLOCK, ROWLOCK) WHERE slot_id = {slotId}")
                .FirstOrDefaultAsync();

        public async Task<TimeSlot?> GetSlotForUpdateWithWorkingDayAsync(long slotId)
            => await _context.TimeSlots
                .FromSqlInterpolated($"SELECT * FROM time_slots WITH (UPDLOCK, ROWLOCK) WHERE slot_id = {slotId}")
                .Include(s => s.WorkingDay)
                .Include(s => s.Bookings)
                    .ThenInclude(b => b.Status)
                .FirstOrDefaultAsync();

        public void AddSlot(TimeSlot slot)
            => _context.TimeSlots.Add(slot);

        // ── Package ──────────────────────────────────────────────────────────

        public async Task<Package?> GetActivePackageWithStudioAsync(long packageId)
            => await _context.Packages
                .Include(p => p.Service).ThenInclude(s => s.Studio)
                .FirstOrDefaultAsync(p => p.PackageId == packageId && p.DeletedAt == null && p.IsActive);

        // ── Booking ──────────────────────────────────────────────────────────

        public async Task<Booking?> GetFullBookingAsync(long bookingId)
            => await BookingQuery().AsNoTracking().FirstOrDefaultAsync(b => b.BookingId == bookingId);

        public async Task<Booking?> GetBookingForUpdateAsync(long bookingId)
            => await _context.Bookings
                .FromSqlInterpolated($"SELECT * FROM bookings WITH (UPDLOCK, ROWLOCK) WHERE booking_id = {bookingId}")
                .Include(b => b.Customer)
                .Include(b => b.Studio)
                .Include(b => b.Package).ThenInclude(p => p.Service)
                .Include(b => b.Status)
                .Include(b => b.Slot).ThenInclude(s => s.WorkingDay)
                .Include(b => b.BookingLogs)
                .Include(b => b.Review)
                .Include(b => b.Payments).ThenInclude(p => p.Method)
                .Include(b => b.Payments).ThenInclude(p => p.PaymentStatus)
                .FirstOrDefaultAsync();

        public async Task<bool> SlotHasActiveBookingAsync(long slotId)
            => await _context.Bookings.AnyAsync(b =>
                b.SlotId == slotId &&
                b.Status.StatusName != "CANCELLED" &&
                b.Status.StatusName != "REJECTED");

        public async Task<List<Booking>> GetExpiredPendingPaymentBookingsAsync(long pendingPaymentStatusId, DateTime now, int batchSize)
            => await BookingQuery()
                .AsNoTracking()
                .Where(b => b.StatusId == pendingPaymentStatusId &&
                            b.PaymentExpiresAt != null &&
                            b.PaymentExpiresAt <= now)
                .OrderBy(b => b.PaymentExpiresAt)
                .Take(batchSize)
                .ToListAsync();

        public async Task<List<Booking>> GetExpiredFinalDeliveredBookingsAsync(long finalDeliveredStatusId, long awaitingCustomerStatusId, DateTime threshold, int batchSize)
            => await BookingQuery()
                .AsNoTracking()
                .Where(b => (b.StatusId == finalDeliveredStatusId || b.StatusId == awaitingCustomerStatusId) &&
                            (b.BookingLogs
                                .Where(l => l.NewStatus == "FINAL_DELIVERED" || l.NewStatus == "AWAITING_CUSTOMER")
                                .Select(l => (DateTime?)l.ChangedAt)
                                .Max() ?? b.UpdatedAt) <= threshold &&
                            b.DisputedAt == null)
                .OrderBy(b => b.UpdatedAt)
                .Take(batchSize)
                .ToListAsync();

        public async Task<List<Booking>> GetBookingsByCustomerAsync(long customerId, string? status)
        {
            var query = BookingQuery().Where(b => b.CustomerId == customerId);
            if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
            {
                query = status == "DISPUTED"
                    ? query.Where(b => b.DisputedAt != null && b.DisputeResolvedAt == null)
                    : query.Where(b => b.Status.StatusName == status && (b.DisputedAt == null || b.DisputeResolvedAt != null));
            }
            return await query.OrderByDescending(b => b.CreatedAt).ToListAsync();
        }

        public async Task<List<Booking>> GetBookingsByStudioAsync(long studioId, string? status)
        {
            var query = BookingQuery().Where(b => b.StudioId == studioId);
            if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
            {
                query = status == "DISPUTED"
                    ? query.Where(b => b.DisputedAt != null && b.DisputeResolvedAt == null)
                    : query.Where(b => b.Status.StatusName == status && (b.DisputedAt == null || b.DisputeResolvedAt != null));
            }
            return await query.OrderByDescending(b => b.CreatedAt).ToListAsync();
        }

        public void AddBooking(Booking booking)
            => _context.Bookings.Add(booking);

        public async Task<Booking?> GetBookingByPaymentCodeAsync(string paymentCode)
            => await BookingQuery()
                .FirstOrDefaultAsync(b => b.Payments.Any(p => p.PaymentCode == paymentCode));

        public async Task<Booking?> GetBookingByProviderRefAsync(string providerRef)
            => await BookingQuery()
                .FirstOrDefaultAsync(b => b.Payments.Any(p => p.ProviderRef == providerRef));

        public async Task<List<BookingDisputeEvidence>> GetDisputeEvidencesByBookingAsync(long bookingId)
            => await _context.BookingDisputeEvidences
                .Include(e => e.UploadedByNavigation)
                .Where(e => e.BookingId == bookingId)
                .OrderByDescending(e => e.CreatedAt)
                .ToListAsync();

        public void AddDisputeEvidence(BookingDisputeEvidence evidence)
            => _context.BookingDisputeEvidences.Add(evidence);


        // ── Booking Status ───────────────────────────────────────────────────

        public async Task<long?> GetBookingStatusIdAsync(string statusName)
            => await _context.BookingStatuses
                .Where(s => s.StatusName == statusName)
                .Select(s => (long?)s.StatusId)
                .FirstOrDefaultAsync();

        public async Task<long> GetOrCreateBookingStatusIdAsync(string statusName)
        {
            var status = await _context.BookingStatuses.FirstOrDefaultAsync(s => s.StatusName == statusName);
            if (status != null) return status.StatusId;

            status = new BookingStatus { StatusName = statusName };
            _context.BookingStatuses.Add(status);
            await _context.SaveChangesAsync();
            return status.StatusId;
        }

        // ── Booking Log ──────────────────────────────────────────────────────

        public void AddBookingLog(BookingLog log)
            => _context.BookingLogs.Add(log);

        // ── Payment ──────────────────────────────────────────────────────────

        public async Task<List<Payment>> GetPaymentsByCustomerAsync(long customerId)
            => await PaymentQuery()
                .Where(p => p.Booking.CustomerId == customerId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

        public async Task<List<Payment>> GetPaymentsByStudioAsync(long studioId)
            => await PaymentQuery()
                .Where(p => p.Booking.StudioId == studioId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

        public async Task<PaymentMethod?> GetPaymentMethodAsync(string methodName)
            => await _context.PaymentMethods.FirstOrDefaultAsync(m => m.MethodName == methodName);

        public async Task<PaymentStatus?> GetPaymentStatusAsync(string statusName)
            => await _context.PaymentStatuses.FirstOrDefaultAsync(s => s.StatusName == statusName);

        public async Task<PaymentStatus> GetOrCreatePaymentStatusAsync(string statusName)
        {
            var status = await _context.PaymentStatuses.FirstOrDefaultAsync(s => s.StatusName == statusName);
            if (status != null) return status;

            status = new PaymentStatus { StatusName = statusName };
            _context.PaymentStatuses.Add(status);
            await _context.SaveChangesAsync();
            return status;
        }

        public void AddPayment(Payment payment)
            => _context.Payments.Add(payment);

        // Settlement

        public async Task<bool> SettlementExistsAsync(long bookingId)
            => await _context.Settlements.AnyAsync(s => s.BookingId == bookingId);

        public void AddSettlement(Settlement settlement)
            => _context.Settlements.Add(settlement);

        public void AddReview(Review review)
            => _context.Reviews.Add(review);

        public async Task<bool> ReviewExistsAsync(long bookingId)
            => await _context.Reviews.AnyAsync(r => r.BookingId == bookingId);

        public async Task RecalculateStudioRatingAsync(long studioId)
        {
            var studio = await _context.Studios.FirstOrDefaultAsync(s => s.StudioId == studioId);
            if (studio == null) return;

            var visibleReviews = _context.Reviews.Where(r => r.StudioId == studioId && !r.IsHidden);
            var totalReviews = await visibleReviews.CountAsync();
            var avgRating = totalReviews == 0
                ? 0m
                : Math.Round(await visibleReviews.AverageAsync(r => (decimal)r.Rating), 1);

            studio.TotalReviews = totalReviews;
            studio.AvgRating = avgRating;
            studio.UpdatedAt = DateTime.UtcNow;
        }

        // ── Private helpers ──────────────────────────────────────────────────

        private IQueryable<Booking> BookingQuery()
            => _context.Bookings
                .Include(b => b.Customer)
                .Include(b => b.Studio)
                .Include(b => b.Package).ThenInclude(p => p.Service)
                .Include(b => b.Status)
                .Include(b => b.Slot).ThenInclude(s => s.WorkingDay)
                .Include(b => b.BookingLogs)
                .Include(b => b.Review)
                .Include(b => b.Payments).ThenInclude(p => p.Method)
                .Include(b => b.Payments).ThenInclude(p => p.PaymentStatus);

        private IQueryable<Payment> PaymentQuery()
            => _context.Payments
                .Include(p => p.Booking).ThenInclude(b => b.Studio)
                .Include(p => p.Method)
                .Include(p => p.PaymentStatus);
    }
}
