using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class User
{
    public long UserId { get; set; }

    public long RoleId { get; set; }

    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? Phone { get; set; }

    public string PasswordHash { get; set; } = null!;

    public string? AvatarUrl { get; set; }

    public string? Gender { get; set; }

    public DateOnly? Dob { get; set; }

    public string Status { get; set; } = null!;

    public bool EmailVerified { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public long? DeletedBy { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedBy { get; set; }

    public DateTime UpdatedAt { get; set; }

    public long? UpdatedBy { get; set; }

    public string? ResetToken { get; set; }

    public DateTime? ResetTokenExpiresAt { get; set; }

    public string? VerificationToken { get; set; }

    public DateTime? VerificationTokenExpiresAt { get; set; }

    public virtual ICollection<Booking> BookingCancelledByNavigations { get; set; } = new List<Booking>();

    public virtual ICollection<Booking> BookingCustomers { get; set; } = new List<Booking>();

    public virtual ICollection<Booking> BookingDisputeCreatedByNavigations { get; set; } = new List<Booking>();

    public virtual ICollection<Booking> BookingDisputeResolvedByNavigations { get; set; } = new List<Booking>();

    public virtual ICollection<BookingDisputeEvidence> BookingDisputeEvidences { get; set; } = new List<BookingDisputeEvidence>();

    public virtual ICollection<BookingLog> BookingLogs { get; set; } = new List<BookingLog>();

    public virtual ICollection<Conversation> Conversations { get; set; } = new List<Conversation>();

    public virtual ICollection<FavoriteService> FavoriteServices { get; set; } = new List<FavoriteService>();

    public virtual ICollection<FavoriteStudio> FavoriteStudios { get; set; } = new List<FavoriteStudio>();

    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<Package> Packages { get; set; } = new List<Package>();

    public virtual ICollection<Report> ReportHandledByNavigations { get; set; } = new List<Report>();

    public virtual ICollection<Report> ReportReporters { get; set; } = new List<Report>();

    public virtual ICollection<Review> ReviewCustomers { get; set; } = new List<Review>();

    public virtual ICollection<Review> ReviewHiddenByNavigations { get; set; } = new List<Review>();

    public virtual Role Role { get; set; } = null!;

    public virtual ICollection<Service> Services { get; set; } = new List<Service>();

    public virtual ICollection<Studio> StudioApprovedByNavigations { get; set; } = new List<Studio>();

    public virtual ICollection<Studio> StudioBannedByNavigations { get; set; } = new List<Studio>();

    public virtual ICollection<Studio> StudioDeletedByNavigations { get; set; } = new List<Studio>();

    public virtual ICollection<Studio> StudioOwners { get; set; } = new List<Studio>();

    public virtual ICollection<StudioPortfolio> StudioPortfolios { get; set; } = new List<StudioPortfolio>();

    public virtual ICollection<Studio> StudioRejectedByNavigations { get; set; } = new List<Studio>();

    public virtual ICollection<UserAddress> UserAddresses { get; set; } = new List<UserAddress>();
}
