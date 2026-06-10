using exe201.Server.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EXE201.Server.Repositories
{
    public class WalletRepository : IWalletRepository
    {
        private readonly PhotoStudioBookingContext _context;

        public WalletRepository(PhotoStudioBookingContext context)
        {
            _context = context;
        }

        public async Task<Wallet> GetOrCreateWalletAsync(string ownerType, long ownerId)
        {
            var wallet = await _context.Wallets
                .FirstOrDefaultAsync(w => w.OwnerType == ownerType && w.OwnerId == ownerId);

            if (wallet == null)
            {
                wallet = new Wallet
                {
                    OwnerType = ownerType,
                    OwnerId = ownerId,
                    Balance = 0,
                    TotalIn = 0,
                    TotalOut = 0,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _context.Wallets.AddAsync(wallet);
                await _context.SaveChangesAsync();
            }

            return wallet;
        }

        public async Task<WalletTransaction> CreditWalletAsync(long walletId, decimal amount, string txType, long? bookingId, long? paymentId, string description)
        {
            var existing = await FindTransactionAsync(walletId, txType, bookingId, paymentId);
            if (existing != null) return existing;

            var wallet = await _context.Wallets.FindAsync(walletId);
            if (wallet == null)
                throw new ArgumentException($"Wallet with ID {walletId} not found.");

            wallet.Balance += amount;
            wallet.TotalIn += amount;
            wallet.UpdatedAt = DateTime.UtcNow;

            var transaction = new WalletTransaction
            {
                WalletId = walletId,
                TxType = txType,
                Amount = amount,
                BalanceAfter = wallet.Balance,
                BookingId = bookingId,
                PaymentId = paymentId,
                Description = description,
                CreatedAt = DateTime.UtcNow
            };

            await _context.WalletTransactions.AddAsync(transaction);
            await _context.SaveChangesAsync();

            return transaction;
        }

        public async Task<WalletTransaction?> FindTransactionAsync(long walletId, string txType, long? bookingId, long? paymentId)
        {
            if (bookingId == null && paymentId == null) return null;

            return await _context.WalletTransactions
                .Where(t => t.WalletId == walletId && t.TxType == txType)
                .Where(t => bookingId == null || t.BookingId == bookingId)
                .Where(t => paymentId == null || t.PaymentId == paymentId)
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<WalletTransaction> DebitWalletAsync(long walletId, decimal amount, string txType, long? bookingId, long? paymentId, string description)
        {
            var wallet = await _context.Wallets.FindAsync(walletId);
            if (wallet == null)
                throw new ArgumentException($"Wallet with ID {walletId} not found.");

            if (wallet.Balance < amount)
                throw new InvalidOperationException("Insufficient wallet balance.");

            wallet.Balance -= amount;
            wallet.TotalOut += amount;
            wallet.UpdatedAt = DateTime.UtcNow;

            var transaction = new WalletTransaction
            {
                WalletId = walletId,
                TxType = txType,
                Amount = amount,
                BalanceAfter = wallet.Balance,
                BookingId = bookingId,
                PaymentId = paymentId,
                Description = description,
                CreatedAt = DateTime.UtcNow
            };

            await _context.WalletTransactions.AddAsync(transaction);
            await _context.SaveChangesAsync();

            return transaction;
        }

        public async Task<List<WalletTransaction>> GetTransactionsByWalletIdAsync(long walletId, int limit = 50)
        {
            return await _context.WalletTransactions
                .Where(t => t.WalletId == walletId)
                .OrderByDescending(t => t.CreatedAt)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<List<Wallet>> GetAllWalletsAsync()
        {
            return await _context.Wallets
                .OrderByDescending(w => w.UpdatedAt)
                .ToListAsync();
        }
    }
}
