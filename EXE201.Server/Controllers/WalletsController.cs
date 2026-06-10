using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.Extensions.Caching.Memory;
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
        private readonly IMemoryCache _cache;
        private readonly IEmailService _emailService;

        public WalletsController(IWalletService walletService, PhotoStudioBookingContext context, IMemoryCache cache, IEmailService emailService)
        {
            _walletService = walletService;
            _context = context;
            _cache = cache;
            _emailService = emailService;
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

        [HttpPost("api/wallet/withdraw/request-otp")]
        [Authorize(Roles = "CUSTOMER,STUDIO_OWNER")]
        public async Task<IActionResult> RequestWithdrawalOtp()
        {
            try
            {
                var userId = GetCurrentUserId();
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return BadRequest("Không tìm thấy thông tin người dùng trên hệ thống.");

                if (string.IsNullOrWhiteSpace(user.Email))
                    return BadRequest("Tài khoản của bạn chưa cấu hình địa chỉ Email.");

                // Generate 6-digit random OTP
                var random = new System.Random();
                var otp = random.Next(100000, 999999).ToString();

                // Store in Cache with key "WithdrawOtp_{UserId}" for 5 minutes
                var cacheKey = $"WithdrawOtp_{userId}";
                _cache.Set(cacheKey, otp, System.TimeSpan.FromMinutes(5));

                // Send Email in background task to avoid blocking the HTTP thread
                _ = Task.Run(async () =>
                {
                    try
                    {
                        string emailBody = $@"
                            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background-color: #ffffff;'>
                                <div style='text-align: center; margin-bottom: 25px;'>
                                    <h1 style='color: #4f46e5; margin: 0; font-size: 28px; font-weight: 800;'>GO! Marketplace</h1>
                                    <p style='color: #64748b; font-size: 14px; margin: 5px 0 0 0;'>Mã Xác Thực Rút Tiền Bảo Mật 🔒</p>
                                </div>
                                <hr style='border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;' />
                                <p style='font-size: 16px; color: #1e293b;'>Xin chào <strong>{user.FullName}</strong>,</p>
                                <p style='font-size: 15px; color: #475569; line-height: 1.6;'>Bạn đã gửi yêu cầu rút tiền trên hệ thống GO! Marketplace. Vui lòng sử dụng mã OTP dưới đây để xác nhận giao dịch rút tiền của bạn:</p>
                                
                                <div style='text-align: center; margin: 30px 0;'>
                                    <div style='display: inline-block; background: #f8fafc; border: 2px dashed #6366f1; border-radius: 12px; padding: 15px 40px;'>
                                        <span style='font-size: 32px; font-weight: bold; color: #4f46e5; letter-spacing: 6px; font-family: monospace;'>{otp}</span>
                                    </div>
                                </div>
                                
                                <p style='font-size: 13px; color: #ef4444; font-weight: bold; text-align: center;'>⚠️ Lưu ý: Mã OTP này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai khác.</p>
                                <hr style='border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;' />
                                <p style='font-size: 11px; color: #cbd5e1; text-align: center; margin-top: 20px;'>Email này được gửi tự động từ hệ thống GO!. Vui lòng không phản hồi trực tiếp email này.</p>
                            </div>
                        ";

                        await _emailService.SendEmailAsync(user.Email, "Mã OTP xác nhận rút tiền GO! Marketplace 🔒", emailBody);
                    }
                    catch (System.Exception ex)
                    {
                        System.Console.WriteLine($"[WithdrawOtpEmail] Failed to send: {ex.Message}");
                    }
                });

                return Ok(new { message = "Mã OTP đã được gửi đến email đăng ký của bạn. Vui lòng kiểm tra hộp thư." });
            }
            catch (System.Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("api/wallet/withdraw")]
        [Authorize(Roles = "CUSTOMER,STUDIO_OWNER")]
        public async Task<IActionResult> CreateWithdrawal([FromBody] CreateWithdrawalRequestDto request)
        {
            if (request == null) return BadRequest("Dữ liệu yêu cầu không hợp lệ.");
            if (string.IsNullOrWhiteSpace(request.OtpCode)) return BadRequest("Vui lòng nhập mã OTP để xác thực giao dịch.");

            try
            {
                var userId = GetCurrentUserId();

                // OTP Verification
                var cacheKey = $"WithdrawOtp_{userId}";
                if (!_cache.TryGetValue(cacheKey, out string? cachedOtp) || string.IsNullOrWhiteSpace(cachedOtp))
                {
                    return BadRequest("Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng nhấn gửi lại mã mới.");
                }

                if (cachedOtp.Trim() != request.OtpCode.Trim())
                {
                    return BadRequest("Mã OTP không chính xác. Vui lòng kiểm tra lại.");
                }

                // Clear OTP after successful validation to prevent replay attacks
                _cache.Remove(cacheKey);

                var role = GetCurrentRole();
                var ownerType = role == "STUDIO_OWNER" ? "STUDIO" : "CUSTOMER";

                var payout = await _walletService.CreatePayoutRequestAsync(
                    userId, 
                    ownerType, 
                    request.Amount, 
                    request.BankCode, 
                    request.AccountNumber,
                    request.AccountName,
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

