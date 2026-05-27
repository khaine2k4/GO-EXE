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
    }
}
