using exe201.Server.Models;
using EXE201.Server.DTOs;
using EXE201.Server.Repositories;

namespace EXE201.Server.Services
{
    public class StudioRevenueService : IStudioRevenueService
    {
        private readonly IStudioRevenueRepository _studioRevenueRepository;

        public StudioRevenueService(IStudioRevenueRepository studioRevenueRepository)
        {
            _studioRevenueRepository = studioRevenueRepository;
        }

        public async Task<StudioRevenueDto?> GetRevenueAsync(long ownerId, DateTime? from = null, DateTime? to = null)
        {
            var studio = await _studioRevenueRepository.GetOwnedStudioAsync(ownerId);
            if (studio == null) return null;

            var bookings = await _studioRevenueRepository.GetValidRevenueBookingsAsync(studio.StudioId, from, to);
            var monthly = bookings
                .GroupBy(b => new { b.CompletedAt!.Value.Year, b.CompletedAt.Value.Month })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                .Select(g => new StudioMonthlyRevenueDto
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    GrossRevenue = g.Sum(b => b.TotalPrice),
                    CommissionDeducted = g.Sum(b => b.CommissionAmount),
                    NetRevenue = g.Sum(b => b.StudioRevenue),
                    CompletedBookings = g.Count()
                })
                .ToList();

            var paidPayments = bookings
                .SelectMany(b => b.Payments)
                .Where(p => p.PaymentStatus.StatusName == "PAID")
                .Select(p => p.PaymentId)
                .Distinct()
                .Count();

            var refundedAmount = await _studioRevenueRepository.GetRefundedAmountAsync(studio.StudioId, from, to);

            return new StudioRevenueDto
            {
                StudioId = studio.StudioId,
                StudioName = studio.StudioName,
                GrossRevenue = bookings.Sum(b => b.TotalPrice),
                CommissionDeducted = bookings.Sum(b => b.CommissionAmount),
                NetRevenue = bookings.Sum(b => b.StudioRevenue),
                CompletedBookings = bookings.Count,
                PaidPayments = paidPayments,
                RefundedAmount = refundedAmount,
                AverageBookingValue = bookings.Count == 0 ? 0m : Math.Round(bookings.Average(b => b.TotalPrice), 0),
                MonthlyRevenue = monthly
            };
        }

        public async Task<List<StudioCommissionDto>?> GetCommissionsAsync(long ownerId, DateTime? from = null, DateTime? to = null, string? search = null, string? sortBy = null)
        {
            var studio = await _studioRevenueRepository.GetOwnedStudioAsync(ownerId);
            if (studio == null) return null;

            var bookings = await _studioRevenueRepository.GetValidRevenueBookingsAsync(studio.StudioId, from, to);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLower();
                bookings = bookings.Where(b =>
                    b.BookingCode.ToLower().Contains(q) ||
                    b.Customer.FullName.ToLower().Contains(q) ||
                    b.Package.Service.ServiceName.ToLower().Contains(q)).ToList();
            }

            bookings = (sortBy ?? "newest") switch
            {
                "oldest" => bookings.OrderBy(b => b.CompletedAt).ToList(),
                "commission_desc" => bookings.OrderByDescending(b => b.CommissionAmount).ToList(),
                "commission_asc" => bookings.OrderBy(b => b.CommissionAmount).ToList(),
                "gross_desc" => bookings.OrderByDescending(b => b.TotalPrice).ToList(),
                "gross_asc" => bookings.OrderBy(b => b.TotalPrice).ToList(),
                _ => bookings.OrderByDescending(b => b.CompletedAt).ToList(),
            };

            return bookings.Select(MapStudioCommission).ToList();
        }

        public async Task<StudioBookingStatisticsDto?> GetBookingStatisticsAsync(long ownerId, DateTime? from = null, DateTime? to = null)
        {
            var studio = await _studioRevenueRepository.GetOwnedStudioAsync(ownerId);
            if (studio == null) return null;

            var bookings = await _studioRevenueRepository.GetBookingsForStatisticsAsync(studio.StudioId, from, to);

            var total = bookings.Count;
            var completed = bookings.Count(b => b.Status.StatusName == "COMPLETED");
            var cancelled = bookings.Count(b => b.Status.StatusName == "CANCELLED");

            return new StudioBookingStatisticsDto
            {
                TotalBookings = total,
                PendingBookings = bookings.Count(b => b.Status.StatusName == "PENDING"),
                ConfirmedBookings = bookings.Count(b => b.Status.StatusName == "CONFIRMED"),
                InProgressBookings = bookings.Count(b => b.Status.StatusName == "IN_PROGRESS"),
                CompletedBookings = completed,
                CancelledBookings = cancelled,
                RejectedBookings = bookings.Count(b => b.Status.StatusName == "REJECTED"),
                CompletionRate = total == 0 ? 0m : Math.Round(completed * 100m / total, 2),
                CancellationRate = total == 0 ? 0m : Math.Round(cancelled * 100m / total, 2),
                MonthlyBookings = bookings
                    .GroupBy(b => new { b.CreatedAt.Year, b.CreatedAt.Month })
                    .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                    .Select(g => new StudioMonthlyBookingDto
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        TotalBookings = g.Count(),
                        CompletedBookings = g.Count(b => b.Status.StatusName == "COMPLETED"),
                        CancelledBookings = g.Count(b => b.Status.StatusName == "CANCELLED")
                    })
                    .ToList(),
                TopServices = bookings
                    .GroupBy(b => new { b.Package.ServiceId, b.Package.Service.ServiceName })
                    .OrderByDescending(g => g.Count())
                    .ThenByDescending(g => g.Sum(b => b.TotalPrice))
                    .Take(10)
                    .Select(g => new StudioTopServiceDto
                    {
                        ServiceId = g.Key.ServiceId,
                        ServiceName = g.Key.ServiceName,
                        BookingCount = g.Count(),
                        GrossRevenue = g.Where(IsValidRevenueBooking).Sum(b => b.TotalPrice),
                        NetRevenue = g.Where(IsValidRevenueBooking).Sum(b => b.StudioRevenue)
                    })
                    .ToList()
            };
        }

        public async Task<StudioCommissionSettingDto?> GetCommissionSettingAsync(long ownerId)
        {
            var studio = await _studioRevenueRepository.GetOwnedStudioAsync(ownerId);
            if (studio == null) return null;

            return new StudioCommissionSettingDto
            {
                StudioId = studio.StudioId,
                StudioName = studio.StudioName,
                CommissionPercent = studio.CommissionPercent,
                Note = "Commission hien tai duoc he thong dung de tinh phi nen tang. Cac booking cu khong bi thay doi.",
                UpdatedAt = studio.UpdatedAt.ToString("O")
            };
        }

        public async Task<List<SettlementDto>?> GetSettlementsAsync(long ownerId, string? status = null)
        {
            var studio = await _studioRevenueRepository.GetOwnedStudioAsync(ownerId);
            if (studio == null) return null;

            var settlements = await _studioRevenueRepository.GetSettlementsAsync(studio.StudioId, status);
            return settlements.Select(MapSettlement).ToList();
        }

        private static bool IsValidRevenueBooking(Booking booking)
        {
            return booking.Status.StatusName == "COMPLETED"
                && booking.CompletedAt.HasValue
                && booking.Payments.Any(p => p.PaymentStatus.StatusName == "PAID");
        }

        private static StudioCommissionDto MapStudioCommission(Booking booking)
        {
            var paidPayment = booking.Payments
                .Where(p => p.PaymentStatus.StatusName == "PAID")
                .OrderByDescending(p => p.PaidAt ?? p.CreatedAt)
                .First();

            return new StudioCommissionDto
            {
                BookingId = booking.BookingId,
                BookingCode = booking.BookingCode,
                CustomerName = booking.Customer.FullName,
                ServiceName = booking.Package.Service.ServiceName,
                GrossAmount = booking.TotalPrice,
                CommissionPercent = booking.CommissionPercent,
                CommissionAmount = booking.CommissionAmount,
                NetRevenue = booking.StudioRevenue,
                BookingStatus = booking.Status.StatusName,
                PaymentStatus = paidPayment.PaymentStatus.StatusName,
                CompletedAt = booking.CompletedAt?.ToString("O"),
                PaidAt = paidPayment.PaidAt?.ToString("O")
            };
        }

        private static SettlementDto MapSettlement(Settlement settlement)
        {
            return new SettlementDto
            {
                SettlementId = settlement.SettlementId,
                BookingId = settlement.BookingId,
                BookingCode = settlement.Booking.BookingCode,
                StudioId = settlement.StudioId,
                StudioName = settlement.Studio.StudioName,
                CustomerName = settlement.Booking.Customer.FullName,
                BookingStatus = settlement.Booking.Status.StatusName,
                GrossAmount = settlement.GrossAmount,
                PlatformFeePercent = settlement.PlatformFeePercent,
                PlatformFeeAmount = settlement.PlatformFeeAmount,
                StudioAmount = settlement.StudioAmount,
                Status = settlement.Status,
                PayoutMethod = settlement.PayoutMethod,
                CompletedAt = settlement.Booking.CompletedAt?.ToString("O"),
                PaidAt = settlement.PaidAt?.ToString("O"),
                CreatedAt = settlement.CreatedAt.ToString("O"),
                UpdatedAt = settlement.UpdatedAt.ToString("O")
            };
        }
    }
}
