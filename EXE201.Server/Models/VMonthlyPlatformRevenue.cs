using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class VMonthlyPlatformRevenue
{
    public string? Month { get; set; }

    public int? TotalBookings { get; set; }

    public decimal? GrossRevenue { get; set; }

    public decimal? PlatformCommission { get; set; }

    public decimal? StudioPayout { get; set; }
}
