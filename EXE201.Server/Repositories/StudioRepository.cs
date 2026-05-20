using exe201.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace EXE201.Server.Repositories
{
    public class StudioRepository : IStudioRepository
    {
        private readonly PhotoStudioBookingContext _context;

        public StudioRepository(PhotoStudioBookingContext context)
        {
            _context = context;
        }

        public async Task<int> GetApprovedStudiosCountAsync()
        {
            return await _context.Studios
                .CountAsync(s => s.Status == "APPROVED" && s.DeletedAt == null);
        }

        public async Task<double> GetAverageRatingAsync()
        {
            return await _context.Studios
                .Where(s => s.Status == "APPROVED" && s.DeletedAt == null)
                .AverageAsync(s => (double?)s.AvgRating) ?? 0.0;
        }

        public async Task<List<Studio>> GetFeaturedStudiosAsync(int count)
        {
            return await _context.Studios
                .Where(s => s.Status == "APPROVED" && s.DeletedAt == null)
                .OrderByDescending(s => s.AvgRating)
                .Take(count)
                .ToListAsync();
        }

        public async Task<Studio?> GetStudioByOwnerIdAsync(long ownerId)
        {
            return await _context.Studios
                .FirstOrDefaultAsync(s => s.OwnerId == ownerId && s.DeletedAt == null);
        }

        public async Task<Studio> CreateStudioAsync(Studio studio)
        {
            await _context.Studios.AddAsync(studio);
            await _context.SaveChangesAsync();
            return studio;
        }

        public async Task<Studio> UpdateStudioAsync(Studio studio)
        {
            _context.Studios.Update(studio);
            await _context.SaveChangesAsync();
            return studio;
        }

        public async Task<List<Studio>> GetAllStudiosAsync()
        {
            return await _context.Studios
                .Include(s => s.Owner)
                .Where(s => s.DeletedAt == null)
                .ToListAsync();
        }

        public async Task<Studio?> GetStudioByIdAsync(long studioId)
        {
            return await _context.Studios
                .Include(s => s.Owner)
                .FirstOrDefaultAsync(s => s.StudioId == studioId && s.DeletedAt == null);
        }
    }
}
