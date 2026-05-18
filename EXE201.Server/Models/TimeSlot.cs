using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class TimeSlot
{
    public long SlotId { get; set; }

    public long WorkingDayId { get; set; }

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public string Status { get; set; } = null!;

    public virtual Booking? Booking { get; set; }

    public virtual WorkingDay WorkingDay { get; set; } = null!;
}
