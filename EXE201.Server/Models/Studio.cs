using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class Studio
{
    public long StudioId { get; set; }

    public long OwnerId { get; set; }

    public string StudioName { get; set; } = null!;

    public string? Description { get; set; }

    public string? LogoUrl { get; set; }

    public string? CoverUrl { get; set; }

    public string? Phone { get; set; }

    public string? Email { get; set; }

    public string? City { get; set; }

    public string? District { get; set; }

    public string? AddressLine { get; set; }

    public decimal? Lat { get; set; }

    public decimal? Lng { get; set; }

    public decimal CommissionPercent { get; set; }

    public int SlotDurationMinutes { get; set; }

    public decimal AvgRating { get; set; }

    public int TotalReviews { get; set; }

    public int TotalBookings { get; set; }

    public string Status { get; set; } = null!;

    public string? RejectionReason { get; set; }

    public long? RejectedBy { get; set; }

    public DateTime? RejectedAt { get; set; }

    public long? ApprovedBy { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public long? BannedBy { get; set; }

    public DateTime? BannedAt { get; set; }

    public string? BanReason { get; set; }

    public DateTime? DeletedAt { get; set; }

    public long? DeletedBy { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime UpdatedAt { get; set; }

    public long? UpdatedBy { get; set; }

    public virtual User? ApprovedByNavigation { get; set; }

    public virtual User? BannedByNavigation { get; set; }

    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    public virtual ICollection<Conversation> Conversations { get; set; } = new List<Conversation>();

    public virtual User? DeletedByNavigation { get; set; }

    public virtual ICollection<FavoriteStudio> FavoriteStudios { get; set; } = new List<FavoriteStudio>();

    public virtual User Owner { get; set; } = null!;

    public virtual User? RejectedByNavigation { get; set; }

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual ICollection<Service> Services { get; set; } = new List<Service>();

    public virtual ICollection<Settlement> Settlements { get; set; } = new List<Settlement>();

    public virtual ICollection<StudioPortfolio> StudioPortfolios { get; set; } = new List<StudioPortfolio>();

    public virtual ICollection<WorkingDay> WorkingDays { get; set; } = new List<WorkingDay>();

    public virtual ICollection<WorkingSchedule> WorkingSchedules { get; set; } = new List<WorkingSchedule>();
}
