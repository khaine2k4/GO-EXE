using EXE201.Server.DTOs;

namespace EXE201.Server.Services
{
    public interface IStudioRevenueService
    {
        Task<StudioRevenueDto?> GetRevenueAsync(long ownerId, DateTime? from = null, DateTime? to = null);
        Task<List<StudioCommissionDto>?> GetCommissionsAsync(long ownerId, DateTime? from = null, DateTime? to = null, string? search = null, string? sortBy = null);
        Task<StudioBookingStatisticsDto?> GetBookingStatisticsAsync(long ownerId, DateTime? from = null, DateTime? to = null);
        Task<StudioCommissionSettingDto?> GetCommissionSettingAsync(long ownerId);
        Task<List<SettlementDto>?> GetSettlementsAsync(long ownerId, string? status = null);
    }
}
