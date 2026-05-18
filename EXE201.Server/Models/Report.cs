using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class Report
{
    public long ReportId { get; set; }

    public long ReportTypeId { get; set; }

    public long ReporterId { get; set; }

    public string TargetType { get; set; } = null!;

    public long TargetId { get; set; }

    public string? Description { get; set; }

    public string Status { get; set; } = null!;

    public long? HandledBy { get; set; }

    public string? HandlerNote { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User? HandledByNavigation { get; set; }

    public virtual ReportType ReportType { get; set; } = null!;

    public virtual User Reporter { get; set; } = null!;
}
