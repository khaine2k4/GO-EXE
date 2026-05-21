using System.Security.Claims;
using EXE201.Server.DTOs;
using EXE201.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/bookings")]
    [Authorize]
    public class BookingsController : ControllerBase
    {
        private readonly IBookingWorkflowService _bookingService;

        public BookingsController(IBookingWorkflowService bookingService)
        {
            _bookingService = bookingService;
        }

        [HttpGet]
        public async Task<IActionResult> GetBookings([FromQuery] string? status)
        {
            return Ok(await _bookingService.GetBookingsForUserAsync(GetCurrentUserId(), GetCurrentRole(), status));
        }

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetBooking(long id)
        {
            var booking = await _bookingService.GetBookingForUserAsync(GetCurrentUserId(), GetCurrentRole(), id);
            return booking == null ? NotFound() : Ok(booking);
        }

        [HttpPost]
        [Authorize(Roles = "CUSTOMER")]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
        {
            var booking = await _bookingService.CreateBookingAsync(GetCurrentUserId(), request);
            return booking == null ? BadRequest("Invalid package, slot, or slot is not available.") : Ok(booking);
        }

        [HttpPut("{id:long}/confirm")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> Confirm(long id)
        {
            var booking = await _bookingService.ConfirmBookingAsync(GetCurrentUserId(), id);
            return booking == null ? BadRequest("Booking cannot be confirmed.") : Ok(booking);
        }

        [HttpPut("{id:long}/reject")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> Reject(long id, [FromBody] BookingActionRequest request)
        {
            var booking = await _bookingService.RejectBookingAsync(GetCurrentUserId(), id, request.Reason);
            return booking == null ? BadRequest("Booking cannot be rejected.") : Ok(booking);
        }

        [HttpPut("{id:long}/in-progress")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> MarkInProgress(long id)
        {
            var booking = await _bookingService.MarkInProgressAsync(GetCurrentUserId(), id);
            return booking == null ? BadRequest("Booking cannot move to in-progress.") : Ok(booking);
        }

        [HttpPut("{id:long}/complete")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> Complete(long id)
        {
            var booking = await _bookingService.CompleteBookingAsync(GetCurrentUserId(), id);
            return booking == null ? BadRequest("Booking cannot be completed.") : Ok(booking);
        }

        [HttpPut("{id:long}/cancel")]
        public async Task<IActionResult> Cancel(long id, [FromBody] BookingActionRequest request)
        {
            var booking = await _bookingService.CancelBookingAsync(GetCurrentUserId(), GetCurrentRole(), id, request.Reason);
            return booking == null ? BadRequest("Booking cannot be cancelled.") : Ok(booking);
        }

        private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string GetCurrentRole() => User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
    }
}
