using System;

namespace exe201.Server.Models;

public partial class AnalyticsEvent
{
    public long EventId { get; set; }

    public string EventName { get; set; } = null!;

    public string PageUrl { get; set; } = null!;

    public long? StudioId { get; set; }

    public long? PackageId { get; set; }

    public long? UserId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Studio? Studio { get; set; }

    public virtual Package? Package { get; set; }

    public virtual User? User { get; set; }
}
