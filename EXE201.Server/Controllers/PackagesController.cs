using System.Security.Claims;
using EXE201.Server.DTOs;
using EXE201.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/packages")]
    public class PackagesController : ControllerBase
    {
        private readonly ICatalogService _catalogService;

        public PackagesController(ICatalogService catalogService)
        {
            _catalogService = catalogService;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] long? serviceId)
        {
            return Ok(await _catalogService.GetPackagesAsync(serviceId));
        }

        [HttpPost]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> Create([FromBody] UpsertPackageRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name) || request.Price <= 0) return BadRequest("Package name and price are required.");
            var package = await _catalogService.CreatePackageAsync(GetCurrentUserId(), request);
            return package == null ? NotFound() : Ok(package);
        }

        [HttpPut("{id:long}")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> Update(long id, [FromBody] UpsertPackageRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name) || request.Price <= 0) return BadRequest("Package name and price are required.");
            var package = await _catalogService.UpdatePackageAsync(GetCurrentUserId(), id, request);
            return package == null ? NotFound() : Ok(package);
        }

        [HttpDelete("{id:long}")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> Delete(long id)
        {
            var success = await _catalogService.DeletePackageAsync(GetCurrentUserId(), id);
            return success ? Ok(new { message = "Package deleted." }) : NotFound();
        }

        private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
