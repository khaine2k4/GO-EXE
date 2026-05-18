using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class ReportType
{
    public long ReportTypeId { get; set; }

    public string TypeName { get; set; } = null!;

    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();
}
