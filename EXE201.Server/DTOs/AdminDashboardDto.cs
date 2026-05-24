namespace EXE201.Server.DTOs
{
    public class AdminDashboardDto
    {
        public AdminDashboardSystemStatsDto SystemStats { get; set; } = new();
        public List<AdminDashboardTopStudioDto> TopStudios { get; set; } = new();
        public List<AdminDashboardMonthlyRevenueDto> MonthlyRevenue { get; set; } = new();
        public List<AdminBookingDto> RecentBookings { get; set; } = new();
    }

    public class AdminDashboardSystemStatsDto
    {
        public int ActiveUsers { get; set; }
        public int ApprovedStudios { get; set; }
        public int PendingStudios { get; set; }
        public int TotalBookings { get; set; }
        public decimal TotalCommission { get; set; }
        public int PendingReports { get; set; }
        public int DisputedBookings { get; set; }
        public int CompletedBookings { get; set; }
        public int CancelledBookings { get; set; }
        public decimal CompletionRate { get; set; }
    }

    public class AdminDashboardTopStudioDto
    {
        public long StudioId { get; set; }
        public string StudioName { get; set; } = null!;
        public string? City { get; set; }
        public decimal AvgRating { get; set; }
        public int TotalReviews { get; set; }
        public int TotalBookings { get; set; }
    }

    public class AdminDashboardMonthlyRevenueDto
    {
        public string Month { get; set; } = null!;
        public int TotalBookings { get; set; }
        public decimal GrossRevenue { get; set; }
        public decimal PlatformCommission { get; set; }
        public decimal StudioPayout { get; set; }
    }

    public class ResolveDisputeRequestDto
    {
        public string Decision { get; set; } = null!;
        public string? AdminNote { get; set; }
    }
}
