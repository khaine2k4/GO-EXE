using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class FavoriteService
{
    public long FavoriteId { get; set; }

    public long UserId { get; set; }

    public long ServiceId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Service Service { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
