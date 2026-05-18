using EXE201.Server.DTOs;

namespace EXE201.Server.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(LoginRequestDto request);
        Task<UserDto?> GetMeAsync(long userId);
    }
}
