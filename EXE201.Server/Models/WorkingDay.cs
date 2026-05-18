using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class WorkingDay
{
    public long WorkingDayId { get; set; }

    public long StudioId { get; set; }

    public DateOnly WorkingDate { get; set; }

    public bool IsAvailable { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Studio Studio { get; set; } = null!;

    public virtual ICollection<TimeSlot> TimeSlots { get; set; } = new List<TimeSlot>();
}
