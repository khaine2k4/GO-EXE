using System.Security.Claims;
using EXE201.Server.DTOs;
using EXE201.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/categories")]
    public class CategoriesController : ControllerBase
    {
        private readonly ICatalogService _catalogService;

        public CategoriesController(ICatalogService catalogService)
        {
            _catalogService = catalogService;
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories([FromQuery] bool includeInactive = false)
        {
            return Ok(await _catalogService.GetCategoriesAsync(includeInactive && User.IsInRole("ADMIN")));
        }

        [HttpPost]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> CreateCategory([FromBody] UpsertCategoryRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest("Category name is required.");
            var category = await _catalogService.CreateCategoryAsync(request, GetCurrentUserId());
            return Ok(category);
        }

        [HttpPut("{id:long}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> UpdateCategory(long id, [FromBody] UpsertCategoryRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest("Category name is required.");
            var category = await _catalogService.UpdateCategoryAsync(id, request, GetCurrentUserId());
            return category == null ? NotFound() : Ok(category);
        }

        [HttpDelete("{id:long}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> DeleteCategory(long id)
        {
            var success = await _catalogService.DeleteCategoryAsync(id, GetCurrentUserId());
            return success ? Ok(new { message = "Category disabled." }) : NotFound();
        }

        private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
