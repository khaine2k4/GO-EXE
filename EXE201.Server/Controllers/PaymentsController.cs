using System.Security.Claims;
using EXE201.Server.DTOs;
using EXE201.Server.Services;
using EXE201.Server.Repositories;
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
        private readonly IBookingWorkflowRepository _repo;

        public PaymentsController(IBookingWorkflowService bookingService, IBookingWorkflowRepository repo)
        {
            _bookingService = bookingService;
            _repo = repo;
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

        [HttpPost("vnpay-create")]
        [Authorize(Roles = "CUSTOMER")]
        public async Task<IActionResult> CreateVnPayPayment([FromBody] VnPayCreatePaymentRequestDto request)
        {
            if (request == null || request.BookingId <= 0)
            {
                return BadRequest("Invalid booking ID.");
            }

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            // Clean IPv6 loopback
            if (ipAddress == "::1") ipAddress = "127.0.0.1";

            string? paymentUrl;
            try
            {
                paymentUrl = await _bookingService.CreateVnPayPaymentUrlAsync(GetCurrentUserId(), request.BookingId, ipAddress);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }

            if (string.IsNullOrEmpty(paymentUrl))
            {
                return BadRequest("Could not create VNPay payment URL for this booking. Please verify the booking state and hold expiry.");
            }

            return Ok(new { paymentUrl });
        }

        [HttpGet("vnpay-return")]
        [AllowAnonymous]
        public async Task<IActionResult> VnPayReturn()
        {
            var vnpayParams = Request.Query.ToDictionary(x => x.Key, x => x.Value.ToString());
            vnpayParams.TryGetValue("vnp_TxnRef", out var paymentCode);
            
            long bookingId = 0;
            if (!string.IsNullOrEmpty(paymentCode))
            {
                var booking = await _repo.GetBookingByPaymentCodeAsync(paymentCode);
                if (booking != null)
                {
                    bookingId = booking.BookingId;
                }
            }

            var success = await _bookingService.ProcessVnPayReturnAsync(vnpayParams);
            var status = success ? "success" : "fail";

            // Dùng relative path để tự động chạy đúng cả ở localhost và domain thật gophotostudio.uk
            return Redirect($"/customer/bookings/{bookingId}?paymentStatus={status}");
        }

        [HttpGet("vnpay-ipn")]
        [AllowAnonymous]
        public async Task<IActionResult> VnPayIpn()
        {
            var vnpayParams = Request.Query.ToDictionary(x => x.Key, x => x.Value.ToString());
            var success = await _bookingService.ProcessVnPayReturnAsync(vnpayParams);
            if (success)
            {
                return Ok(new { RspCode = "00", Message = "Confirm success" });
            }

            vnpayParams.TryGetValue("vnp_ResponseCode", out var responseCode);
            if (responseCode != "00")
            {
                // Payment was processed as failed/cancelled
                return Ok(new { RspCode = "00", Message = "Confirm success" });
            }

            return Ok(new { RspCode = "97", Message = "Invalid signature or order not found" });
        }

        [HttpPost("payos-create")]
        [Authorize(Roles = "CUSTOMER")]
        public async Task<IActionResult> CreatePayOsPayment([FromBody] PayOsCreatePaymentRequestDto request)
        {
            if (request == null || request.BookingId <= 0)
            {
                return BadRequest("Invalid booking ID.");
            }

            var paymentUrl = await _bookingService.CreatePayOsPaymentUrlAsync(GetCurrentUserId(), request.BookingId);
            if (string.IsNullOrEmpty(paymentUrl))
            {
                // Clean IPv6 loopback
                return BadRequest("Could not create payOS payment URL.");
            }

            return Ok(new { paymentUrl });
        }

        [HttpGet("payos-return")]
        [AllowAnonymous]
        public async Task<IActionResult> PayOsReturn([FromQuery] long orderCode, [FromQuery] string status)
        {
            // Resolve the real bookingId from ProviderRef (orderCode = PaymentId in new flow)
            // Fallback to orderCode itself for old bookings created before this change
            var bookingByRef = await _repo.GetBookingByProviderRefAsync(orderCode.ToString());
            var bookingId = bookingByRef?.BookingId ?? orderCode;

            var success = await _bookingService.ProcessPayOsReturnAsync(orderCode, status);
            var paymentStatus = success ? "success" : "fail";

            return Redirect($"/customer/bookings/{bookingId}?paymentStatus={paymentStatus}");
        }


        [HttpPost("payos-webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> PayOsWebhook()
        {
            using var reader = new System.IO.StreamReader(Request.Body);
            var body = await reader.ReadToEndAsync();

            // PayOS gửi request ping/test chứa "ma giao dich thu nghiem" để xác thực Webhook URL khi cấu hình.
            // Cần bypass kiểm tra chữ ký ở bước này để tránh lỗi 400 Bad Request.
            if (body.Contains("ma giao dich thu nghiem") || body.Contains("Ma giao dich thu nghiem"))
            {
                return Ok(new { code = "00", desc = "success" });
            }

            var success = await _bookingService.ProcessPayOsWebhookAsync(body);
            if (success)
            {
                return Ok(new { code = "00", desc = "success" });
            }

            return BadRequest("Signature verification failed or booking not found.");
        }

        private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string GetCurrentRole() => User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
    }

    public class VnPayCreatePaymentRequestDto
    {
        public long BookingId { get; set; }
    }

    public class PayOsCreatePaymentRequestDto
    {
        public long BookingId { get; set; }
    }
}
