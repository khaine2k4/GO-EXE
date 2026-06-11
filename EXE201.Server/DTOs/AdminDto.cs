namespace EXE201.Server.DTOs
{
    public class UpdateUserStatusDto
    {
        public string Status { get; set; } = null!; // "ACTIVE" or "LOCKED"
    }

    public class RejectStudioDto
    {
        public string RejectionReason { get; set; } = null!;
    }

    public class UpdateUserRoleDto
    {
        public string RoleName { get; set; } = null!; // "CUSTOMER" or "STUDIO_OWNER"
    }

    public class AdminBookingDto
    {
        public long Id { get; set; }
        public string BookingCode { get; set; } = null!;
        public string CustomerName { get; set; } = null!;
        public string StudioName { get; set; } = null!;
        public string PackageName { get; set; } = null!;
        public string ShootingDate { get; set; } = null!;
        public string Status { get; set; } = null!;
        public decimal TotalPrice { get; set; }
        public decimal CommissionPercent { get; set; }
        public decimal CommissionAmount { get; set; }
        public decimal StudioRevenue { get; set; }
        public string? PaymentStatus { get; set; }
        public decimal? PaymentAmount { get; set; }
        public string? PaymentCode { get; set; }
        public string? City { get; set; }
        public string? DisputeNote { get; set; }
        public string CreatedAt { get; set; } = null!;
    }

    public class AdminReportDto
    {
        public long Id { get; set; }
        public string TypeName { get; set; } = null!;
        public string ReporterName { get; set; } = null!;
        public string TargetType { get; set; } = null!;
        public long TargetId { get; set; }
        public string? Description { get; set; }
        public string Status { get; set; } = null!;
        public string? HandlerNote { get; set; }
        public string CreatedAt { get; set; } = null!;
        public string? ResolvedAt { get; set; }
    }

    public class ResolveReportDto
    {
        public string Status { get; set; } = null!;
        public string? HandlerNote { get; set; }
    }

    public class BanStudioRequestDto
    {
        public string BanReason { get; set; } = null!;
    }

    public class AdminReviewDto
    {
        public long Id { get; set; }
        public string CustomerName { get; set; } = null!;
        public string StudioName { get; set; } = null!;
        public byte Rating { get; set; }
        public string? Comment { get; set; }
        public bool IsHidden { get; set; }
        public string? HiddenNote { get; set; }
        public string CreatedAt { get; set; } = null!;
    }

    public class HideReviewRequestDto
    {
        public bool IsHidden { get; set; }
        public string? HiddenNote { get; set; }
    }

    public class AdminServiceDto
    {
        public long ServiceId { get; set; }
        public string ServiceName { get; set; } = null!;
        public long StudioId { get; set; }
        public string StudioName { get; set; } = null!;
        public long CategoryId { get; set; }
        public string CategoryName { get; set; } = null!;
        public string? City { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public bool IsActive { get; set; }
        public bool IsHidden { get; set; }
        public long? HiddenBy { get; set; }
        public string? HiddenByName { get; set; }
        public string? HiddenAt { get; set; }
        public string CreatedAt { get; set; } = null!;
        public string UpdatedAt { get; set; } = null!;
        public int PackageCount { get; set; }
    }

    public class AdminServiceModerationRequestDto
    {
        public string? Reason { get; set; }
    }

    public class AdminPaymentDto
    {
        public long PaymentId { get; set; }
        public string PaymentCode { get; set; } = null!;
        public long BookingId { get; set; }
        public string BookingCode { get; set; } = null!;
        public long CustomerId { get; set; }
        public string CustomerName { get; set; } = null!;
        public string CustomerEmail { get; set; } = null!;
        public long StudioId { get; set; }
        public string StudioName { get; set; } = null!;
        public decimal Amount { get; set; }
        public string CurrencyCode { get; set; } = null!;
        public string PaymentMethod { get; set; } = null!;
        public string PaymentStatus { get; set; } = null!;
        public string? TransactionCode { get; set; }
        public string? ProviderRef { get; set; }
        public string? FailureReason { get; set; }
        public string? PaidAt { get; set; }
        public string? RefundedAt { get; set; }
        public decimal? RefundAmount { get; set; }
        public decimal? RetainedAmount { get; set; }
        public decimal? StudioCompensationAmount { get; set; }
        public string? PolicyCode { get; set; }
        public string? PolicyNote { get; set; }
        public string CreatedAt { get; set; } = null!;
        public string UpdatedAt { get; set; } = null!;
    }

    public class AdminPaymentDetailDto : AdminPaymentDto
    {
        public string BookingStatus { get; set; } = null!;
        public string? ShootingDate { get; set; }
        public string? ShootingLocation { get; set; }
        public string PackageName { get; set; } = null!;
        public decimal GrossAmount { get; set; }
        public decimal CommissionPercent { get; set; }
        public decimal CommissionAmount { get; set; }
        public decimal StudioRevenue { get; set; }
        public string? RefundReason { get; set; }
    }

    public class UpdateAdminPaymentStatusRequestDto
    {
        public string Status { get; set; } = null!;
        public string? Reason { get; set; }
        public string? TransactionCode { get; set; }
    }

    public class AdminRevenueSummaryDto
    {
        public decimal GrossRevenue { get; set; }
        public decimal PlatformCommission { get; set; }
        public decimal StudioPayout { get; set; }
        public int CompletedBookings { get; set; }
        public int PaidPayments { get; set; }
        public decimal RefundedAmount { get; set; }
        public decimal AverageCommissionRate { get; set; }
    }

    public class AdminMonthlyRevenueDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public decimal GrossRevenue { get; set; }
        public decimal PlatformCommission { get; set; }
        public decimal StudioPayout { get; set; }
        public int CompletedBookings { get; set; }
    }

    public class AdminCommissionDto
    {
        public long BookingId { get; set; }
        public string BookingCode { get; set; } = null!;
        public long StudioId { get; set; }
        public string StudioName { get; set; } = null!;
        public string CustomerName { get; set; } = null!;
        public string ServiceName { get; set; } = null!;
        public decimal GrossAmount { get; set; }
        public decimal CommissionPercent { get; set; }
        public decimal CommissionAmount { get; set; }
        public decimal StudioRevenue { get; set; }
        public string PaymentStatus { get; set; } = null!;
        public string BookingStatus { get; set; } = null!;
        public string? CompletedAt { get; set; }
        public string? PaidAt { get; set; }
    }

    public class SettlementDto
    {
        public long SettlementId { get; set; }
        public long BookingId { get; set; }
        public string BookingCode { get; set; } = null!;
        public long StudioId { get; set; }
        public string StudioName { get; set; } = null!;
        public string CustomerName { get; set; } = null!;
        public string BookingStatus { get; set; } = null!;
        public decimal GrossAmount { get; set; }
        public decimal PlatformFeePercent { get; set; }
        public decimal PlatformFeeAmount { get; set; }
        public decimal StudioAmount { get; set; }
        public string Status { get; set; } = null!;
        public string PayoutMethod { get; set; } = null!;
        public string? CompletedAt { get; set; }
        public string? PaidAt { get; set; }
        public string CreatedAt { get; set; } = null!;
        public string UpdatedAt { get; set; } = null!;
    }

    public class SettlementPayoutRequestDto
    {
        public string? PayoutMethod { get; set; }
    }
}
