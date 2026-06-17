namespace EXE201.Server.DTOs
{
    public class TrackPageViewRequest
    {
        public string PagePath { get; set; } = null!;
        public string SessionId { get; set; } = null!;
        public string? Referrer { get; set; }
    }

    public class AnalyticsStatsResponse
    {
        public int TodayViews { get; set; }
        public int WeekViews { get; set; }
        public int MonthViews { get; set; }
        public int AllTimeViews { get; set; }
        public int TodayUniqueVisitors { get; set; }
        public int WeekUniqueVisitors { get; set; }
        public int MonthUniqueVisitors { get; set; }
        public int AllTimeUniqueVisitors { get; set; }
        public int MonthPotentialCustomerVisitors { get; set; }
        public int TotalRegisteredUsers { get; set; }
        public List<DailyViewDto> DailyViews { get; set; } = new();
        public List<TopPageDto> TopPages { get; set; } = new();
        public List<VisitorSegmentDto> VisitorSegments { get; set; } = new();
        public List<MonthlyUserGrowthDto> UserGrowth { get; set; } = new();
    }

    public class DailyViewDto
    {
        public string Date { get; set; } = null!;
        public int Views { get; set; }
        public int UniqueVisitors { get; set; }
    }

    public class TopPageDto
    {
        public string PagePath { get; set; } = null!;
        public int Views { get; set; }
        public int UniqueVisitors { get; set; }
    }

    public class VisitorSegmentDto
    {
        public string Segment { get; set; } = null!;
        public string Label { get; set; } = null!;
        public int Views { get; set; }
        public int UniqueVisitors { get; set; }
    }

    public class MonthlyUserGrowthDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public int NewUsers { get; set; }
        public int CumulativeUsers { get; set; }
    }
}
