using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class VStudioRevenue
{
    public long StudioId { get; set; }

    public string StudioName { get; set; } = null!;

    public string? City { get; set; }

    public decimal AvgRating { get; set; }

    public int TotalReviews { get; set; }

    public int TotalBookings { get; set; }

    public int? CompletedBookings { get; set; }

    public decimal? GrossRevenue { get; set; }

    public decimal? CommissionDeducted { get; set; }

    public decimal? NetRevenue { get; set; }
}
