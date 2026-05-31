using EXE201.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/upload")]
    [Authorize]
    public class UploadController : ControllerBase
    {
        private readonly ICloudinaryService _cloudinaryService;

        public UploadController(ICloudinaryService cloudinaryService)
        {
            _cloudinaryService = cloudinaryService;
        }

        /// <summary>
        /// Generate a Cloudinary signature for signed upload from the client.
        /// </summary>
        [HttpGet("signature")]
        public IActionResult GetSignature([FromQuery] string? folder)
        {
            var result = _cloudinaryService.GenerateSignature(folder ?? "exe201");
            return Ok(result);
        }
    }
}
