using exe201.Server.Models;
using EXE201.Server.DTOs;
using EXE201.Server.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EXE201.Server.Services
{
    public class AnalyticsService : IAnalyticsService
    {
        private readonly IAnalyticsRepository _analyticsRepository;

        public AnalyticsService(IAnalyticsRepository analyticsRepository)
        {
            _analyticsRepository = analyticsRepository;
        }

        public async Task LogEventAsync(CreateAnalyticsEventRequest req, long? userId)
        {
            var ev = new AnalyticsEvent
            {
                EventName = req.EventName,
                PageUrl = req.PageUrl,
                StudioId = req.StudioId,
                PackageId = req.PackageId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            await _analyticsRepository.AddEventAsync(ev);
        }

        public async Task<StudioAnalyticsSummaryDto> GetStudioAnalyticsAsync(long studioId, int days)
        {
            var startDate = DateTime.UtcNow.Date.AddDays(-days);
            var events = await _analyticsRepository.GetStudioEventsAsync(studioId, startDate);

            var totalViews = events.Count(e => e.EventName == "VIEW_STUDIO");
            var totalBookingClicks = events.Count(e => e.EventName == "CLICK_BOOKING");

            decimal conversionRate = 0;
            if (totalViews > 0)
            {
                conversionRate = Math.Round(((decimal)totalBookingClicks / totalViews) * 100, 2);
            }

            // Top packages by selection click
            var popularPackages = events
                .Where(e => e.EventName == "SELECT_PACKAGE" && e.PackageId != null)
                .GroupBy(e => e.PackageId!.Value)
                .Select(g => new PackageClickStatsDto
                {
                    PackageId = g.Key,
                    PackageName = g.First().Package?.PackageName ?? $"Gói #{g.Key}",
                    ClickCount = g.Count()
                })
                .OrderByDescending(p => p.ClickCount)
                .Take(5)
                .ToList();

            // Daily event count for the chart
            var dailyViews = new List<DailyEventCountDto>();
            var dailyBookings = new List<DailyEventCountDto>();

            for (int i = days; i >= 0; i--)
            {
                var dateStr = DateTime.UtcNow.AddHours(7).Date.AddDays(-i).ToString("yyyy-MM-dd");
                
                var viewCount = events
                    .Count(e => e.EventName == "VIEW_STUDIO" && e.CreatedAt.AddHours(7).ToString("yyyy-MM-dd") == dateStr);
                
                var bookingCount = events
                    .Count(e => e.EventName == "CLICK_BOOKING" && e.CreatedAt.AddHours(7).ToString("yyyy-MM-dd") == dateStr);

                dailyViews.Add(new DailyEventCountDto { Date = dateStr, Count = viewCount });
                dailyBookings.Add(new DailyEventCountDto { Date = dateStr, Count = bookingCount });
            }

            return new StudioAnalyticsSummaryDto
            {
                TotalViews = totalViews,
                TotalBookingClicks = totalBookingClicks,
                BookingConversionRate = conversionRate,
                PopularPackages = popularPackages,
                DailyViews = dailyViews,
                DailyBookings = dailyBookings
            };
        }

        public async Task<AdminAnalyticsSummaryDto> GetAdminAnalyticsAsync(int days)
        {
            var startDate = DateTime.UtcNow.Date.AddDays(-days);
            var events = await _analyticsRepository.GetAllEventsAsync(startDate);

            var totalViews = events.Count(e => e.EventName == "VIEW_STUDIO");
            var totalBookingClicks = events.Count(e => e.EventName == "CLICK_BOOKING");

            decimal conversionRate = 0;
            if (totalViews > 0)
            {
                conversionRate = Math.Round(((decimal)totalBookingClicks / totalViews) * 100, 2);
            }

            // Top studios by views/clicks
            var topStudios = events
                .Where(e => e.StudioId != null)
                .GroupBy(e => e.StudioId!.Value)
                .Select(g => {
                    var studio = g.First().Studio;
                    var views = g.Count(e => e.EventName == "VIEW_STUDIO");
                    var bookings = g.Count(e => e.EventName == "CLICK_BOOKING");
                    decimal cr = views > 0 ? Math.Round(((decimal)bookings / views) * 100, 2) : 0;
                    
                    return new TopStudioAnalyticsDto
                    {
                        StudioId = g.Key,
                        StudioName = studio?.StudioName ?? $"Studio #{g.Key}",
                        City = studio?.City ?? "Đà Nẵng",
                        Views = views,
                        BookingClicks = bookings,
                        ConversionRate = cr
                    };
                })
                .OrderByDescending(s => s.BookingClicks)
                .ThenByDescending(s => s.Views)
                .Take(5)
                .ToList();

            // Daily trend
            var dailyViews = new List<DailyEventCountDto>();
            var dailyBookings = new List<DailyEventCountDto>();

            for (int i = days; i >= 0; i--)
            {
                var dateStr = DateTime.UtcNow.AddHours(7).Date.AddDays(-i).ToString("yyyy-MM-dd");

                var viewCount = events
                    .Count(e => e.EventName == "VIEW_STUDIO" && e.CreatedAt.AddHours(7).ToString("yyyy-MM-dd") == dateStr);

                var bookingCount = events
                    .Count(e => e.EventName == "CLICK_BOOKING" && e.CreatedAt.AddHours(7).ToString("yyyy-MM-dd") == dateStr);

                dailyViews.Add(new DailyEventCountDto { Date = dateStr, Count = viewCount });
                dailyBookings.Add(new DailyEventCountDto { Date = dateStr, Count = bookingCount });
            }

            return new AdminAnalyticsSummaryDto
            {
                TotalViews = totalViews,
                TotalBookingClicks = totalBookingClicks,
                BookingConversionRate = conversionRate,
                TopStudios = topStudios,
                DailyViews = dailyViews,
                DailyBookings = dailyBookings
            };
        }
    }
}
