using System;

namespace exe201.Server.Models;

public partial class PayoutRequest
{
    public long PayoutId { get; set; }

    public long WalletId { get; set; }

    public decimal Amount { get; set; }

    public string Status { get; set; } = "PENDING"; // "PENDING" | "APPROVED" | "REJECTED" | "FAILED"

    public string BankCode { get; set; } = null!;

    public string AccountNumber { get; set; } = null!;

    public string AccountName { get; set; } = null!;

    public string? Description { get; set; }

    public string ReferenceId { get; set; } = null!;

    public string? TransactionCode { get; set; }

    public string? FailureReason { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Wallet Wallet { get; set; } = null!;
}
