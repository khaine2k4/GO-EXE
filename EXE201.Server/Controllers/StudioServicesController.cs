using System.Security.Claims;
using EXE201.Server.DTOs;
using EXE201.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/studio/services")]
    [Authorize(Roles = "STUDIO_OWNER")]
    public class StudioServicesController : ControllerBase
    {
        private readonly ICatalogService _catalogService;

        public StudioServicesController(ICatalogService catalogService)
        {
            _catalogService = catalogService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMine() => Ok(await _catalogService.GetOwnerServicesAsync(GetCurrentUserId()));

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UpsertServiceRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ServiceName ?? request.Name)) return BadRequest("Service name is required.");
            try
            {
                return Ok(await _catalogService.CreateServiceAsync(GetCurrentUserId(), request));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id:long}")]
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

        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            var success = await _catalogService.HideServiceAsync(GetCurrentUserId(), id);
            return success ? Ok(new { message = "Service hidden." }) : NotFound();
        }

        [HttpPut("{id:long}/toggle")]
        public async Task<IActionResult> Toggle(long id, [FromBody] UpdateServiceStatusRequest request)
        {
            var success = await _catalogService.SetServiceStatusAsync(GetCurrentUserId(), id, request.IsActive);
            return success ? Ok(new { message = "Service status updated." }) : NotFound();
        }

        private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
