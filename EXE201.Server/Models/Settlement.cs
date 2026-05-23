using System;

namespace exe201.Server.Models;

public partial class Settlement
{
    public long SettlementId { get; set; }

    public long BookingId { get; set; }

    public long StudioId { get; set; }

    public decimal GrossAmount { get; set; }

    public decimal PlatformFeePercent { get; set; }

    public decimal PlatformFeeAmount { get; set; }

    public decimal StudioAmount { get; set; }

    public string Status { get; set; } = null!;

    public string PayoutMethod { get; set; } = null!;

    public DateTime? PaidAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Booking Booking { get; set; } = null!;

    public virtual Studio Studio { get; set; } = null!;
}
