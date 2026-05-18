using Microsoft.AspNetCore.Mvc;
using EXE201.Server.Services;
using EXE201.Server.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest("Email và mật khẩu không được để trống.");
            }

            var response = await _authService.LoginAsync(request);

            if (response == null)
            {
                return Unauthorized("Email hoặc mật khẩu không đúng, hoặc tài khoản chưa kích hoạt.");
            }

            return Ok(response);
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMe()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized("Không tìm thấy thông tin người dùng trong token.");
            }

            var userId = long.Parse(userIdClaim.Value);
            var user = await _authService.GetMeAsync(userId);

            if (user == null)
            {
                return NotFound("Người dùng không tồn tại.");
            }

            return Ok(user);
        }
    }
}
