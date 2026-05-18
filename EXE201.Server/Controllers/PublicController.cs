using Microsoft.AspNetCore.Mvc;
using EXE201.Server.Services;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PublicController : ControllerBase
    {
        private readonly IStudioService _studioService;

        public PublicController(IStudioService studioService)
        {
            _studioService = studioService;
        }

        [HttpGet("home-data")]
        public async Task<IActionResult> GetHomeData()
        {
            var data = await _studioService.GetHomeDataAsync();
            return Ok(data);
        }
    }
}
