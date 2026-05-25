using EXE201.Server.DTOs;

namespace EXE201.Server.Repositories
{
    public interface IAdminRepository
    {
        Task<List<AdminBookingDto>> GetBookingsAsync(string? search = null, string? status = null, string? paymentStatus = null, string? sortBy = null);
        Task<AdminBookingDetailDto?> GetAdminBookingDetailAsync(long bookingId);
        Task<AdminDashboardDto> GetAdminDashboardStatsAsync();
        Task<AdminBookingDetailDto?> ResolveDisputeAsync(long bookingId, string decision, string? adminNote, long adminId);
        Task<List<AdminReportDto>> GetReportsAsync(string? search = null, string? status = null, string? targetType = null, string? sortBy = null);
        Task<bool> ResolveReportAsync(long reportId, string status, string? handlerNote, long adminId);
        Task<List<AdminReviewDto>> GetReviewsAsync(string? search = null, bool? isHidden = null);
        Task<bool> ToggleHideReviewAsync(long reviewId, bool isHidden, string? note, long adminId);
        Task<List<AdminServiceDto>> GetServicesAsync(string? search = null, string? status = null, long? categoryId = null, long? studioId = null, bool? isHidden = null, string? sortBy = null);
        Task<AdminServiceDto?> HideServiceAsync(long serviceId, long adminId, string? reason = null);
        Task<AdminServiceDto?> UnhideServiceAsync(long serviceId, long adminId);
        Task<AdminServiceDto?> SoftDeleteServiceAsync(long serviceId, long adminId, string? reason = null);
        Task<List<AdminPaymentDto>> GetPaymentsAsync(string? search = null, string? status = null, string? method = null, long? studioId = null, DateTime? from = null, DateTime? to = null, string? sortBy = null);
        Task<AdminPaymentDetailDto?> GetPaymentDetailAsync(long paymentId);
        Task<AdminPaymentDetailDto?> UpdatePaymentStatusAsync(long paymentId, UpdateAdminPaymentStatusRequestDto request, long adminId);
        Task<AdminRevenueSummaryDto> GetRevenueSummaryAsync(DateTime? from = null, DateTime? to = null);
        Task<List<AdminMonthlyRevenueDto>> GetMonthlyRevenueAsync(DateTime? from = null, DateTime? to = null);
        Task<List<AdminCommissionDto>> GetCommissionsAsync(long? studioId = null, string? search = null, DateTime? from = null, DateTime? to = null, string? sortBy = null);
        Task<List<SettlementDto>> GetSettlementsAsync(string? status = null, long? studioId = null, string? search = null, string? sortBy = null);
        Task<SettlementDto?> MarkSettlementPaidAsync(long settlementId, string? payoutMethod = null);
    }
}
