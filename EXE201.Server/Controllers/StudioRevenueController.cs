using System.Security.Claims;
using EXE201.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/studio")]
    [Authorize(Roles = "STUDIO_OWNER")]
    public class StudioRevenueController : ControllerBase
    {
        private readonly IStudioRevenueService _studioRevenueService;

        public StudioRevenueController(IStudioRevenueService studioRevenueService)
        {
            _studioRevenueService = studioRevenueService;
        }

        [HttpGet("revenue")]
        public async Task<IActionResult> GetRevenue([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            var revenue = await _studioRevenueService.GetRevenueAsync(GetCurrentUserId(), from, to);
            return revenue == null ? NotFound("Khong tim thay studio cua tai khoan hien tai.") : Ok(revenue);
        }

        [HttpGet("commissions")]
        public async Task<IActionResult> GetCommissions([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] string? search, [FromQuery] string? sortBy)
        {
            var commissions = await _studioRevenueService.GetCommissionsAsync(GetCurrentUserId(), from, to, search, sortBy);
            return commissions == null ? NotFound("Khong tim thay studio cua tai khoan hien tai.") : Ok(commissions);
        }

        [HttpGet("bookings/statistics")]
        public async Task<IActionResult> GetBookingStatistics([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            var statistics = await _studioRevenueService.GetBookingStatisticsAsync(GetCurrentUserId(), from, to);
            return statistics == null ? NotFound("Khong tim thay studio cua tai khoan hien tai.") : Ok(statistics);
        }

        [HttpGet("commission-setting")]
        public async Task<IActionResult> GetCommissionSetting()
        {
            var setting = await _studioRevenueService.GetCommissionSettingAsync(GetCurrentUserId());
            return setting == null ? NotFound("Khong tim thay studio cua tai khoan hien tai.") : Ok(setting);
        }

        private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
