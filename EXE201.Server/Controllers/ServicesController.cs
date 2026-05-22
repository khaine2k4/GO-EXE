using System.Security.Claims;
using EXE201.Server.DTOs;
using EXE201.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/services")]
    public class ServicesController : ControllerBase
    {
        private readonly ICatalogService _catalogService;

        public ServicesController(ICatalogService catalogService)
        {
            _catalogService = catalogService;
        }

        [HttpGet]
        public async Task<IActionResult> Search(
            [FromQuery] string? keyword,
            [FromQuery] string? search,
            [FromQuery] long? categoryId,
            [FromQuery] string? city,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] long? studioId,
            [FromQuery] bool includeInactive = false)
        {
            var canSeeInactive = includeInactive && User.IsInRole("ADMIN");
            var services = await _catalogService.SearchServicesAsync(keyword ?? search, categoryId, city, minPrice, maxPrice, studioId, canSeeInactive);
            return Ok(services);
        }

        [HttpGet("mine")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> GetMine()
        {
            return Ok(await _catalogService.GetOwnerServicesAsync(GetCurrentUserId()));
        }

        [HttpGet("{id:long}")]
        public async Task<IActionResult> Get(long id, [FromQuery] bool includeInactive = false)
        {
            var canSeeInactive = includeInactive && (User.IsInRole("ADMIN") || User.IsInRole("STUDIO_OWNER"));
            var service = await _catalogService.GetServiceAsync(id, canSeeInactive);
            return service == null ? NotFound() : Ok(service);
        }

        [HttpPost]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> Create([FromBody] UpsertServiceRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ServiceName ?? request.Name)) return BadRequest("Service name is required.");
            try
            {
                var service = await _catalogService.CreateServiceAsync(GetCurrentUserId(), request);
                return Ok(service);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id:long}")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> Update(long id, [FromBody] UpsertServiceRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ServiceName ?? request.Name)) return BadRequest("Service name is required.");
            try
            {
                var service = await _catalogService.UpdateServiceAsync(GetCurrentUserId(), id, request);
                return service == null ? NotFound() : Ok(service);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id:long}/status")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateServiceStatusRequest request)
        {
            var success = await _catalogService.SetServiceStatusAsync(GetCurrentUserId(), id, request.IsActive);
            return success ? Ok(new { message = "Service status updated." }) : NotFound();
        }

        [HttpDelete("{id:long}")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> Delete(long id)
        {
            var success = await _catalogService.HideServiceAsync(GetCurrentUserId(), id);
            return success ? Ok(new { message = "Service hidden." }) : NotFound();
        }

        [HttpPost("{id:long}/images")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> AddImage(long id, [FromBody] AddServiceImageRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ImageUrl)) return BadRequest("ImageUrl is required.");
            var image = await _catalogService.AddServiceImageAsync(GetCurrentUserId(), id, request);
            return image == null ? NotFound() : Ok(image);
        }

        [HttpDelete("images/{imageId:long}")]
        [Authorize(Roles = "STUDIO_OWNER")]
        public async Task<IActionResult> DeleteImage(long imageId)
        {
            var success = await _catalogService.DeleteServiceImageAsync(GetCurrentUserId(), imageId);
            return success ? Ok(new { message = "Image deleted." }) : NotFound();
        }

        private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
