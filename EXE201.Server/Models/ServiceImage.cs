using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class ServiceImage
{
    public long ImageId { get; set; }

    public long ServiceId { get; set; }

    public string ImageUrl { get; set; } = null!;

    public int SortOrder { get; set; }

    public virtual Service Service { get; set; } = null!;
}
