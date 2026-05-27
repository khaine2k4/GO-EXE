using exe201.Server.Models;
using EXE201.Server.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EXE201.Server.Services
{
    public class WalletService : IWalletService
    {
        private readonly IWalletRepository _walletRepository;
        private readonly PhotoStudioBookingContext _context;

        public WalletService(IWalletRepository walletRepository, PhotoStudioBookingContext context)
        {
            _walletRepository = walletRepository;
            _context = context;
        }

        public async Task<Wallet> GetOrCreateStudioWalletAsync(long studioId)
        {
            return await _walletRepository.GetOrCreateWalletAsync("STUDIO", studioId);
        }

        public async Task<Wallet> GetOrCreateStudioWalletByOwnerIdAsync(long ownerId)
        {
            var studio = await _context.Studios
                .FirstOrDefaultAsync(s => s.OwnerId == ownerId);
            if (studio == null)
                throw new System.InvalidOperationException("User does not own any studio.");

            return await GetOrCreateStudioWalletAsync(studio.StudioId);
        }

        public async Task<Wallet> GetOrCreateCustomerWalletAsync(long userId)
        {
            return await _walletRepository.GetOrCreateWalletAsync("CUSTOMER", userId);
        }

        public async Task<WalletTransaction> CreditStudioEarningAsync(long studioId, decimal amount, long bookingId, string description = "")
        {
            var wallet = await GetOrCreateStudioWalletAsync(studioId);
            if (string.IsNullOrEmpty(description))
            {
                description = $"Nhận thanh toán cho Booking #{bookingId}";
            }
            return await _walletRepository.CreditWalletAsync(wallet.WalletId, amount, "CREDIT_EARNING", bookingId, null, description);
        }

        public async Task<WalletTransaction> CreditCustomerRefundAsync(long userId, decimal amount, long bookingId, string description = "")
        {
            var wallet = await GetOrCreateCustomerWalletAsync(userId);
            if (string.IsNullOrEmpty(description))
            {
                description = $"Hoàn tiền cọc cho Booking #{bookingId}";
            }
            return await _walletRepository.CreditWalletAsync(wallet.WalletId, amount, "CREDIT_REFUND", bookingId, null, description);
        }

        public async Task<List<WalletTransaction>> GetWalletTransactionsAsync(long walletId, int limit = 50)
        {
            return await _walletRepository.GetTransactionsByWalletIdAsync(walletId, limit);
        }

        public async Task<List<Wallet>> GetAllWalletsAsync()
        {
            return await _walletRepository.GetAllWalletsAsync();
        }

        public async Task<WalletTransaction> WithdrawAsync(long userId, string ownerType, decimal amount, string bankInfo = "")
        {
            Wallet wallet;
            if (ownerType == "STUDIO")
            {
                var studio = await _context.Studios.FirstOrDefaultAsync(s => s.OwnerId == userId);
                if (studio == null)
                    throw new System.InvalidOperationException("User does not own any studio.");
                wallet = await GetOrCreateStudioWalletAsync(studio.StudioId);
            }
            else
            {
                wallet = await GetOrCreateCustomerWalletAsync(userId);
            }

            string description = $"Rút tiền về tài khoản ngân hàng. {bankInfo}".Trim();
            return await _walletRepository.DebitWalletAsync(wallet.WalletId, amount, "DEBIT_WITHDRAW", null, null, description);
        }
    }
}
