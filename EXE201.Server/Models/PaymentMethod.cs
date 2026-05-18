using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class PaymentMethod
{
    public long MethodId { get; set; }

    public string MethodName { get; set; } = null!;

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
