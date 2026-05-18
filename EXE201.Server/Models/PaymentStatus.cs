using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class PaymentStatus
{
    public long PaymentStatusId { get; set; }

    public string StatusName { get; set; } = null!;

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
