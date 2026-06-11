using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class Booking
{
    public long BookingId { get; set; }

    public long CustomerId { get; set; }

    public long StudioId { get; set; }

    public long PackageId { get; set; }

    public long SlotId { get; set; }

    public long StatusId { get; set; }

    public string BookingCode { get; set; } = null!;

    public DateOnly ShootingDate { get; set; }

    public string? ShootingLocation { get; set; }

    public decimal? ShootingLat { get; set; }

    public decimal? ShootingLng { get; set; }

    public string? Note { get; set; }

    public decimal TotalPrice { get; set; }

    public decimal CommissionPercent { get; set; }

    public decimal CommissionAmount { get; set; }

    public decimal StudioRevenue { get; set; }

    public string? PackageNameSnapshot { get; set; }

    public string? ServiceNameSnapshot { get; set; }

    public string? PackageDescriptionSnapshot { get; set; }

    public int? PackageDurationHoursSnapshot { get; set; }

    public int? PackageMaxPhotosSnapshot { get; set; }

    public string? PackageInclusionsSnapshot { get; set; }

    public DateTime? PaymentExpiresAt { get; set; }

    public DateTime? ConfirmedAt { get; set; }

    public DateTime? RejectedAt { get; set; }

    public string? RejectReason { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime? CancelledAt { get; set; }

    public long? CancelledBy { get; set; }

    public string? CancelReason { get; set; }

    public DateTime? DisputedAt { get; set; }

    public string? DisputeNote { get; set; }

    public DateTime? DisputeResolvedAt { get; set; }

    public long? DisputeResolvedBy { get; set; }

    public long? DisputeCreatedBy { get; set; }

    public string? DisputeCreatedByRole { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime UpdatedAt { get; set; }

    public long? UpdatedBy { get; set; }

    public virtual ICollection<BookingLog> BookingLogs { get; set; } = new List<BookingLog>();

    public virtual User? CancelledByNavigation { get; set; }

    public virtual ICollection<Conversation> Conversations { get; set; } = new List<Conversation>();

    public virtual User Customer { get; set; } = null!;

    public virtual User? DisputeCreatedByNavigation { get; set; }

    public virtual User? DisputeResolvedByNavigation { get; set; }

    public virtual Package Package { get; set; } = null!;

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public virtual Review? Review { get; set; }

    public virtual Settlement? Settlement { get; set; }

    public virtual TimeSlot Slot { get; set; } = null!;

    public virtual BookingStatus Status { get; set; } = null!;

    public virtual Studio Studio { get; set; } = null!;

    public virtual ICollection<WalletTransaction> WalletTransactions { get; set; } = new List<WalletTransaction>();
}
