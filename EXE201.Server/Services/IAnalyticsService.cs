using EXE201.Server.DTOs;
using System.Threading.Tasks;

namespace EXE201.Server.Services
{
    public interface IAnalyticsService
    {
        Task LogEventAsync(CreateAnalyticsEventRequest req, long? userId);
        Task<StudioAnalyticsSummaryDto> GetStudioAnalyticsAsync(long studioId, int days);
        Task<AdminAnalyticsSummaryDto> GetAdminAnalyticsAsync(int days);
    }
}
