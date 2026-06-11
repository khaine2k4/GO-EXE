using System.Collections.Generic;

namespace EXE201.Server.DTOs
{
    public class StudioAnalyticsSummaryDto
    {
        public long TotalViews { get; set; }
        public long TotalBookingClicks { get; set; }
        public decimal BookingConversionRate { get; set; } // (Booking Clicks / Views) * 100
        public List<PackageClickStatsDto> PopularPackages { get; set; } = new();
        public List<DailyEventCountDto> DailyViews { get; set; } = new();
        public List<DailyEventCountDto> DailyBookings { get; set; } = new();
    }

    public class PackageClickStatsDto
    {
        public long PackageId { get; set; }
        public string PackageName { get; set; } = null!;
        public long ClickCount { get; set; }
    }

    public class DailyEventCountDto
    {
        public string Date { get; set; } = null!; // format yyyy-MM-dd
        public long Count { get; set; }
    }
}
