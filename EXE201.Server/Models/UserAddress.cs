using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class UserAddress
{
    public long AddressId { get; set; }

    public long UserId { get; set; }

    public string? City { get; set; }

    public string? District { get; set; }

    public string? Ward { get; set; }

    public string? AddressLine { get; set; }

    public bool IsDefault { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
