using System.Security.Claims;
using EXE201.Server.DTOs;
using EXE201.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/studio/packages")]
    [Authorize(Roles = "STUDIO_OWNER")]
    public class StudioPackagesController : ControllerBase
    {
        private readonly ICatalogService _catalogService;

        public StudioPackagesController(ICatalogService catalogService)
        {
            _catalogService = catalogService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMine() => Ok(await _catalogService.GetOwnerPackagesAsync(GetCurrentUserId()));

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UpsertPackageRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.PackageName ?? request.Name) || request.Price <= 0) return BadRequest("Package name and price are required.");
            var package = await _catalogService.CreatePackageAsync(GetCurrentUserId(), request);
            return package == null ? NotFound() : Ok(package);
        }

        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(long id, [FromBody] UpsertPackageRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.PackageName ?? request.Name) || request.Price <= 0) return BadRequest("Package name and price are required.");
            var package = await _catalogService.UpdatePackageAsync(GetCurrentUserId(), id, request);
            return package == null ? NotFound() : Ok(package);
        }

        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            var success = await _catalogService.DeletePackageAsync(GetCurrentUserId(), id);
            return success ? Ok(new { message = "Package deleted." }) : NotFound();
        }

        [HttpPut("{id:long}/price")]
        public async Task<IActionResult> UpdatePrice(long id, [FromBody] UpdatePackagePriceRequest request)
        {
            if (request.Price <= 0) return BadRequest("Price must be greater than 0.");
            var package = await _catalogService.UpdatePackagePriceAsync(GetCurrentUserId(), id, request.Price);
            return package == null ? NotFound() : Ok(package);
        }

        private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
