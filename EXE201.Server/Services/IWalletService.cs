using exe201.Server.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EXE201.Server.Services
{
    public interface IWalletService
    {
        Task<Wallet> GetOrCreateStudioWalletAsync(long studioId);
        Task<Wallet> GetOrCreateStudioWalletByOwnerIdAsync(long ownerId);
        Task<Wallet> GetOrCreateCustomerWalletAsync(long userId);
        Task<WalletTransaction> CreditStudioEarningAsync(long studioId, decimal amount, long bookingId, string description = "");
        Task<WalletTransaction> CreditCustomerRefundAsync(long userId, decimal amount, long bookingId, string description = "");
        Task<List<WalletTransaction>> GetWalletTransactionsAsync(long walletId, int limit = 50);
        Task<List<Wallet>> GetAllWalletsAsync();

        // Payout / Withdrawal Approval Workflow
        Task<PayoutRequest> CreatePayoutRequestAsync(long userId, string ownerType, decimal amount, string bankCode, string accountNumber, string accountName, string description = "");
        Task<List<PayoutRequest>> GetPayoutRequestsAsync(string? status = null);
        Task<List<PayoutRequest>> GetMyPayoutRequestsAsync(long userId, string ownerType);
        Task<PayoutRequest> ApprovePayoutRequestAsync(long payoutId, long adminUserId);
        Task<PayoutRequest> RejectPayoutRequestAsync(long payoutId, long adminUserId, string reason);
    }
}
