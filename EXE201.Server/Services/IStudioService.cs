using EXE201.Server.DTOs;

namespace EXE201.Server.Services
{
    public interface IStudioService
    {
        Task<HomeDataDto> GetHomeDataAsync();
    }
}
