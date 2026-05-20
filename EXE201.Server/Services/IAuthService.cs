using EXE201.Server.DTOs;

namespace EXE201.Server.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(LoginRequestDto request);
        Task<UserDto?> GetMeAsync(long userId);
        Task<UserDto?> RegisterAsync(RegisterRequestDto request);
        Task<UserDto?> UpdateProfileAsync(long userId, UpdateProfileRequestDto request);
        Task<bool> ChangePasswordAsync(long userId, ChangePasswordRequestDto request);
    }
}
