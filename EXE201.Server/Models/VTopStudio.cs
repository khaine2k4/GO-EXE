using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class VTopStudio
{
    public long StudioId { get; set; }

    public string StudioName { get; set; } = null!;

    public string? City { get; set; }

    public decimal AvgRating { get; set; }

    public int TotalReviews { get; set; }

    public int TotalBookings { get; set; }
}
