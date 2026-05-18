using exe201.Server.Models;

namespace EXE201.Server.Repositories
{
    public interface IStudioRepository
    {
        Task<int> GetApprovedStudiosCountAsync();
        Task<double> GetAverageRatingAsync();
        Task<List<Studio>> GetFeaturedStudiosAsync(int count);
    }
}
