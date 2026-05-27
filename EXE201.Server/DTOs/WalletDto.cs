using System;
using System.Collections.Generic;

namespace EXE201.Server.DTOs
{
    public class WalletTransactionDto
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
    }

    public class WalletDto
    {
        public long WalletId { get; set; }
        public string OwnerType { get; set; } = null!; // "CUSTOMER" | "STUDIO"
        public long OwnerId { get; set; }
        public decimal Balance { get; set; }
        public decimal TotalIn { get; set; }
        public decimal TotalOut { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<WalletTransactionDto> Transactions { get; set; } = new();
    }
}
