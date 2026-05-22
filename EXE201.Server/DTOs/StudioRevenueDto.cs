namespace EXE201.Server.DTOs
{
    public class StudioMonthlyRevenueDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public decimal GrossRevenue { get; set; }
        public decimal CommissionDeducted { get; set; }
        public decimal NetRevenue { get; set; }
        public int CompletedBookings { get; set; }
    }

    public class StudioRevenueDto
    {
        public long StudioId { get; set; }
        public string StudioName { get; set; } = null!;
        public decimal GrossRevenue { get; set; }
        public decimal CommissionDeducted { get; set; }
        public decimal NetRevenue { get; set; }
        public int CompletedBookings { get; set; }
        public int PaidPayments { get; set; }
        public decimal RefundedAmount { get; set; }
        public decimal AverageBookingValue { get; set; }
        public List<StudioMonthlyRevenueDto> MonthlyRevenue { get; set; } = new();
    }

    public class StudioCommissionDto
    {
        public long BookingId { get; set; }
        public string BookingCode { get; set; } = null!;
        public string CustomerName { get; set; } = null!;
        public string ServiceName { get; set; } = null!;
        public decimal GrossAmount { get; set; }
        public decimal CommissionPercent { get; set; }
        public decimal CommissionAmount { get; set; }
        public decimal NetRevenue { get; set; }
        public string BookingStatus { get; set; } = null!;
        public string PaymentStatus { get; set; } = null!;
        public string? CompletedAt { get; set; }
        public string? PaidAt { get; set; }
    }

    public class StudioMonthlyBookingDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public int TotalBookings { get; set; }
        public int CompletedBookings { get; set; }
        public int CancelledBookings { get; set; }
    }

    public class StudioTopServiceDto
    {
        public long ServiceId { get; set; }
        public string ServiceName { get; set; } = null!;
        public int BookingCount { get; set; }
        public decimal GrossRevenue { get; set; }
        public decimal NetRevenue { get; set; }
    }

    public class StudioBookingStatisticsDto
    {
        public int TotalBookings { get; set; }
        public int PendingBookings { get; set; }
        public int ConfirmedBookings { get; set; }
        public int InProgressBookings { get; set; }
        public int CompletedBookings { get; set; }
        public int CancelledBookings { get; set; }
        public int RejectedBookings { get; set; }
        public decimal CompletionRate { get; set; }
        public decimal CancellationRate { get; set; }
        public List<StudioMonthlyBookingDto> MonthlyBookings { get; set; } = new();
        public List<StudioTopServiceDto> TopServices { get; set; } = new();
    }

    public class StudioCommissionSettingDto
    {
        public long StudioId { get; set; }
        public string StudioName { get; set; } = null!;
        public decimal CommissionPercent { get; set; }
        public string Note { get; set; } = null!;
        public string UpdatedAt { get; set; } = null!;
    }
}
