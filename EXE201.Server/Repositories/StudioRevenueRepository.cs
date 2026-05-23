using exe201.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace EXE201.Server.Repositories
{
    public class StudioRevenueRepository : IStudioRevenueRepository
    {
        private readonly PhotoStudioBookingContext _context;

        public StudioRevenueRepository(PhotoStudioBookingContext context)
        {
            _context = context;
        }

        public async Task<Studio?> GetOwnedStudioAsync(long ownerId)
        {
            return await _context.Studios
                .FirstOrDefaultAsync(s => s.OwnerId == ownerId && s.DeletedAt == null);
        }

        public async Task<List<Booking>> GetValidRevenueBookingsAsync(long studioId, DateTime? from = null, DateTime? to = null)
        {
            return await ValidRevenueBookingsQuery(studioId, from, to).ToListAsync();
        }

        public async Task<decimal> GetRefundedAmountAsync(long studioId, DateTime? from = null, DateTime? to = null)
        {
            return await _context.Payments
                .Include(p => p.PaymentStatus)
                .Include(p => p.Booking)
                .Where(p => p.Booking.StudioId == studioId)
                .Where(p => p.PaymentStatus.StatusName == "REFUNDED")
                .Where(p => !from.HasValue || (p.RefundedAt.HasValue && p.RefundedAt.Value >= from.Value))
                .Where(p => !to.HasValue || (p.RefundedAt.HasValue && p.RefundedAt.Value <= to.Value))
                .SumAsync(p => (decimal?)p.Amount) ?? 0m;
        }

        public async Task<List<Booking>> GetBookingsForStatisticsAsync(long studioId, DateTime? from = null, DateTime? to = null)
        {
            return await _context.Bookings
                .Include(b => b.Status)
                .Include(b => b.Package).ThenInclude(p => p.Service)
                .Include(b => b.Payments).ThenInclude(p => p.PaymentStatus)
                .Where(b => b.StudioId == studioId)
                .Where(b => !from.HasValue || b.CreatedAt >= from.Value)
                .Where(b => !to.HasValue || b.CreatedAt <= to.Value)
                .ToListAsync();
        }

        public async Task<List<Settlement>> GetSettlementsAsync(long studioId, string? status = null)
        {
            var query = _context.Settlements
                .Include(s => s.Studio)
                .Include(s => s.Booking).ThenInclude(b => b.Customer)
                .Include(s => s.Booking).ThenInclude(b => b.Status)
                .Where(s => s.StudioId == studioId);

            if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
                query = query.Where(s => s.Status == status);

            return await query
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
        }

        private IQueryable<Booking> ValidRevenueBookingsQuery(long studioId, DateTime? from, DateTime? to)
        {
            var query = _context.Bookings
                .Include(b => b.Customer)
                .Include(b => b.Studio)
                .Include(b => b.Status)
                .Include(b => b.Package).ThenInclude(p => p.Service)
                .Include(b => b.Payments).ThenInclude(p => p.PaymentStatus)
                .Where(b => b.StudioId == studioId)
                .Where(b => b.Status.StatusName == "COMPLETED")
                .Where(b => b.CompletedAt.HasValue)
                .Where(b => b.Payments.Any(p => p.PaymentStatus.StatusName == "PAID"));

            if (from.HasValue)
                query = query.Where(b => b.CompletedAt!.Value >= from.Value);

            if (to.HasValue)
                query = query.Where(b => b.CompletedAt!.Value <= to.Value);

            return query;
        }
    }
}
