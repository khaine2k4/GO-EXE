using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class StudioPortfolio
{
    public long PortfolioId { get; set; }

    public long StudioId { get; set; }

    public long? ServiceId { get; set; }

    public string ImageUrl { get; set; } = null!;

    public string? Caption { get; set; }

    public int SortOrder { get; set; }

    public DateTime UploadedAt { get; set; }

    public long? UploadedBy { get; set; }

    public virtual Service? Service { get; set; }

    public virtual Studio Studio { get; set; } = null!;

    public virtual User? UploadedByNavigation { get; set; }
}
