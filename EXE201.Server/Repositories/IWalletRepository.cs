using exe201.Server.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EXE201.Server.Repositories
{
    public interface IWalletRepository
    {
        Task<Wallet> GetOrCreateWalletAsync(string ownerType, long ownerId);
        Task<WalletTransaction> CreditWalletAsync(long walletId, decimal amount, string txType, long? bookingId, long? paymentId, string description);
        Task<WalletTransaction> DebitWalletAsync(long walletId, decimal amount, string txType, long? bookingId, long? paymentId, string description);
        Task<List<WalletTransaction>> GetTransactionsByWalletIdAsync(long walletId, int limit = 50);
        Task<List<Wallet>> GetAllWalletsAsync();
    }
}
