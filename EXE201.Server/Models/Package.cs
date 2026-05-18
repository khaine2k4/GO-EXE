using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class Package
{
    public long PackageId { get; set; }

    public long ServiceId { get; set; }

    public string PackageName { get; set; } = null!;

    public string? Description { get; set; }

    public decimal Price { get; set; }

    public int? DurationHours { get; set; }

    public int? MaxPhotos { get; set; }

    public string? Inclusions { get; set; }

    public bool IsActive { get; set; }

    public int SortOrder { get; set; }

    public DateTime? DeletedAt { get; set; }

    public long? DeletedBy { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime UpdatedAt { get; set; }

    public long? UpdatedBy { get; set; }

    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    public virtual User? DeletedByNavigation { get; set; }

    public virtual Service Service { get; set; } = null!;
}
