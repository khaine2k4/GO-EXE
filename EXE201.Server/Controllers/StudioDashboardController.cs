using System.Security.Claims;
using EXE201.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/studio/dashboard")]
    [Authorize(Roles = "STUDIO_OWNER")]
    public class StudioDashboardController : ControllerBase
    {
        private readonly ICatalogService _catalogService;

        public StudioDashboardController(ICatalogService catalogService)
        {
            _catalogService = catalogService;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var dashboard = await _catalogService.GetStudioDashboardAsync(GetCurrentUserId());
            return dashboard == null ? NotFound() : Ok(dashboard);
        }

        private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
