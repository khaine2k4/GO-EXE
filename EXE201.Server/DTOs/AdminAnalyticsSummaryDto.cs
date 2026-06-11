using System.Collections.Generic;

namespace EXE201.Server.DTOs
{
    public class AdminAnalyticsSummaryDto
    {
        public long TotalViews { get; set; }
        public long TotalBookingClicks { get; set; }
        public decimal BookingConversionRate { get; set; } // (Booking Clicks / Views) * 100
        public List<TopStudioAnalyticsDto> TopStudios { get; set; } = new();
        public List<DailyEventCountDto> DailyViews { get; set; } = new();
        public List<DailyEventCountDto> DailyBookings { get; set; } = new();
    }

    public class TopStudioAnalyticsDto
    {
        public long StudioId { get; set; }
        public string StudioName { get; set; } = null!;
        public string City { get; set; } = null!;
        public long Views { get; set; }
        public long BookingClicks { get; set; }
        public decimal ConversionRate { get; set; }
    }
}
