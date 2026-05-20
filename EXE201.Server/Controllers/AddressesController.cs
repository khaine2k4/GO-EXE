using Microsoft.AspNetCore.Mvc;
using EXE201.Server.Services;
using EXE201.Server.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AddressesController : ControllerBase
    {
        private readonly IAddressService _addressService;

        public AddressesController(IAddressService addressService)
        {
            _addressService = addressService;
        }

        private long GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                throw new UnauthorizedAccessException("Không tìm thấy thông tin người dùng trong token.");
            }
            return long.Parse(userIdClaim.Value);
        }

        [HttpGet]
        public async Task<IActionResult> GetAddresses()
        {
            try
            {
                var userId = GetCurrentUserId();
                var addresses = await _addressService.GetUserAddressesAsync(userId);
                return Ok(addresses);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAddress(long id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var address = await _addressService.GetAddressByIdAsync(userId, id);
                if (address == null) return NotFound("Không tìm thấy địa chỉ.");
                return Ok(address);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateAddress([FromBody] CreateAddressRequestDto request)
        {
            if (request == null) return BadRequest("Dữ liệu địa chỉ không hợp lệ.");

            try
            {
                var userId = GetCurrentUserId();
                var created = await _addressService.CreateAddressAsync(userId, request);
                return Ok(created);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAddress(long id, [FromBody] UpdateAddressRequestDto request)
        {
            if (request == null) return BadRequest("Dữ liệu địa chỉ không hợp lệ.");

            try
            {
                var userId = GetCurrentUserId();
                var updated = await _addressService.UpdateAddressAsync(userId, id, request);
                if (updated == null) return NotFound("Không tìm thấy địa chỉ để cập nhật.");
                return Ok(updated);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAddress(long id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var success = await _addressService.DeleteAddressAsync(userId, id);
                if (!success) return NotFound("Không tìm thấy địa chỉ để xóa.");
                return Ok(new { message = "Xóa địa chỉ thành công!" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
        }
    }
}
