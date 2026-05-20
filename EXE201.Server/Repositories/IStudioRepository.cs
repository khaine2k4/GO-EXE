using exe201.Server.Models;

namespace EXE201.Server.Repositories
{
    public interface IStudioRepository
    {
        Task<int> GetApprovedStudiosCountAsync();
        Task<double> GetAverageRatingAsync();
        Task<List<Studio>> GetFeaturedStudiosAsync(int count);
        Task<Studio?> GetStudioByOwnerIdAsync(long ownerId);
        Task<Studio> CreateStudioAsync(Studio studio);
        Task<Studio> UpdateStudioAsync(Studio studio);
        Task<List<Studio>> GetAllStudiosAsync();
        Task<Studio?> GetStudioByIdAsync(long studioId);
    }
}
