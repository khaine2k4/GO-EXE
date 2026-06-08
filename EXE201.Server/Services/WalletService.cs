using exe201.Server.Models;
using EXE201.Server.Repositories;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace EXE201.Server.Services
{
    public class WalletService : IWalletService
    {
        private readonly IWalletRepository _walletRepository;
        private readonly PhotoStudioBookingContext _context;
        private readonly IPayOsService _payOsService;

        public WalletService(IWalletRepository walletRepository, PhotoStudioBookingContext context, IPayOsService payOsService)
        {
            _walletRepository = walletRepository;
            _context = context;
            _payOsService = payOsService;
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

        // ================================================================
        // PAYOS DIRECT PAYOUTS & ADMIN APPROVAL WORKFLOW
        // ================================================================

        public async Task<PayoutRequest> CreatePayoutRequestAsync(long userId, string ownerType, decimal amount, string bankCode, string accountNumber, string accountName, string description = "")
        {
            // 1. Get corresponding wallet
            Wallet wallet;
            if (ownerType == "STUDIO")
            {
                var studio = await _context.Studios.FirstOrDefaultAsync(s => s.OwnerId == userId);
                if (studio == null)
                    throw new InvalidOperationException("Không tìm thấy Studio liên kết với tài khoản này.");
                wallet = await GetOrCreateStudioWalletAsync(studio.StudioId);
            }
            else
            {
                wallet = await GetOrCreateCustomerWalletAsync(userId);
            }

            // 2. Validate Amount
            if (amount <= 0)
                throw new ArgumentException("Số tiền rút phải lớn hơn 0.");
            if (amount < 10000)
                throw new ArgumentException("Số tiền rút tối thiểu là 10,000 VND.");
            if (wallet.Balance < amount)
                throw new InvalidOperationException("Số dư ví không đủ để thực hiện giao dịch rút tiền.");

            // 3. Validate bank format
            if (string.IsNullOrWhiteSpace(bankCode))
                throw new ArgumentException("Mã ngân hàng không được để trống.");
            if (string.IsNullOrWhiteSpace(accountNumber) || !Regex.IsMatch(accountNumber, @"^\d+$"))
                throw new ArgumentException("Số tài khoản chỉ được chứa chữ số.");

            // 4. Normalize the bank account holder name supplied for this withdrawal.
            var normalizedAccountName = RemoveSign4VietnameseString(accountName);
            if (string.IsNullOrWhiteSpace(normalizedAccountName) || normalizedAccountName.Length < 2)
                throw new InvalidOperationException("Tên chủ tài khoản ngân hàng không hợp lệ.");

            // 5. Freeze wallet balance (deduct immediately)
            wallet.Balance -= amount;
            wallet.TotalOut += amount;
            wallet.UpdatedAt = DateTime.UtcNow;

            // 6. Create payout request in DB
            var refId = $"PAYOUT-{DateTime.UtcNow.Ticks}";
            var payout = new PayoutRequest
            {
                WalletId = wallet.WalletId,
                Amount = amount,
                Status = "PENDING",
                BankCode = bankCode.Trim().ToUpperInvariant(),
                AccountNumber = accountNumber.Trim(),
                AccountName = normalizedAccountName,
                Description = string.IsNullOrWhiteSpace(description) ? $"Rút tiền về TK {accountNumber}" : description.Trim(),
                ReferenceId = refId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.PayoutRequests.AddAsync(payout);

            // 7. Write a pending wallet transaction to log
            var transaction = new WalletTransaction
            {
                WalletId = wallet.WalletId,
                TxType = "DEBIT_WITHDRAW",
                Amount = amount,
                BalanceAfter = wallet.Balance,
                Description = $"[Chờ duyệt] Rút tiền về TK ngân hàng. Số TK: {payout.AccountNumber} - Ngân hàng: {payout.BankCode} - Chủ TK: {payout.AccountName}",
                CreatedAt = DateTime.UtcNow
            };

            await _context.WalletTransactions.AddAsync(transaction);
            await _context.SaveChangesAsync();

            return payout;
        }

        public async Task<List<PayoutRequest>> GetPayoutRequestsAsync(string? status = null)
        {
            var query = _context.PayoutRequests
                .Include(p => p.Wallet)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(p => p.Status == status);
            }

            return await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        }

        public async Task<List<PayoutRequest>> GetMyPayoutRequestsAsync(long userId, string ownerType)
        {
            Wallet wallet;
            if (ownerType == "STUDIO")
            {
                var studio = await _context.Studios.FirstOrDefaultAsync(s => s.OwnerId == userId);
                if (studio == null) return new List<PayoutRequest>();
                wallet = await GetOrCreateStudioWalletAsync(studio.StudioId);
            }
            else
            {
                wallet = await GetOrCreateCustomerWalletAsync(userId);
            }

            return await _context.PayoutRequests
                .Where(p => p.WalletId == wallet.WalletId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<PayoutRequest> ApprovePayoutRequestAsync(long payoutId, long adminUserId)
        {
            var payout = await _context.PayoutRequests
                .Include(p => p.Wallet)
                .FirstOrDefaultAsync(p => p.PayoutId == payoutId);

            if (payout == null)
                throw new ArgumentException("Không tìm thấy yêu cầu rút tiền.");

            if (payout.Status != "PENDING")
                throw new InvalidOperationException("Yêu cầu này đã được xử lý từ trước.");

            // Trigger direct payout via PayOS service
            bool success = await _payOsService.ExecutePayoutAsync(
                payout.AccountNumber,
                payout.BankCode,
                payout.AccountName,
                (int)payout.Amount,
                payout.Description ?? $"Rut tien {payout.ReferenceId}"
            );

            if (success)
            {
                payout.Status = "APPROVED";
                payout.TransactionCode = $"PAYOS-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
                payout.UpdatedAt = DateTime.UtcNow;

                // Update original debit transaction description to represent success
                var walletTx = await _context.WalletTransactions
                    .Where(t => t.WalletId == payout.WalletId && t.TxType == "DEBIT_WITHDRAW" && t.Amount == payout.Amount)
                    .OrderByDescending(t => t.CreatedAt)
                    .FirstOrDefaultAsync();

                if (walletTx != null)
                {
                    walletTx.Description = $"[Thành công] Rút tiền về TK ngân hàng. Số TK: {payout.AccountNumber} - Ngân hàng: {payout.BankCode} - Chủ TK: {payout.AccountName}";
                }
            }
            else
            {
                payout.Status = "FAILED";
                payout.FailureReason = "Giao dịch bị từ chối bởi cổng chuyển tiền PayOS/NAPAS.";
                payout.UpdatedAt = DateTime.UtcNow;

                // Auto refund the locked balance back to user's wallet
                var wallet = payout.Wallet;
                wallet.Balance += payout.Amount;
                wallet.TotalOut -= payout.Amount;
                wallet.UpdatedAt = DateTime.UtcNow;

                // Update original transaction description
                var walletTx = await _context.WalletTransactions
                    .Where(t => t.WalletId == payout.WalletId && t.TxType == "DEBIT_WITHDRAW" && t.Amount == payout.Amount)
                    .OrderByDescending(t => t.CreatedAt)
                    .FirstOrDefaultAsync();

                if (walletTx != null)
                {
                    walletTx.Description = $"[Thất bại] Rút tiền về TK ngân hàng. Số TK: {payout.AccountNumber} - Ngân hàng: {payout.BankCode} - Chủ TK: {payout.AccountName}";
                }

                // Add a refund transaction
                var refundTx = new WalletTransaction
                {
                    WalletId = wallet.WalletId,
                    TxType = "CREDIT_REFUND",
                    Amount = payout.Amount,
                    BalanceAfter = wallet.Balance,
                    Description = $"[Hoàn tiền] Rút tiền về tài khoản thất bại (Lý do: Cổng PayOS từ chối)",
                    CreatedAt = DateTime.UtcNow
                };
                await _context.WalletTransactions.AddAsync(refundTx);
            }

            await _context.SaveChangesAsync();
            return payout;
        }

        public async Task<PayoutRequest> RejectPayoutRequestAsync(long payoutId, long adminUserId, string reason)
        {
            var payout = await _context.PayoutRequests
                .Include(p => p.Wallet)
                .FirstOrDefaultAsync(p => p.PayoutId == payoutId);

            if (payout == null)
                throw new ArgumentException("Không tìm thấy yêu cầu rút tiền.");

            if (payout.Status != "PENDING")
                throw new InvalidOperationException("Yêu cầu này đã được xử lý từ trước.");

            payout.Status = "REJECTED";
            payout.FailureReason = reason;
            payout.UpdatedAt = DateTime.UtcNow;

            // Refund the locked balance back to user's wallet
            var wallet = payout.Wallet;
            wallet.Balance += payout.Amount;
            wallet.TotalOut -= payout.Amount;
            wallet.UpdatedAt = DateTime.UtcNow;

            // Update original transaction description
            var walletTx = await _context.WalletTransactions
                .Where(t => t.WalletId == payout.WalletId && t.TxType == "DEBIT_WITHDRAW" && t.Amount == payout.Amount)
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            if (walletTx != null)
            {
                walletTx.Description = $"[Bị từ chối] Rút tiền về TK ngân hàng. Số TK: {payout.AccountNumber} - Ngân hàng: {payout.BankCode} - Chủ TK: {payout.AccountName}";
            }

            // Add a refund transaction
            var refundTx = new WalletTransaction
            {
                WalletId = wallet.WalletId,
                TxType = "CREDIT_REFUND",
                Amount = payout.Amount,
                BalanceAfter = wallet.Balance,
                Description = $"[Hoàn tiền] Yêu cầu rút tiền bị từ chối (Lý do: {reason})",
                CreatedAt = DateTime.UtcNow
            };
            await _context.WalletTransactions.AddAsync(refundTx);

            await _context.SaveChangesAsync();
            return payout;
        }

        // ================================================================
        // VIETNAMESE DIACRITIC REMOVAL HELPER
        // ================================================================
        private static string RemoveSign4VietnameseString(string str)
        {
            if (string.IsNullOrEmpty(str)) return string.Empty;

            // Normalize FormD splits accents into separate Unicode marks
            string formD = str.Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder();

            foreach (char ch in formD)
            {
                UnicodeCategory uc = CharUnicodeInfo.GetUnicodeCategory(ch);
                if (uc != UnicodeCategory.NonSpacingMark)
                {
                    sb.Append(ch);
                }
            }

            string result = sb.ToString().Normalize(NormalizationForm.FormC);

            // Handle special character 'Đ/đ' manually as they are not decomposed by FormD
            result = result.Replace("Đ", "D").Replace("đ", "d");

            // Strip any remaining special characters except letters and spaces, convert to uppercase
            result = Regex.Replace(result, @"[^a-zA-Z\s]", "");
            
            // Normalize double spaces to single spaces
            result = Regex.Replace(result, @"\s+", " ");

            return result.ToUpperInvariant().Trim();
        }
    }
}
