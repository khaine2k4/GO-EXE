using System.Security.Claims;
using EXE201.Server.DTOs;
using EXE201.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/admin/categories")]
    [Authorize(Roles = "ADMIN")]
    public class AdminCategoriesController : ControllerBase
    {
        private readonly ICatalogService _catalogService;

        public AdminCategoriesController(ICatalogService catalogService)
        {
            _catalogService = catalogService;
        }

        [HttpGet]
        public async Task<IActionResult> Get() => Ok(await _catalogService.GetCategoriesAsync(true));

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UpsertCategoryRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.CategoryName ?? request.Name)) return BadRequest("Category name is required.");
            return Ok(await _catalogService.CreateCategoryAsync(request, GetCurrentUserId()));
        }

        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(long id, [FromBody] UpsertCategoryRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.CategoryName ?? request.Name)) return BadRequest("Category name is required.");
            var category = await _catalogService.UpdateCategoryAsync(id, request, GetCurrentUserId());
            return category == null ? NotFound() : Ok(category);
        }

        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            var success = await _catalogService.DeleteCategoryAsync(id, GetCurrentUserId());
            return success ? Ok(new { message = "Category disabled." }) : NotFound();
        }

        private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
