using System;

namespace exe201.Server.Models;

public partial class PageView
{
    public long ViewId { get; set; }

    public string PagePath { get; set; } = null!;

    public long? UserId { get; set; }

    public string SessionId { get; set; } = null!;

    public string? UserAgent { get; set; }

    public string? Referrer { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User? User { get; set; }
}
