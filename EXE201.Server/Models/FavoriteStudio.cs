using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class FavoriteStudio
{
    public long FavoriteId { get; set; }

    public long UserId { get; set; }

    public long StudioId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Studio Studio { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
