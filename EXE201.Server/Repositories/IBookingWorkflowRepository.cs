using exe201.Server.Models;
using Microsoft.EntityFrameworkCore.Storage;

namespace EXE201.Server.Repositories
{
    public interface IBookingWorkflowRepository
    {
        // ── Transaction ─────────────────────────────────────────────────────
        Task<IDbContextTransaction> BeginTransactionAsync();
        Task SaveChangesAsync();

        // ── Studio lookup ────────────────────────────────────────────────────
        Task<Studio?> GetOwnedStudioAsync(long ownerId);
        Task<bool> IsStudioOwnerAsync(long studioId, long ownerId);

        // ── Working Schedule ─────────────────────────────────────────────────
        Task<List<WorkingSchedule>> GetSchedulesByStudioIdAsync(long studioId);
        Task<WorkingSchedule?> GetScheduleAsync(long studioId, int dayOfWeek);
        void AddSchedule(WorkingSchedule schedule);

        // ── Working Day ──────────────────────────────────────────────────────
        Task<List<WorkingDay>> GetWorkingDaysAsync(long studioId, DateOnly? from, DateOnly? to, bool includeClosed);
        Task<WorkingDay?> GetWorkingDayWithSlotsAsync(long studioId, DateOnly date);
        void AddWorkingDay(WorkingDay day);

        // ── Time Slot ────────────────────────────────────────────────────────
        Task<TimeSlot?> GetSlotWithWorkingDayAsync(long slotId);
        Task<List<TimeSlot>> GetSlotsByStudioDateAsync(long studioId, DateOnly date);

        /// <summary>
        /// Reload slot inside a transaction to check status before committing (race condition guard).
        /// </summary>
        Task<TimeSlot?> GetSlotForUpdateAsync(long slotId);
        void AddSlot(TimeSlot slot);

        // ── Package ──────────────────────────────────────────────────────────
        Task<Package?> GetActivePackageWithStudioAsync(long packageId);

        // ── Booking ──────────────────────────────────────────────────────────
        Task<Booking?> GetFullBookingAsync(long bookingId);
        Task<Booking?> GetBookingForUpdateAsync(long bookingId);
        Task<bool> SlotHasActiveBookingAsync(long slotId);
        Task<List<Booking>> GetExpiredPendingPaymentBookingsAsync(long pendingPaymentStatusId, DateTime now, int batchSize);
        Task<List<Booking>> GetBookingsByCustomerAsync(long customerId, string? status);
        Task<List<Booking>> GetBookingsByStudioAsync(long studioId, string? status);
        void AddBooking(Booking booking);
        Task<Booking?> GetBookingByPaymentCodeAsync(string paymentCode);

        // ── Booking Status ───────────────────────────────────────────────────
        Task<long?> GetBookingStatusIdAsync(string statusName);

        // ── Booking Log ──────────────────────────────────────────────────────
        void AddBookingLog(BookingLog log);

        // ── Payment ──────────────────────────────────────────────────────────
        Task<List<Payment>> GetPaymentsByCustomerAsync(long customerId);
        Task<List<Payment>> GetPaymentsByStudioAsync(long studioId);
        Task<PaymentMethod?> GetPaymentMethodAsync(string methodName);
        Task<PaymentStatus?> GetPaymentStatusAsync(string statusName);
        void AddPayment(Payment payment);

        // Settlement
        Task<bool> SettlementExistsAsync(long bookingId);
        void AddSettlement(Settlement settlement);
    }
}
