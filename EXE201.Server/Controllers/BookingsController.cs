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
        private readonly IHttpClientFactory _httpClientFactory;

        public BookingsController(IBookingWorkflowService bookingService, IHttpClientFactory httpClientFactory)
        {
            _bookingService = bookingService;
            _httpClientFactory = httpClientFactory;
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

        [HttpGet("{id:long}/photo-preview/{type}/{index:int}")]
        [Authorize(Roles = "CUSTOMER")]
        public async Task<IActionResult> GetPhotoPreview(long id, string type, int index)
        {
            var previewUrl = await _bookingService.GetCustomerPhotoPreviewUrlAsync(GetCurrentUserId(), id, type, index);
            if (previewUrl == null) return NotFound();

            var client = _httpClientFactory.CreateClient();
            using var response = await client.GetAsync(previewUrl, HttpCompletionOption.ResponseHeadersRead);
            if (!response.IsSuccessStatusCode) return StatusCode((int)response.StatusCode);

            var contentType = response.Content.Headers.ContentType?.ToString() ?? "image/jpeg";
            var bytes = await response.Content.ReadAsByteArrayAsync();
            Response.Headers.CacheControl = "no-store, no-cache, max-age=0";
            Response.Headers.Pragma = "no-cache";
            Response.Headers["X-Content-Type-Options"] = "nosniff";
            return File(bytes, contentType);
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

        [HttpPut("{id:long}/demo-photos")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> UploadDemoPhotos(long id, [FromBody] PhotoDeliveryRequest request)
        {
            var booking = await _bookingService.UploadDemoPhotosAsync(GetCurrentUserId(), id, request);
            return booking == null ? BadRequest("Demo photos cannot be uploaded for this booking.") : Ok(booking);
        }

        [HttpPut("{id:long}/photo-feedback")]
        [Authorize(Roles = "CUSTOMER")]
        public async Task<IActionResult> SubmitPhotoFeedback(long id, [FromBody] CustomerPhotoFeedbackRequest request)
        {
            var booking = await _bookingService.SubmitPhotoFeedbackAsync(GetCurrentUserId(), id, request);
            return booking == null ? BadRequest("Photo feedback cannot be submitted for this booking.") : Ok(booking);
        }

        [HttpPut("{id:long}/final-photos")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> UploadFinalPhotos(long id, [FromBody] PhotoDeliveryRequest request)
        {
            var booking = await _bookingService.UploadFinalPhotosAsync(GetCurrentUserId(), id, request);
            return booking == null ? BadRequest("Final photos cannot be uploaded for this booking.") : Ok(booking);
        }

        [HttpPut("{id:long}/complete")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> Complete(long id)
        {
            var booking = await _bookingService.CompleteBookingAsync(GetCurrentUserId(), id);
            return booking == null ? BadRequest("Studio must upload final photos; customer completes the booking after receiving them.") : Ok(booking);
        }

        [HttpPut("{id:long}/confirm-completion")]
        [Authorize(Roles = "CUSTOMER")]
        public async Task<IActionResult> ConfirmCompletion(long id)
        {
            var booking = await _bookingService.ConfirmCompletionAsync(GetCurrentUserId(), id);
            return booking == null ? BadRequest("Booking completion cannot be confirmed.") : Ok(booking);
        }

        [HttpPost("{id:long}/review")]
        [Authorize(Roles = "CUSTOMER")]
        public async Task<IActionResult> CreateReview(long id, [FromBody] CreateBookingReviewRequest request)
        {
            var review = await _bookingService.CreateReviewAsync(GetCurrentUserId(), id, request);
            return review == null ? BadRequest("Review can only be created once for a completed booking.") : Ok(review);
        }

        [HttpPut("{id:long}/cancel")]
        public async Task<IActionResult> Cancel(long id, [FromBody] BookingActionRequest request)
        {
            var booking = await _bookingService.CancelBookingAsync(GetCurrentUserId(), GetCurrentRole(), id, request.Reason);
            return booking == null ? BadRequest("Booking cannot be cancelled.") : Ok(booking);
        }

        [HttpPut("{id:long}/dispute")]
        [Authorize(Roles = "CUSTOMER,STUDIO_OWNER")]
        public async Task<IActionResult> Dispute(long id, [FromBody] BookingActionRequest request)
        {
            var reason = request.Reason ?? request.Note;
            if (string.IsNullOrWhiteSpace(reason))
            {
                return BadRequest("Dispute reason is required.");
            }

            var booking = await _bookingService.DisputeBookingAsync(GetCurrentUserId(), GetCurrentRole(), id, reason);
            return booking == null ? BadRequest("Booking cannot be disputed.") : Ok(booking);
        }

        private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string GetCurrentRole() => User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
    }
}
