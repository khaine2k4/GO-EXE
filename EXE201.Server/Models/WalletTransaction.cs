using System;

namespace exe201.Server.Models;

public partial class WalletTransaction
{
    public long TxId { get; set; }

    public long WalletId { get; set; }

    public string TxType { get; set; } = null!; // "CREDIT_REFUND" | "CREDIT_EARNING" | "DEBIT_WITHDRAW"

    public decimal Amount { get; set; }

    public decimal BalanceAfter { get; set; }

    public long? BookingId { get; set; }

    public long? PaymentId { get; set; }

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Wallet Wallet { get; set; } = null!;

    public virtual Booking? Booking { get; set; }

    public virtual Payment? Payment { get; set; }
}
