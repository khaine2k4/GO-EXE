using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class Review
{
    public long ReviewId { get; set; }

    public long BookingId { get; set; }

    public long CustomerId { get; set; }

    public long StudioId { get; set; }

    public byte Rating { get; set; }

    public string? Comment { get; set; }

    public bool IsHidden { get; set; }

    public long? HiddenBy { get; set; }

    public DateTime? HiddenAt { get; set; }

    public string? HiddenNote { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public long? UpdatedBy { get; set; }

    public virtual Booking Booking { get; set; } = null!;

    public virtual User Customer { get; set; } = null!;

    public virtual User? HiddenByNavigation { get; set; }

    public virtual Studio Studio { get; set; } = null!;
}
