using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;
using EXE201.Server.Services;
using EXE201.Server.DTOs;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Authorize]
    public class WalletsController : ControllerBase
    {
        private readonly IWalletService _walletService;

        public WalletsController(IWalletService walletService)
        {
            _walletService = walletService;
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

        private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}

