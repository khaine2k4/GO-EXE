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
}
