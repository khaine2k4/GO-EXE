using exe201.Server.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EXE201.Server.Repositories
{
    public class AnalyticsRepository : IAnalyticsRepository
    {
        private readonly PhotoStudioBookingContext _context;

        public AnalyticsRepository(PhotoStudioBookingContext context)
        {
            _context = context;
        }

        public async Task AddEventAsync(AnalyticsEvent ev)
        {
            ev.CreatedAt = DateTime.UtcNow;
            await _context.AnalyticsEvents.AddAsync(ev);
            await _context.SaveChangesAsync();
        }

        public async Task<List<AnalyticsEvent>> GetStudioEventsAsync(long studioId, DateTime startDate)
        {
            return await _context.AnalyticsEvents
                .Include(e => e.Package)
                .Where(e => e.StudioId == studioId && e.CreatedAt >= startDate)
                .OrderBy(e => e.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<AnalyticsEvent>> GetAllEventsAsync(DateTime startDate)
        {
            return await _context.AnalyticsEvents
                .Include(e => e.Studio)
                .Where(e => e.CreatedAt >= startDate)
                .OrderBy(e => e.CreatedAt)
                .ToListAsync();
        }
    }
}
