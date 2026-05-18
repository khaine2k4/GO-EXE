using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class Service
{
    public long ServiceId { get; set; }

    public long StudioId { get; set; }

    public long CategoryId { get; set; }

    public string ServiceName { get; set; } = null!;

    public string? Description { get; set; }

    public string? ThumbnailUrl { get; set; }

    public string? City { get; set; }

    public bool IsActive { get; set; }

    public bool IsHidden { get; set; }

    public long? HiddenBy { get; set; }

    public DateTime? HiddenAt { get; set; }

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime UpdatedAt { get; set; }

    public long? UpdatedBy { get; set; }

    public virtual Category Category { get; set; } = null!;

    public virtual ICollection<FavoriteService> FavoriteServices { get; set; } = new List<FavoriteService>();

    public virtual User? HiddenByNavigation { get; set; }

    public virtual ICollection<Package> Packages { get; set; } = new List<Package>();

    public virtual ICollection<ServiceImage> ServiceImages { get; set; } = new List<ServiceImage>();

    public virtual Studio Studio { get; set; } = null!;

    public virtual ICollection<StudioPortfolio> StudioPortfolios { get; set; } = new List<StudioPortfolio>();
}
