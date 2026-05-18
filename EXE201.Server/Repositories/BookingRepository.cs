using exe201.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace EXE201.Server.Repositories
{
    public class BookingRepository : IBookingRepository
    {
        private readonly PhotoStudioBookingContext _context;

        public BookingRepository(PhotoStudioBookingContext context)
        {
            _context = context;
        }

        public async Task<int> GetTotalBookingsCountAsync()
        {
            return await _context.Bookings.CountAsync();
        }
    }
}
