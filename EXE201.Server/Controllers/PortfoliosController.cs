using System.Security.Claims;
using EXE201.Server.DTOs;
using EXE201.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/portfolios")]
    public class PortfoliosController : ControllerBase
    {
        private readonly ICatalogService _catalogService;

        public PortfoliosController(ICatalogService catalogService)
        {
            _catalogService = catalogService;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] long? studioId, [FromQuery] long? serviceId)
        {
            return Ok(await _catalogService.GetPortfolioAsync(studioId, serviceId));
        }

        [HttpPost]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> Create([FromBody] AddPortfolioRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ImageUrl)) return BadRequest("ImageUrl is required.");
            var item = await _catalogService.AddPortfolioAsync(GetCurrentUserId(), request);
            return item == null ? NotFound() : Ok(item);
        }

        [HttpDelete("{id:long}")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> Delete(long id)
        {
            var success = await _catalogService.DeletePortfolioAsync(GetCurrentUserId(), id);
            return success ? Ok(new { message = "Portfolio image deleted." }) : NotFound();
        }

        private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
