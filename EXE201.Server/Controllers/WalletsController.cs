using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;
using EXE201.Server.Services;
using EXE201.Server.DTOs;
using exe201.Server.Models;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Authorize]
    public class WalletsController : ControllerBase
    {
        private readonly IWalletService _walletService;
        private readonly PhotoStudioBookingContext _context;

        public WalletsController(IWalletService walletService, PhotoStudioBookingContext context)
        {
            _walletService = walletService;
            _context = context;
        }

        // ================================================================
        // STUDIO OWNER WALLET API
        // ================================================================
        [HttpGet("api/wallet/mine")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> GetStudioWallet()
        {
            try
            {
                var wallet = await _walletService.GetOrCreateStudioWalletByOwnerIdAsync(GetCurrentUserId());
                var transactions = await _walletService.GetWalletTransactionsAsync(wallet.WalletId);

                var walletDto = new WalletDto
                {
                    WalletId = wallet.WalletId,
                    OwnerType = wallet.OwnerType,
                    OwnerId = wallet.OwnerId,
                    Balance = wallet.Balance,
                    TotalIn = wallet.TotalIn,
                    TotalOut = wallet.TotalOut,
                    CreatedAt = wallet.CreatedAt,
                    UpdatedAt = wallet.UpdatedAt,
                    Transactions = transactions.Select(t => new WalletTransactionDto
                    {
                        TxId = t.TxId,
                        WalletId = t.WalletId,
                        TxType = t.TxType,
                        Amount = t.Amount,
                        BalanceAfter = t.BalanceAfter,
                        BookingId = t.BookingId,
                        PaymentId = t.PaymentId,
                        Description = t.Description,
                        CreatedAt = t.CreatedAt
                    }).ToList()
                };

                return Ok(walletDto);
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ================================================================
        // CUSTOMER WALLET API
        // ================================================================
        [HttpGet("api/customer/wallet")]
        [Authorize(Roles = "CUSTOMER")]
        public async Task<IActionResult> GetCustomerWallet()
        {
            var wallet = await _walletService.GetOrCreateCustomerWalletAsync(GetCurrentUserId());
            var transactions = await _walletService.GetWalletTransactionsAsync(wallet.WalletId);

            var walletDto = new WalletDto
            {
                WalletId = wallet.WalletId,
                OwnerType = wallet.OwnerType,
                OwnerId = wallet.OwnerId,
                Balance = wallet.Balance,
                TotalIn = wallet.TotalIn,
                TotalOut = wallet.TotalOut,
                CreatedAt = wallet.CreatedAt,
                UpdatedAt = wallet.UpdatedAt,
                Transactions = transactions.Select(t => new WalletTransactionDto
                {
                    TxId = t.TxId,
                    WalletId = t.WalletId,
                    TxType = t.TxType,
                    Amount = t.Amount,
                    BalanceAfter = t.BalanceAfter,
                    BookingId = t.BookingId,
                    PaymentId = t.PaymentId,
                    Description = t.Description,
                    CreatedAt = t.CreatedAt
                }).ToList()
            };

            return Ok(walletDto);
        }

        // ================================================================
        // ADMIN WALLET API
        // ================================================================
        [HttpGet("api/admin/wallets")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> GetAllWallets()
        {
            var wallets = await _walletService.GetAllWalletsAsync();
            var walletDtos = wallets.Select(wallet => new WalletDto
            {
                WalletId = wallet.WalletId,
                OwnerType = wallet.OwnerType,
                OwnerId = wallet.OwnerId,
                Balance = wallet.Balance,
                TotalIn = wallet.TotalIn,
                TotalOut = wallet.TotalOut,
                CreatedAt = wallet.CreatedAt,
                UpdatedAt = wallet.UpdatedAt
            }).ToList();

            return Ok(walletDtos);
        }

        [HttpPost("api/wallet/withdraw")]
        [Authorize(Roles = "CUSTOMER,STUDIO_OWNER")]
        public async Task<IActionResult> CreateWithdrawal([FromBody] CreateWithdrawalRequestDto request)
        {
            if (request == null) return BadRequest("Dữ liệu yêu cầu không hợp lệ.");

            try
            {
                var userId = GetCurrentUserId();
                var role = GetCurrentRole();
                var ownerType = role == "STUDIO_OWNER" ? "STUDIO" : "CUSTOMER";

                var payout = await _walletService.CreatePayoutRequestAsync(
                    userId, 
                    ownerType, 
                    request.Amount, 
                    request.BankCode, 
                    request.AccountNumber, 
                    request.Description ?? ""
                );

                return Ok(new {
                    message = "Tạo yêu cầu rút tiền thành công. Số dư của bạn đã được khóa để chờ Admin xét duyệt.",
                    payoutId = payout.PayoutId,
                    amount = payout.Amount,
                    status = payout.Status,
                    referenceId = payout.ReferenceId
                });
            }
            catch (System.Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("api/wallet/withdrawals")]
        [Authorize(Roles = "CUSTOMER,STUDIO_OWNER")]
        public async Task<IActionResult> GetMyWithdrawals()
        {
            var userId = GetCurrentUserId();
            var role = GetCurrentRole();
            var ownerType = role == "STUDIO_OWNER" ? "STUDIO" : "CUSTOMER";

            var payouts = await _walletService.GetMyPayoutRequestsAsync(userId, ownerType);

            // Fetch owner name
            string ownerName = "N/A";
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                ownerName = user.FullName;
            }

            var payoutDtos = payouts.Select(p => new PayoutRequestDto
            {
                PayoutId = p.PayoutId,
                WalletId = p.WalletId,
                OwnerName = ownerName,
                OwnerType = p.Wallet.OwnerType,
                Amount = p.Amount,
                Status = p.Status,
                BankCode = p.BankCode,
                AccountNumber = p.AccountNumber,
                AccountName = p.AccountName,
                Description = p.Description,
                ReferenceId = p.ReferenceId,
                TransactionCode = p.TransactionCode,
                FailureReason = p.FailureReason,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            }).ToList();

            return Ok(payoutDtos);
        }

        private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string GetCurrentRole() => User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
    }
}

