using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using EXE201.Server.Services;
using EXE201.Server.DTOs;
using exe201.Server.Models;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/admin/payouts")]
    [Authorize(Roles = "ADMIN")]
    public class AdminPayoutsController : ControllerBase
    {
        private readonly IWalletService _walletService;
        private readonly PhotoStudioBookingContext _context;

        public AdminPayoutsController(IWalletService walletService, PhotoStudioBookingContext context)
        {
            _walletService = walletService;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetPayoutRequests([FromQuery] string? status)
        {
            var payouts = await _walletService.GetPayoutRequestsAsync(status);

            var payoutDtos = new System.Collections.Generic.List<PayoutRequestDto>();
            foreach (var p in payouts)
            {
                // Fetch owner details
                string ownerName = "N/A";
                if (p.Wallet.OwnerType == "STUDIO")
                {
                    var studio = await _context.Studios
                        .Include(s => s.Owner)
                        .FirstOrDefaultAsync(s => s.StudioId == p.Wallet.OwnerId);
                    ownerName = studio?.StudioName ?? studio?.Owner?.FullName ?? "Studio";
                }
                else
                {
                    var user = await _context.Users.FindAsync(p.Wallet.OwnerId);
                    ownerName = user?.FullName ?? "Khách hàng";
                }

                payoutDtos.Add(new PayoutRequestDto
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
                });
            }

            return Ok(payoutDtos);
        }

        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApprovePayout(long id)
        {
            try
            {
                var adminUserId = GetCurrentUserId();
                var result = await _walletService.ApprovePayoutRequestAsync(id, adminUserId);
                
                if (result.Status == "APPROVED")
                {
                    return Ok(new { message = "Phê duyệt và chuyển tiền qua PayOS thành công.", transactionCode = result.TransactionCode });
                }
                else
                {
                    return BadRequest(new { message = "Chuyển khoản qua PayOS thất bại. Tiền đã được tự động hoàn trả về ví người dùng.", failureReason = result.FailureReason });
                }
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectPayout(long id, [FromBody] RejectPayoutRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Reason))
            {
                return BadRequest(new { message = "Lý do từ chối không được để trống." });
            }

            try
            {
                var adminUserId = GetCurrentUserId();
                var result = await _walletService.RejectPayoutRequestAsync(id, adminUserId, request.Reason);
                return Ok(new { message = "Từ chối yêu cầu rút tiền thành công. Tiền đã được hoàn trả về ví người dùng." });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
