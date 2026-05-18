using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class WorkingSchedule
{
    public long ScheduleId { get; set; }

    public long StudioId { get; set; }

    public byte DayOfWeek { get; set; }

    public TimeOnly OpenTime { get; set; }

    public TimeOnly CloseTime { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Studio Studio { get; set; } = null!;
}
