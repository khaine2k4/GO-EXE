using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class VSystemStat
{
    public int? ActiveUsers { get; set; }

    public int? ApprovedStudios { get; set; }

    public int? PendingStudios { get; set; }

    public int? TotalBookings { get; set; }

    public decimal? TotalCommission { get; set; }

    public int? PendingReports { get; set; }
}
