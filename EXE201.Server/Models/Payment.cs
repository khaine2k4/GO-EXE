using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class Payment
{
    public long PaymentId { get; set; }

    public long BookingId { get; set; }

    public long MethodId { get; set; }

    public long PaymentStatusId { get; set; }

    public string PaymentCode { get; set; } = null!;

    public decimal Amount { get; set; }

    public string CurrencyCode { get; set; } = null!;

    public string PaymentProvider { get; set; } = null!;

    public string? TransactionCode { get; set; }

    public string? ProviderRef { get; set; }

    public string? FailureReason { get; set; }

    public DateTime? PaidAt { get; set; }

    public DateTime? RefundedAt { get; set; }

    public string? RefundReason { get; set; }

    public string? RefundMethod { get; set; }

    public string? RefundPendingReason { get; set; }

    public decimal? RefundAmount { get; set; }

    public decimal? RetainedAmount { get; set; }

    public decimal? StudioCompensationAmount { get; set; }

    public string? PolicyCode { get; set; }

    public string? PolicyNote { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual Booking Booking { get; set; } = null!;

    public virtual PaymentMethod Method { get; set; } = null!;

    public virtual PaymentStatus PaymentStatus { get; set; } = null!;

    public virtual ICollection<WalletTransaction> WalletTransactions { get; set; } = new List<WalletTransaction>();
}
