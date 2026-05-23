using System.Security.Claims;
using EXE201.Server.DTOs;
using EXE201.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/schedules")]
    public class SchedulesController : ControllerBase
    {
        private readonly IBookingWorkflowService _bookingService;

        public SchedulesController(IBookingWorkflowService bookingService)
        {
            _bookingService = bookingService;
        }

        [HttpGet("mine")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> GetMine()
        {
            return Ok(await _bookingService.GetMySchedulesAsync(GetCurrentUserId()));
        }

        [HttpPut("mine")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> UpsertSchedule([FromBody] UpsertWorkingScheduleRequest request)
        {
            var schedule = await _bookingService.UpsertScheduleAsync(GetCurrentUserId(), request);
            return schedule == null ? BadRequest("Invalid schedule or studio not found.") : Ok(schedule);
        }

        [HttpPut("mine/slot-duration")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> UpdateSlotDuration([FromBody] UpdateSlotDurationRequest request)
        {
            var success = await _bookingService.UpdateSlotDurationAsync(GetCurrentUserId(), request.SlotDurationMinutes);
            return success ? Ok(new { message = "Slot duration updated." }) : BadRequest("Invalid slot duration or studio not found.");
        }

        [HttpGet("studios/{studioId:long}/days")]
        public async Task<IActionResult> GetStudioDays(long studioId, [FromQuery] string? from, [FromQuery] string? to, [FromQuery] bool includeClosed = false)
        {
            DateOnly? fromDate = DateOnly.TryParse(from, out var parsedFrom) ? parsedFrom : null;
            DateOnly? toDate = DateOnly.TryParse(to, out var parsedTo) ? parsedTo : null;
            return Ok(await _bookingService.GetStudioDaysAsync(studioId, fromDate, toDate, includeClosed));
        }

        [HttpGet("studios/{studioId:long}/slots")]
        public async Task<IActionResult> GetStudioSlots(long studioId, [FromQuery] string date)
        {
            if (!DateOnly.TryParse(date, out var parsedDate))
            {
                return BadRequest("Invalid date. Use YYYY-MM-DD.");
            }

            return Ok(await _bookingService.GetStudioSlotsByDateAsync(studioId, parsedDate));
        }

        [HttpPut("days")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> UpsertDay([FromBody] UpsertWorkingDayRequest request)
        {
            var day = await _bookingService.UpsertWorkingDayAsync(GetCurrentUserId(), request);
            return day == null ? BadRequest("Invalid working day or studio not found.") : Ok(day);
        }

        [HttpPost("slots")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> CreateSlot([FromBody] CreateTimeSlotRequest request)
        {
            var slot = await _bookingService.CreateSlotAsync(GetCurrentUserId(), request);
            return slot == null ? BadRequest("Invalid slot, duplicate slot, or studio not found.") : Ok(slot);
        }

        [HttpPut("slots/{slotId:long}/status")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> UpdateSlotStatus(long slotId, [FromBody] UpdateTimeSlotStatusRequest request)
        {
            var success = await _bookingService.UpdateSlotStatusAsync(GetCurrentUserId(), slotId, request.Status);
            return success ? Ok(new { message = "Slot status updated." }) : BadRequest("Invalid slot, status, or ownership.");
        }

        private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
