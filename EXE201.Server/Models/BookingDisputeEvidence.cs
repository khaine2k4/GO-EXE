using System;

namespace exe201.Server.Models;

public partial class BookingDisputeEvidence
{
    public long EvidenceId { get; set; }

    public long BookingId { get; set; }

    public long UploadedBy { get; set; }

    public string UploadedByRole { get; set; } = null!;

    public string FileUrl { get; set; } = null!;

    public string FileType { get; set; } = null!;

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Booking Booking { get; set; } = null!;

    public virtual User UploadedByNavigation { get; set; } = null!;
}
