using Microsoft.AspNetCore.Mvc;
using EXE201.Server.Services;
using EXE201.Server.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "ADMIN")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        private long GetAdminId()
        {
            var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (adminIdClaim == null)
            {
                throw new UnauthorizedAccessException("Không tìm thấy thông tin quản trị viên trong token.");
            }
            return long.Parse(adminIdClaim.Value);
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? search, [FromQuery] string? status, [FromQuery] string? sortBy, [FromQuery] string? role)
        {
            try
            {
                var users = await _adminService.GetUsersAsync(search, status, sortBy, role);
                return Ok(users);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("users/{id}/status")]
        public async Task<IActionResult> UpdateUserStatus(long id, [FromBody] UpdateUserStatusDto dto)
        {
            if (dto == null || string.IsNullOrEmpty(dto.Status))
            {
                return BadRequest("Trạng thái không được để trống.");
            }

            if (dto.Status != "ACTIVE" && dto.Status != "LOCKED")
            {
                return BadRequest("Trạng thái chỉ có thể là ACTIVE hoặc LOCKED.");
            }

            try
            {
                var adminId = GetAdminId();
                var success = await _adminService.UpdateUserStatusAsync(id, dto.Status, adminId);
                if (!success)
                {
                    return NotFound("Không tìm thấy người dùng.");
                }
                return Ok(new { message = $"Đã cập nhật trạng thái người dùng thành {dto.Status}." });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("users/{id}/role")]
        public async Task<IActionResult> UpdateUserRole(long id, [FromBody] UpdateUserRoleDto dto)
        {
            if (dto == null || string.IsNullOrEmpty(dto.RoleName))
            {
                return BadRequest("Tên vai trò không được để trống.");
            }

            try
            {
                var adminId = GetAdminId();
                var success = await _adminService.UpdateUserRoleAsync(id, dto.RoleName, adminId);
                if (!success)
                {
                    return NotFound("Không tìm thấy người dùng hoặc vai trò không hợp lệ.");
                }
                return Ok(new { message = $"Đã cập nhật vai trò người dùng thành {dto.RoleName}." });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("studios")]
        public async Task<IActionResult> GetStudios([FromQuery] string? search, [FromQuery] string? status, [FromQuery] string? sortBy)
        {
            try
            {
                var studios = await _adminService.GetStudiosAsync(search, status, sortBy);
                return Ok(studios);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("studios/{id}/approve")]
        public async Task<IActionResult> ApproveStudio(long id)
        {
            try
            {
                var adminId = GetAdminId();
                var success = await _adminService.ApproveStudioAsync(id, adminId);
                if (!success)
                {
                    return NotFound("Không tìm thấy Studio.");
                }
                return Ok(new { message = "Đã phê duyệt Studio thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("studios/{id}/reject")]
        public async Task<IActionResult> RejectStudio(long id, [FromBody] RejectStudioDto dto)
        {
            if (dto == null || string.IsNullOrEmpty(dto.RejectionReason))
            {
                return BadRequest("Lý do từ chối không được để trống.");
            }

            try
            {
                var adminId = GetAdminId();
                var success = await _adminService.RejectStudioAsync(id, dto.RejectionReason, adminId);
                if (!success)
                {
                    return NotFound("Không tìm thấy Studio.");
                }
                return Ok(new { message = "Đã từ chối đăng ký Studio." });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("bookings")]
        public async Task<IActionResult> GetBookings([FromQuery] string? search, [FromQuery] string? status, [FromQuery] string? paymentStatus, [FromQuery] string? sortBy)
        {
            try
            {
                var bookings = await _adminService.GetBookingsAsync(search, status, paymentStatus, sortBy);
                return Ok(bookings);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("reports")]
        public async Task<IActionResult> GetReports([FromQuery] string? search, [FromQuery] string? status, [FromQuery] string? targetType, [FromQuery] string? sortBy)
        {
            try
            {
                var reports = await _adminService.GetReportsAsync(search, status, targetType, sortBy);
                return Ok(reports);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("reports/{id}/resolve")]
        public async Task<IActionResult> ResolveReport(long id, [FromBody] ResolveReportDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Status))
            {
                return BadRequest("Trạng thái xử lý không được để trống.");
            }

            try
            {
                var adminId = GetAdminId();
                var success = await _adminService.ResolveReportAsync(id, dto.Status, dto.HandlerNote, adminId);
                if (!success)
                {
                    return NotFound("Không tìm thấy report.");
                }
                return Ok(new { message = "Đã cập nhật report." });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("studios/{id}/ban")]
        public async Task<IActionResult> BanStudio(long id, [FromBody] BanStudioRequestDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.BanReason))
            {
                return BadRequest("Lý do ban không được để trống.");
            }

            try
            {
                var adminId = GetAdminId();
                var success = await _adminService.BanStudioAsync(id, dto.BanReason, adminId);
                if (!success)
                {
                    return NotFound("Không tìm thấy Studio.");
                }
                return Ok(new { message = "Đã ban Studio thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("studios/{id}/unban")]
        public async Task<IActionResult> UnbanStudio(long id)
        {
            try
            {
                var adminId = GetAdminId();
                var success = await _adminService.UnbanStudioAsync(id, adminId);
                if (!success)
                {
                    return NotFound("Không tìm thấy Studio.");
                }
                return Ok(new { message = "Đã gỡ ban Studio thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("reviews")]
        public async Task<IActionResult> GetReviews([FromQuery] string? search, [FromQuery] bool? isHidden)
        {
            try
            {
                var reviews = await _adminService.GetReviewsAsync(search, isHidden);
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("reviews/{id}/hide")]
        public async Task<IActionResult> ToggleHideReview(long id, [FromBody] HideReviewRequestDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Dữ liệu yêu cầu không hợp lệ.");
            }

            try
            {
                var adminId = GetAdminId();
                var success = await _adminService.ToggleHideReviewAsync(id, dto.IsHidden, dto.HiddenNote, adminId);
                if (!success)
                {
                    return NotFound("Không tìm thấy review.");
                }
                var state = dto.IsHidden ? "ẩn" : "hiển thị";
                return Ok(new { message = $"Đã {state} review thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
