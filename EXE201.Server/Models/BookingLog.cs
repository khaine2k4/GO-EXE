using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class BookingLog
{
    public long LogId { get; set; }

    public long BookingId { get; set; }

    public string? OldStatus { get; set; }

    public string? NewStatus { get; set; }

    public long? ChangedBy { get; set; }

    public string? Note { get; set; }

    public DateTime ChangedAt { get; set; }

    public virtual Booking Booking { get; set; } = null!;

    public virtual User? ChangedByNavigation { get; set; }
}
