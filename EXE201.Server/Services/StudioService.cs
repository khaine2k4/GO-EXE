using exe201.Server.Models;
using EXE201.Server.Repositories;
using EXE201.Server.DTOs;

namespace EXE201.Server.Services
{
    public class StudioService : IStudioService
    {
        private readonly IStudioRepository _studioRepository;
        private readonly IBookingRepository _bookingRepository;

        public StudioService(IStudioRepository studioRepository, IBookingRepository bookingRepository)
        {
            _studioRepository = studioRepository;
            _bookingRepository = bookingRepository;
        }

        public async Task<HomeDataDto> GetHomeDataAsync()
        {
            var approvedCount = await _studioRepository.GetApprovedStudiosCountAsync();
            var totalBookings = await _bookingRepository.GetTotalBookingsCountAsync();
            var avgRating = await _studioRepository.GetAverageRatingAsync();
            var featured = await _studioRepository.GetFeaturedStudiosAsync(6);

            return new HomeDataDto
            {
                ApprovedStudiosCount = approvedCount,
                TotalBookingsCount = totalBookings,
                AvgRating = Math.Round(avgRating, 1),
                FeaturedStudios = featured.Select(s => new FeaturedStudioDto
                {
                    Id = s.StudioId,
                    Name = s.StudioName,
                    City = s.City,
                    Rating = s.AvgRating,
                    ReviewCount = s.TotalReviews,
                    CoverUrl = s.CoverUrl ?? s.LogoUrl
                }).ToList()
            };
        }
    }
}
