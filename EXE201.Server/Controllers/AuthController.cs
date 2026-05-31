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

            try
            {
                var response = await _authService.LoginAsync(request);

                if (response == null)
                {
                    return Unauthorized("Email hoặc mật khẩu không chính xác.");
                }

                return Ok(response);
            }
            catch (Exception ex) when (ex.Message == "UNVERIFIED")
            {
                return BadRequest("Tài khoản chưa được xác thực email. Vui lòng kiểm tra email của bạn để kích hoạt tài khoản.");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequestDto request)
        {
            if (request == null || string.IsNullOrEmpty(request.Credential))
            {
                return BadRequest("Google credential không được để trống.");
            }

            var response = await _authService.GoogleLoginAsync(request.Credential);

            if (response == null)
            {
                return Unauthorized("Google token không hợp lệ hoặc tài khoản bị khóa.");
            }

            return Ok(response);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
        {
            if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password) || string.IsNullOrEmpty(request.Name) || string.IsNullOrEmpty(request.Role))
            {
                return BadRequest("Họ tên, email, mật khẩu và vai trò không được để trống.");
            }

            try
            {
                var user = await _authService.RegisterAsync(request);
                if (user == null)
                {
                    return BadRequest("Đăng ký không thành công.");
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
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

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestDto request)
        {
            if (request == null || string.IsNullOrEmpty(request.Name))
            {
                return BadRequest("Họ tên không được để trống.");
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized("Không tìm thấy thông tin người dùng trong token.");
            }

            var userId = long.Parse(userIdClaim.Value);
            var updatedUser = await _authService.UpdateProfileAsync(userId, request);

            if (updatedUser == null)
            {
                return NotFound("Không tìm thấy thông tin người dùng.");
            }

            return Ok(updatedUser);
        }

        [HttpPut("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
        {
            if (request == null || string.IsNullOrEmpty(request.CurrentPassword) || string.IsNullOrEmpty(request.NewPassword))
            {
                return BadRequest("Mật khẩu cũ và mật khẩu mới không được để trống.");
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized("Không tìm thấy thông tin người dùng trong token.");
            }

            var userId = long.Parse(userIdClaim.Value);
            var success = await _authService.ChangePasswordAsync(userId, request);

            if (!success)
            {
                return BadRequest("Mật khẩu hiện tại không chính xác hoặc không thể cập nhật mật khẩu.");
            }

            return Ok(new { message = "Đổi mật khẩu thành công!" });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
        {
            if (request == null || string.IsNullOrEmpty(request.Email))
            {
                return BadRequest("Email không được để trống.");
            }

            var success = await _authService.ForgotPasswordAsync(request.Email);
            if (!success)
            {
                return BadRequest("Email không tồn tại trong hệ thống.");
            }

            return Ok(new { message = "Đường dẫn đặt lại mật khẩu đã được gửi đến email của bạn!" });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
        {
            if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Token) || string.IsNullOrEmpty(request.NewPassword))
            {
                return BadRequest("Thông tin yêu cầu đặt lại mật khẩu không đầy đủ.");
            }

            var success = await _authService.ResetPasswordAsync(request);
            if (!success)
            {
                return BadRequest("Liên kết khôi phục không hợp lệ, đã hết hạn hoặc tài khoản không tồn tại.");
            }

            return Ok(new { message = "Đặt lại mật khẩu thành công!" });
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequestDto request)
        {
            if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Token))
            {
                return BadRequest("Thông tin xác thực email không hợp lệ hoặc thiếu.");
            }

            var success = await _authService.VerifyEmailAsync(request);
            if (!success)
            {
                return BadRequest("Liên kết kích hoạt không hợp lệ, đã hết hạn hoặc tài khoản không tồn tại.");
            }

            return Ok(new { message = "Tài khoản của bạn đã được xác thực thành công!" });
        }
    }
}
