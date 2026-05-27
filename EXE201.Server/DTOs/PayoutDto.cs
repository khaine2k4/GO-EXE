using System;

namespace EXE201.Server.DTOs
{
    public class PayoutRequestDto
    {
        public long PayoutId { get; set; }
        public long WalletId { get; set; }
        public string OwnerName { get; set; } = null!; // User FullName
        public string OwnerType { get; set; } = null!; // CUSTOMER | STUDIO
        public decimal Amount { get; set; }
        public string Status { get; set; } = null!; // PENDING | APPROVED | REJECTED | FAILED
        public string BankCode { get; set; } = null!;
        public string AccountNumber { get; set; } = null!;
        public string AccountName { get; set; } = null!;
        public string? Description { get; set; }
        public string ReferenceId { get; set; } = null!;
        public string? TransactionCode { get; set; }
        public string? FailureReason { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateWithdrawalRequestDto
    {
        public decimal Amount { get; set; }
        public string BankCode { get; set; } = null!;
        public string AccountNumber { get; set; } = null!;
        public string? Description { get; set; }
    }

    public class RejectPayoutRequestDto
    {
        public string Reason { get; set; } = null!;
    }
}
