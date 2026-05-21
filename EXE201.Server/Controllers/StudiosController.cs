using System.Security.Claims;
using EXE201.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/studios")]
    public class StudiosController : ControllerBase
    {
        private readonly ICatalogService _catalogService;

        public StudiosController(ICatalogService catalogService)
        {
            _catalogService = catalogService;
        }

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetStudio(long id)
        {
            var studio = await _catalogService.GetStudioAsync(id);
            return studio == null ? NotFound() : Ok(studio);
        }

        [HttpGet("me/dashboard")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> GetMyDashboard()
        {
            var dashboard = await _catalogService.GetStudioDashboardAsync(GetCurrentUserId());
            return dashboard == null ? NotFound() : Ok(dashboard);
        }

        [HttpGet("{studioId:long}/reviews")]
        public async Task<IActionResult> GetReviews(long studioId)
        {
            return Ok(await _catalogService.GetStudioReviewsAsync(studioId));
        }

        [HttpGet("{studioId:long}/rating-summary")]
        public async Task<IActionResult> GetRatingSummary(long studioId)
        {
            var summary = await _catalogService.GetStudioRatingSummaryAsync(studioId);
            return summary == null ? NotFound() : Ok(summary);
        }

        private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
