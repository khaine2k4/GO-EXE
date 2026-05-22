using System.Security.Claims;
using EXE201.Server.DTOs;
using EXE201.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/payments")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly IBookingWorkflowService _bookingService;

        public PaymentsController(IBookingWorkflowService bookingService)
        {
            _bookingService = bookingService;
        }

        [HttpGet]
        public async Task<IActionResult> GetPayments()
        {
            return Ok(await _bookingService.GetPaymentsForUserAsync(GetCurrentUserId(), GetCurrentRole()));
        }

        [HttpPost("pay")]
        [Authorize(Roles = "CUSTOMER")]
        public async Task<IActionResult> Pay([FromBody] PayBookingRequest request)
        {
            var payment = await _bookingService.PayBookingAsync(GetCurrentUserId(), request);
            return payment == null ? BadRequest("Payment cannot be completed.") : Ok(payment);
        }

        private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string GetCurrentRole() => User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
    }
}
