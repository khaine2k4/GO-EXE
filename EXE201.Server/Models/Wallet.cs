using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class Wallet
{
    public long WalletId { get; set; }

    public string OwnerType { get; set; } = null!; // "CUSTOMER" | "STUDIO"

    public long OwnerId { get; set; }

    public decimal Balance { get; set; }

    public decimal TotalIn { get; set; }

    public decimal TotalOut { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual ICollection<WalletTransaction> WalletTransactions { get; set; } = new List<WalletTransaction>();

    public virtual ICollection<PayoutRequest> PayoutRequests { get; set; } = new List<PayoutRequest>();
}
