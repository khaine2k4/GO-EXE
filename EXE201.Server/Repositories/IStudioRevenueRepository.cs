using exe201.Server.Models;

namespace EXE201.Server.Repositories
{
    public interface IStudioRevenueRepository
    {
        Task<Studio?> GetOwnedStudioAsync(long ownerId);
        Task<List<Booking>> GetValidRevenueBookingsAsync(long studioId, DateTime? from = null, DateTime? to = null);
        Task<decimal> GetRefundedAmountAsync(long studioId, DateTime? from = null, DateTime? to = null);
        Task<List<Booking>> GetBookingsForStatisticsAsync(long studioId, DateTime? from = null, DateTime? to = null);
        Task<List<Settlement>> GetSettlementsAsync(long studioId, string? status = null);
    }
}
