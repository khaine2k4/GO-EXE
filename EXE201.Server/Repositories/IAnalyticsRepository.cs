using exe201.Server.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EXE201.Server.Repositories
{
    public interface IAnalyticsRepository
    {
        Task AddEventAsync(AnalyticsEvent ev);
        Task<List<AnalyticsEvent>> GetStudioEventsAsync(long studioId, DateTime startDate);
        Task<List<AnalyticsEvent>> GetAllEventsAsync(DateTime startDate);
    }
}
