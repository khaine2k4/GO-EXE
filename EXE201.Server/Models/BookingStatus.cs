using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class BookingStatus
{
    public long StatusId { get; set; }

    public string StatusName { get; set; } = null!;

    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
