using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EXE201.Server.Services;
using EXE201.Server.Repositories;
using EXE201.Server.DTOs;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/analytics")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _analyticsService;
        private readonly IStudioRevenueRepository _studioRevenueRepository;

        public AnalyticsController(IAnalyticsService analyticsService, IStudioRevenueRepository studioRevenueRepository)
        {
            _analyticsService = analyticsService;
            _studioRevenueRepository = studioRevenueRepository;
        }

        // ================================================================
        // POST EVENT (PUBLIC / ANONYMOUS SESSIONS SUPPORTED)
        // ================================================================
        [HttpPost("event")]
        public async Task<IActionResult> LogEvent([FromBody] CreateAnalyticsEventRequest request)
        {
            if (request == null)
                return BadRequest("Dữ liệu sự kiện không hợp lệ.");

            long? userId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (long.TryParse(userIdClaim, out long parsedId))
                {
                    userId = parsedId;
                }
            }

            try
            {
                await _analyticsService.LogEventAsync(request, userId);
                return Ok(new { message = "Sự kiện được ghi nhận thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi hệ thống: {ex.Message}");
            }
        }

        // ================================================================
        // PHOTOGRAPHER / STUDIO STATISTICS
        // ================================================================
        [HttpGet("studio-stats")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> GetStudioStats([FromQuery] int days = 7)
        {
            if (days <= 0 || days > 90)
                days = 7;

            var ownerId = GetCurrentUserId();
            var studio = await _studioRevenueRepository.GetOwnedStudioAsync(ownerId);
            if (studio == null)
                return NotFound("Không tìm thấy studio liên kết với tài khoản hiện tại.");

            try
            {
                var stats = await _analyticsService.GetStudioAnalyticsAsync(studio.StudioId, days);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi tính toán thống kê: {ex.Message}");
            }
        }

        // ================================================================
        // ADMIN STATISTICS
        // ================================================================
        [HttpGet("admin-stats")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> GetAdminStats([FromQuery] int days = 7)
        {
            if (days <= 0 || days > 90)
                days = 7;

            try
            {
                var stats = await _analyticsService.GetAdminAnalyticsAsync(days);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi tính toán thống kê admin: {ex.Message}");
            }
        }

        private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
