namespace EXE201.Server.DTOs
{
    public class AdminBookingDetailDto
    {
        public long Id { get; set; }
        public string BookingCode { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string RealStatus { get; set; } = null!;
        public string ShootingDate { get; set; } = null!;
        public string StartTime { get; set; } = null!;
        public string EndTime { get; set; } = null!;
        public string? ShootingLocation { get; set; }
        public string? Note { get; set; }
        public decimal TotalPrice { get; set; }
        public decimal CommissionPercent { get; set; }
        public decimal CommissionAmount { get; set; }
        public decimal StudioRevenue { get; set; }
        public string? PaymentExpiresAt { get; set; }
        public string? ConfirmedAt { get; set; }
        public string? RejectedAt { get; set; }
        public string? RejectReason { get; set; }
        public string? CompletedAt { get; set; }
        public string? CancelledAt { get; set; }
        public long? CancelledBy { get; set; }
        public string? CancelReason { get; set; }
        public string? CreatedAt { get; set; }
        public string? UpdatedAt { get; set; }

        public AdminBookingPartyDto Customer { get; set; } = new();
        public AdminBookingStudioDto Studio { get; set; } = new();
        public AdminBookingPackageDto Package { get; set; } = new();
        public PaymentResponse? LatestPayment { get; set; }
        public List<PaymentResponse> Payments { get; set; } = new();
        public List<AdminBookingLogDto> Logs { get; set; } = new();
        public AdminBookingDisputeDto? Dispute { get; set; }
    }

    public class AdminBookingPartyDto
    {
        public long Id { get; set; }
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Phone { get; set; }
    }

    public class AdminBookingStudioDto : AdminBookingPartyDto
    {
        public string StudioName { get; set; } = null!;
        public string? City { get; set; }
        public string? District { get; set; }
        public string? AddressLine { get; set; }
    }

    public class AdminBookingPackageDto
    {
        public long Id { get; set; }
        public string PackageName { get; set; } = null!;
        public string? ServiceName { get; set; }
        public decimal Price { get; set; }
    }

    public class AdminBookingLogDto
    {
        public long Id { get; set; }
        public string? OldStatus { get; set; }
        public string? NewStatus { get; set; }
        public long? ChangedBy { get; set; }
        public string? ChangedByName { get; set; }
        public string? Note { get; set; }
        public string ChangedAt { get; set; } = null!;
    }

    public class AdminBookingDisputeDto
    {
        public string? Reason { get; set; }
        public string? DisputedAt { get; set; }
        public string? ResolvedAt { get; set; }
        public long? ResolvedBy { get; set; }
        public string? ResolvedByName { get; set; }
    }
}
