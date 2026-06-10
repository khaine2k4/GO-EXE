using exe201.Server.Models;
using EXE201.Server.DTOs;
using Microsoft.EntityFrameworkCore;
using EXE201.Server.Services;

namespace EXE201.Server.Repositories
{
    public class AdminRepository : IAdminRepository
    {
        private readonly PhotoStudioBookingContext _context;
        private readonly IPayOsService _payOsService;
        private readonly IWalletService _walletService;

        public AdminRepository(PhotoStudioBookingContext context, IPayOsService payOsService, IWalletService walletService)
        {
            _context = context;
            _payOsService = payOsService;
            _walletService = walletService;
        }

        public async Task<List<AdminBookingDto>> GetBookingsAsync(string? search = null, string? status = null, string? paymentStatus = null, string? sortBy = null)
        {
            var query = _context.Bookings
                .Include(b => b.Customer)
                .Include(b => b.Studio)
                .Include(b => b.Package)
                .Include(b => b.Status)
                .Include(b => b.Payments).ThenInclude(p => p.PaymentStatus)
                .Include(b => b.Payments).ThenInclude(p => p.Method)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.ToLower();
                query = query.Where(b =>
                    b.BookingCode.ToLower().Contains(q) ||
                    b.Customer.FullName.ToLower().Contains(q) ||
                    b.Studio.StudioName.ToLower().Contains(q) ||
                    b.Package.PackageName.ToLower().Contains(q));
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
            {
                query = status == "DISPUTED"
                    ? query.Where(b => b.DisputedAt != null && b.DisputeResolvedAt == null)
                    : query.Where(b => b.Status.StatusName == status && (b.DisputedAt == null || b.DisputeResolvedAt != null));
            }

            if (!string.IsNullOrWhiteSpace(paymentStatus) && paymentStatus != "ALL")
                query = query.Where(b => b.Payments.Any(p => p.PaymentStatus.StatusName == paymentStatus));

            query = (sortBy ?? "newest") switch
            {
                "oldest" => query.OrderBy(b => b.CreatedAt),
                "amount" => query.OrderByDescending(b => b.TotalPrice),
                "status" => query.OrderBy(b => b.Status.StatusName).ThenByDescending(b => b.CreatedAt),
                _ => query.OrderByDescending(b => b.CreatedAt),
            };

            var bookings = await query.ToListAsync();

            return bookings.Select(b => new AdminBookingDto
            {
                Id = b.BookingId,
                BookingCode = b.BookingCode,
                CustomerName = b.Customer.FullName,
                StudioName = b.Studio.StudioName,
                PackageName = b.Package.PackageName,
                ShootingDate = b.ShootingDate.ToString("yyyy-MM-dd"),
                Status = GetEffectiveBookingStatus(b),
                TotalPrice = b.TotalPrice,
                CommissionPercent = b.CommissionPercent,
                CommissionAmount = b.CommissionAmount,
                StudioRevenue = b.StudioRevenue,
                PaymentStatus = b.Payments.OrderByDescending(p => p.CreatedAt).Select(p => p.PaymentStatus.StatusName).FirstOrDefault(),
                PaymentAmount = b.Payments.OrderByDescending(p => p.CreatedAt).Select(p => (decimal?)p.Amount).FirstOrDefault(),
                PaymentCode = b.Payments.OrderByDescending(p => p.CreatedAt).Select(p => p.PaymentCode).FirstOrDefault(),
                City = b.Studio.City,
                DisputeNote = b.DisputeNote,
                CreatedAt = b.CreatedAt.ToString("O")
            }).ToList();
        }

        public async Task<AdminBookingDetailDto?> GetAdminBookingDetailAsync(long bookingId)
        {
            var booking = await AdminBookingDetailQuery()
                .FirstOrDefaultAsync(b => b.BookingId == bookingId);

            return booking == null ? null : MapAdminBookingDetail(booking);
        }

        public async Task<AdminDashboardDto> GetAdminDashboardStatsAsync()
        {
            var system = await _context.VSystemStats.AsNoTracking().FirstOrDefaultAsync();
            var disputedBookings = await _context.Bookings
                .CountAsync(b => b.DisputedAt != null && b.DisputeResolvedAt == null);
            var completedBookings = await _context.Bookings
                .CountAsync(b => b.Status.StatusName == "COMPLETED");
            var cancelledBookings = await _context.Bookings
                .CountAsync(b => b.Status.StatusName == "CANCELLED");

            var topStudios = await _context.VTopStudios
                .AsNoTracking()
                .OrderByDescending(s => s.TotalBookings)
                .ThenByDescending(s => s.AvgRating)
                .Take(10)
                .Select(s => new AdminDashboardTopStudioDto
                {
                    StudioId = s.StudioId,
                    StudioName = s.StudioName,
                    City = s.City,
                    AvgRating = s.AvgRating,
                    TotalReviews = s.TotalReviews,
                    TotalBookings = s.TotalBookings
                })
                .ToListAsync();

            var monthlyRevenue = await _context.VMonthlyPlatformRevenues
                .AsNoTracking()
                .OrderBy(r => r.Month)
                .Select(r => new AdminDashboardMonthlyRevenueDto
                {
                    Month = r.Month ?? string.Empty,
                    TotalBookings = r.TotalBookings ?? 0,
                    GrossRevenue = r.GrossRevenue ?? 0m,
                    PlatformCommission = r.PlatformCommission ?? 0m,
                    StudioPayout = r.StudioPayout ?? 0m
                })
                .ToListAsync();

            var recentBookings = await GetBookingsAsync(sortBy: "newest");
            var totalBookings = system?.TotalBookings ?? 0;

            return new AdminDashboardDto
            {
                SystemStats = new AdminDashboardSystemStatsDto
                {
                    ActiveUsers = system?.ActiveUsers ?? 0,
                    ApprovedStudios = system?.ApprovedStudios ?? 0,
                    PendingStudios = system?.PendingStudios ?? 0,
                    TotalBookings = totalBookings,
                    TotalCommission = system?.TotalCommission ?? 0m,
                    PendingReports = system?.PendingReports ?? 0,
                    DisputedBookings = disputedBookings,
                    CompletedBookings = completedBookings,
                    CancelledBookings = cancelledBookings,
                    CompletionRate = totalBookings == 0 ? 0m : Math.Round(completedBookings * 100m / totalBookings, 2)
                },
                TopStudios = topStudios,
                MonthlyRevenue = monthlyRevenue,
                RecentBookings = recentBookings.Take(5).ToList()
            };
        }

        public async Task<AdminBookingDetailDto?> ResolveDisputeAsync(long bookingId, string decision, string? adminNote, long adminId)
        {
            var normalizedDecision = decision.Trim().ToUpperInvariant();
            if (normalizedDecision is not ("RELEASE" or "REFUND"))
                throw new InvalidOperationException("Decision must be RELEASE or REFUND.");

            await using var tx = await _context.Database.BeginTransactionAsync();

            var booking = await _context.Bookings
                .FromSqlInterpolated($"SELECT * FROM bookings WITH (UPDLOCK, ROWLOCK) WHERE booking_id = {bookingId}")
                .Include(b => b.Status)
                .Include(b => b.Slot)
                .Include(b => b.Customer)
                .Include(b => b.Studio)
                .Include(b => b.Package).ThenInclude(p => p.Service)
                .Include(b => b.Payments).ThenInclude(p => p.Method)
                .Include(b => b.Payments).ThenInclude(p => p.PaymentStatus)
                .Include(b => b.Settlement)
                .FirstOrDefaultAsync();

            if (booking == null) return null;
            if (!IsDisputed(booking))
                throw new InvalidOperationException("Booking is not in an active dispute.");

            var now = DateTime.UtcNow;
            var oldStatus = "DISPUTED";

            if (normalizedDecision == "RELEASE")
            {
                var completedStatus = await GetBookingStatusAsync("COMPLETED");
                booking.StatusId = completedStatus.StatusId;
                booking.Status = completedStatus;
                booking.CompletedAt = now;

                if (booking.Settlement == null)
                {
                    _context.Settlements.Add(new Settlement
                    {
                        BookingId = booking.BookingId,
                        StudioId = booking.StudioId,
                        GrossAmount = booking.TotalPrice,
                        PlatformFeePercent = booking.CommissionPercent,
                        PlatformFeeAmount = booking.CommissionAmount,
                        StudioAmount = booking.StudioRevenue,
                        Status = "READY",
                        PayoutMethod = "MANUAL",
                        CreatedAt = now,
                        UpdatedAt = now
                    });
                }

                AddBookingLog(booking.BookingId, oldStatus, "COMPLETED", adminId, BuildAdminDisputeNote("Release to studio", adminNote));
            }
            else
            {
                var cancelledStatus = await GetBookingStatusAsync("CANCELLED");
                booking.StatusId = cancelledStatus.StatusId;
                booking.Status = cancelledStatus;
                booking.CancelledAt = now;
                booking.CancelledBy = adminId;
                booking.CancelReason = string.IsNullOrWhiteSpace(adminNote) ? "Dispute resolved with customer refund" : adminNote;
                booking.Slot.Status = "OPEN";

                await MarkLatestPaidPaymentForRefundAsync(booking, adminNote ?? "Dispute resolved with customer refund");
                
                // ── HOÀN TIỀN VÀO VÍ KHÁCH HÀNG KHI ĐƯỢC ADMIN PHÂN XỬ ────────────────
                await _walletService.CreditCustomerRefundAsync(
                    booking.CustomerId,
                    booking.TotalPrice,
                    booking.BookingId,
                    $"[Khiếu nại] Hoàn tiền Booking #{booking.BookingCode} theo quyết định phân xử của Admin");

                AddBookingLog(booking.BookingId, oldStatus, "CANCELLED", adminId, BuildAdminDisputeNote("Refund customer", adminNote));
            }

            booking.DisputeResolvedAt = now;
            booking.DisputeResolvedBy = adminId;
            booking.UpdatedAt = now;
            booking.UpdatedBy = adminId;

            await _context.SaveChangesAsync();
            await tx.CommitAsync();

            return await GetAdminBookingDetailAsync(bookingId);
        }

        public async Task<List<AdminReportDto>> GetReportsAsync(string? search = null, string? status = null, string? targetType = null, string? sortBy = null)
        {
            var query = _context.Reports
                .Include(r => r.Reporter)
                .Include(r => r.ReportType)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.ToLower();
                query = query.Where(r =>
                    r.Reporter.FullName.ToLower().Contains(q) ||
                    r.TargetType.ToLower().Contains(q) ||
                    (r.Description != null && r.Description.ToLower().Contains(q)) ||
                    r.ReportType.TypeName.ToLower().Contains(q));
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
                query = query.Where(r => r.Status == status);

            if (!string.IsNullOrWhiteSpace(targetType) && targetType != "ALL")
                query = query.Where(r => r.TargetType == targetType);

            query = (sortBy ?? "newest") switch
            {
                "oldest" => query.OrderBy(r => r.CreatedAt),
                "status" => query.OrderBy(r => r.Status).ThenByDescending(r => r.CreatedAt),
                "type" => query.OrderBy(r => r.ReportType.TypeName),
                _ => query.OrderByDescending(r => r.CreatedAt),
            };

            var reports = await query.ToListAsync();

            return reports.Select(r => new AdminReportDto
            {
                Id = r.ReportId,
                TypeName = r.ReportType.TypeName,
                ReporterName = r.Reporter.FullName,
                TargetType = r.TargetType,
                TargetId = r.TargetId,
                Description = r.Description,
                Status = r.Status,
                HandlerNote = r.HandlerNote,
                CreatedAt = r.CreatedAt.ToString("O"),
                ResolvedAt = r.ResolvedAt.HasValue ? r.ResolvedAt.Value.ToString("O") : null
            }).ToList();
        }

        public async Task<bool> ResolveReportAsync(long reportId, string status, string? handlerNote, long adminId)
        {
            var report = await _context.Reports.FirstOrDefaultAsync(r => r.ReportId == reportId);
            if (report == null) return false;

            report.Status = status;
            report.HandlerNote = handlerNote;
            report.HandledBy = adminId;
            report.ResolvedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<AdminReviewDto>> GetReviewsAsync(string? search = null, bool? isHidden = null)
        {
            var query = _context.Reviews
                .Include(r => r.Customer)
                .Include(r => r.Studio)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.ToLower();
                query = query.Where(r =>
                    r.Customer.FullName.ToLower().Contains(q) ||
                    r.Studio.StudioName.ToLower().Contains(q) ||
                    (r.Comment != null && r.Comment.ToLower().Contains(q)));
            }

            if (isHidden.HasValue)
                query = query.Where(r => r.IsHidden == isHidden.Value);

            var reviews = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();

            return reviews.Select(r => new AdminReviewDto
            {
                Id = r.ReviewId,
                CustomerName = r.Customer.FullName,
                StudioName = r.Studio.StudioName,
                Rating = r.Rating,
                Comment = r.Comment,
                IsHidden = r.IsHidden,
                HiddenNote = r.HiddenNote,
                CreatedAt = r.CreatedAt.ToString("O")
            }).ToList();
        }

        public async Task<bool> ToggleHideReviewAsync(long reviewId, bool isHidden, string? note, long adminId)
        {
            var review = await _context.Reviews.FirstOrDefaultAsync(r => r.ReviewId == reviewId);
            if (review == null) return false;

            review.IsHidden = isHidden;
            if (isHidden)
            {
                review.HiddenBy = adminId;
                review.HiddenAt = DateTime.UtcNow;
                review.HiddenNote = note;
            }
            else
            {
                review.HiddenBy = null;
                review.HiddenAt = null;
                review.HiddenNote = null;
            }
            review.UpdatedAt = DateTime.UtcNow;
            review.UpdatedBy = adminId;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<AdminServiceDto>> GetServicesAsync(string? search = null, string? status = null, long? categoryId = null, long? studioId = null, bool? isHidden = null, string? sortBy = null)
        {
            var query = _context.Services
                .Include(s => s.Studio)
                .Include(s => s.Category)
                .Include(s => s.Packages)
                .Include(s => s.HiddenByNavigation)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLower();
                query = query.Where(s =>
                    s.ServiceName.ToLower().Contains(q) ||
                    s.Studio.StudioName.ToLower().Contains(q));
            }

            if (categoryId.HasValue)
                query = query.Where(s => s.CategoryId == categoryId.Value);

            if (studioId.HasValue)
                query = query.Where(s => s.StudioId == studioId.Value);

            if (isHidden.HasValue)
                query = query.Where(s => s.IsHidden == isHidden.Value);

            if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
            {
                query = status.ToUpperInvariant() switch
                {
                    "ACTIVE" => query.Where(s => s.IsActive),
                    "INACTIVE" => query.Where(s => !s.IsActive),
                    _ => query
                };
            }

            query = (sortBy ?? "newest") switch
            {
                "oldest" => query.OrderBy(s => s.CreatedAt),
                "name" => query.OrderBy(s => s.ServiceName),
                "studio" => query.OrderBy(s => s.Studio.StudioName).ThenBy(s => s.ServiceName),
                "category" => query.OrderBy(s => s.Category.CategoryName).ThenBy(s => s.ServiceName),
                "hidden" => query.OrderByDescending(s => s.IsHidden).ThenByDescending(s => s.UpdatedAt),
                _ => query.OrderByDescending(s => s.CreatedAt),
            };

            var services = await query.ToListAsync();
            return services.Select(MapAdminService).ToList();
        }

        public async Task<AdminServiceDto?> HideServiceAsync(long serviceId, long adminId, string? reason = null)
        {
            var service = await GetServiceForModerationAsync(serviceId);
            if (service == null) return null;

            ApplyServiceHiddenState(service, adminId);
            await _context.SaveChangesAsync();
            service.HiddenByNavigation = await _context.Users.FindAsync(adminId);

            return MapAdminService(service);
        }

        public async Task<AdminServiceDto?> UnhideServiceAsync(long serviceId, long adminId)
        {
            var service = await GetServiceForModerationAsync(serviceId);
            if (service == null) return null;

            service.IsHidden = false;
            service.HiddenBy = null;
            service.HiddenAt = null;
            service.UpdatedAt = DateTime.UtcNow;
            service.UpdatedBy = adminId;
            await _context.SaveChangesAsync();

            return MapAdminService(service);
        }

        public async Task<AdminServiceDto?> SoftDeleteServiceAsync(long serviceId, long adminId, string? reason = null)
        {
            var service = await GetServiceForModerationAsync(serviceId);
            if (service == null) return null;

            ApplyServiceHiddenState(service, adminId);
            await _context.SaveChangesAsync();
            service.HiddenByNavigation = await _context.Users.FindAsync(adminId);

            return MapAdminService(service);
        }

        public async Task<List<AdminPaymentDto>> GetPaymentsAsync(string? search = null, string? status = null, string? method = null, long? studioId = null, DateTime? from = null, DateTime? to = null, string? sortBy = null)
        {
            var query = PaymentQuery();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLower();
                query = query.Where(p =>
                    p.PaymentCode.ToLower().Contains(q) ||
                    (p.Booking.BookingCode != null && p.Booking.BookingCode.ToLower().Contains(q)) ||
                    (p.TransactionCode != null && p.TransactionCode.ToLower().Contains(q)) ||
                    p.Booking.Customer.FullName.ToLower().Contains(q) ||
                    p.Booking.Customer.Email.ToLower().Contains(q) ||
                    p.Booking.Studio.StudioName.ToLower().Contains(q));
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
                query = query.Where(p => p.PaymentStatus.StatusName == status);

            if (!string.IsNullOrWhiteSpace(method) && method != "ALL")
                query = query.Where(p => p.Method.MethodName == method);

            if (studioId.HasValue)
                query = query.Where(p => p.Booking.StudioId == studioId.Value);

            if (from.HasValue)
                query = query.Where(p => p.CreatedAt >= from.Value);

            if (to.HasValue)
                query = query.Where(p => p.CreatedAt <= to.Value);

            query = (sortBy ?? "newest") switch
            {
                "oldest" => query.OrderBy(p => p.CreatedAt),
                "amount_desc" => query.OrderByDescending(p => p.Amount),
                "amount_asc" => query.OrderBy(p => p.Amount),
                "status" => query.OrderBy(p => p.PaymentStatus.StatusName).ThenByDescending(p => p.CreatedAt),
                _ => query.OrderByDescending(p => p.CreatedAt),
            };

            var payments = await query.ToListAsync();
            return payments.Select(MapAdminPayment).ToList();
        }

        public async Task<AdminPaymentDetailDto?> GetPaymentDetailAsync(long paymentId)
        {
            var payment = await PaymentQuery().FirstOrDefaultAsync(p => p.PaymentId == paymentId);
            return payment == null ? null : MapAdminPaymentDetail(payment);
        }

        public async Task<AdminPaymentDetailDto?> UpdatePaymentStatusAsync(long paymentId, UpdateAdminPaymentStatusRequestDto request, long adminId)
        {
            var normalizedStatus = request.Status.Trim().ToUpperInvariant();
            var allowedStatuses = new[] { "PENDING", "PAID", "FAILED", "REFUND_PENDING", "REFUNDED", "CANCELLED" };
            if (!allowedStatuses.Contains(normalizedStatus))
                throw new InvalidOperationException("Payment status is not supported for manual admin update.");

            var payment = await PaymentQuery().FirstOrDefaultAsync(p => p.PaymentId == paymentId);
            if (payment == null) return null;

            var status = await _context.PaymentStatuses.FirstOrDefaultAsync(s => s.StatusName == normalizedStatus);
            if (status == null)
                throw new InvalidOperationException("Payment status does not exist in database.");

            payment.PaymentStatusId = status.PaymentStatusId;
            payment.PaymentStatus = status;
            payment.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(request.TransactionCode))
                payment.TransactionCode = request.TransactionCode.Trim();

            if (normalizedStatus == "PAID")
            {
                payment.PaidAt ??= DateTime.UtcNow;
                payment.FailureReason = null;
            }
            else if (normalizedStatus == "FAILED")
            {
                payment.FailureReason = request.Reason;
            }
            else if (normalizedStatus == "REFUNDED")
            {
                payment.RefundedAt ??= DateTime.UtcNow;
                payment.RefundReason = request.Reason;
            }
            else if (normalizedStatus == "REFUND_PENDING")
            {
                payment.RefundMethod = "MANUAL";
                payment.RefundPendingReason = request.Reason;
                payment.RefundReason = request.Reason;
            }
            else if (normalizedStatus == "PENDING")
            {
                payment.FailureReason = null;
            }
            else if (normalizedStatus == "CANCELLED")
            {
                payment.FailureReason = request.Reason;
            }

            await _context.SaveChangesAsync();
            return MapAdminPaymentDetail(payment);
        }

        public async Task<AdminRevenueSummaryDto> GetRevenueSummaryAsync(DateTime? from = null, DateTime? to = null)
        {
            var bookings = await ValidRevenueBookingsQuery(from, to).ToListAsync();
            var paidPaymentIds = bookings
                .SelectMany(b => b.Payments)
                .Where(p => p.PaymentStatus.StatusName == "PAID")
                .Select(p => p.PaymentId)
                .Distinct()
                .Count();

            var refundedAmount = await _context.Payments
                .Include(p => p.PaymentStatus)
                .Where(p => p.PaymentStatus.StatusName == "REFUNDED")
                .Where(p => !from.HasValue || (p.RefundedAt.HasValue && p.RefundedAt.Value >= from.Value))
                .Where(p => !to.HasValue || (p.RefundedAt.HasValue && p.RefundedAt.Value <= to.Value))
                .SumAsync(p => (decimal?)p.Amount) ?? 0m;

            return new AdminRevenueSummaryDto
            {
                GrossRevenue = bookings.Sum(b => b.TotalPrice),
                PlatformCommission = bookings.Sum(b => b.CommissionAmount),
                StudioPayout = bookings.Sum(b => b.StudioRevenue),
                CompletedBookings = bookings.Count,
                PaidPayments = paidPaymentIds,
                RefundedAmount = refundedAmount,
                AverageCommissionRate = bookings.Count == 0 ? 0m : Math.Round(bookings.Average(b => b.CommissionPercent), 2)
            };
        }

        public async Task<List<AdminMonthlyRevenueDto>> GetMonthlyRevenueAsync(DateTime? from = null, DateTime? to = null)
        {
            return await ValidRevenueBookingsQuery(from, to)
                .GroupBy(b => new { b.CompletedAt!.Value.Year, b.CompletedAt.Value.Month })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                .Select(g => new AdminMonthlyRevenueDto
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    GrossRevenue = g.Sum(b => b.TotalPrice),
                    PlatformCommission = g.Sum(b => b.CommissionAmount),
                    StudioPayout = g.Sum(b => b.StudioRevenue),
                    CompletedBookings = g.Count()
                })
                .ToListAsync();
        }

        public async Task<List<AdminCommissionDto>> GetCommissionsAsync(long? studioId = null, string? search = null, DateTime? from = null, DateTime? to = null, string? sortBy = null)
        {
            var query = ValidRevenueBookingsQuery(from, to);

            if (studioId.HasValue)
                query = query.Where(b => b.StudioId == studioId.Value);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLower();
                query = query.Where(b =>
                    b.BookingCode.ToLower().Contains(q) ||
                    b.Studio.StudioName.ToLower().Contains(q) ||
                    b.Customer.FullName.ToLower().Contains(q) ||
                    b.Package.Service.ServiceName.ToLower().Contains(q));
            }

            query = (sortBy ?? "newest") switch
            {
                "oldest" => query.OrderBy(b => b.CompletedAt),
                "commission_desc" => query.OrderByDescending(b => b.CommissionAmount),
                "commission_asc" => query.OrderBy(b => b.CommissionAmount),
                "gross_desc" => query.OrderByDescending(b => b.TotalPrice),
                "gross_asc" => query.OrderBy(b => b.TotalPrice),
                _ => query.OrderByDescending(b => b.CompletedAt),
            };

            var bookings = await query.ToListAsync();
            return bookings.Select(MapAdminCommission).ToList();
        }

        public async Task<List<SettlementDto>> GetSettlementsAsync(string? status = null, long? studioId = null, string? search = null, string? sortBy = null)
        {
            var query = SettlementQuery();

            if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
                query = query.Where(s => s.Status == status);

            if (studioId.HasValue)
                query = query.Where(s => s.StudioId == studioId.Value);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLower();
                query = query.Where(s =>
                    s.Booking.BookingCode.ToLower().Contains(q) ||
                    s.Studio.StudioName.ToLower().Contains(q) ||
                    s.Booking.Customer.FullName.ToLower().Contains(q));
            }

            query = (sortBy ?? "newest") switch
            {
                "oldest" => query.OrderBy(s => s.CreatedAt),
                "amount_desc" => query.OrderByDescending(s => s.StudioAmount),
                "amount_asc" => query.OrderBy(s => s.StudioAmount),
                "status" => query.OrderBy(s => s.Status).ThenByDescending(s => s.CreatedAt),
                _ => query.OrderByDescending(s => s.CreatedAt),
            };

            var settlements = await query.ToListAsync();
            return settlements.Select(MapSettlement).ToList();
        }

        public async Task<SettlementDto?> MarkSettlementPaidAsync(long settlementId, string? payoutMethod = null)
        {
            var settlement = await SettlementQuery()
                .FirstOrDefaultAsync(s => s.SettlementId == settlementId);

            if (settlement == null) return null;
            if (settlement.Status is "PAID" or "CANCELLED")
                throw new InvalidOperationException("Settlement cannot be paid in its current status.");

            var normPayoutMethod = payoutMethod?.Trim().ToUpperInvariant() ?? "MANUAL";

            if (normPayoutMethod == "PAYOS_PAYOUT")
            {
                // In Sandbox / MVP environment, we use a standard sandbox destination account since
                // database does not store individual Studio bank details yet.
                var accountNumber = "123456789";
                var bankCode = "970422"; // MB Bank (Military Bank) BIN Code
                var accountName = "NGUYEN VAN A";

                var payoutSuccess = await _payOsService.ExecutePayoutAsync(
                    accountNumber,
                    bankCode,
                    accountName,
                    (int)settlement.StudioAmount,
                    $"Thanh toan studio BK {settlement.Booking.BookingCode}"
                );

                if (!payoutSuccess)
                {
                    throw new InvalidOperationException("PayOS automated payout failed. Check configuration or balance.");
                }
            }

            settlement.Status = "PAID";
            settlement.PayoutMethod = normPayoutMethod;
            settlement.PaidAt = DateTime.UtcNow;
            settlement.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Cộng tiền vào wallet studio sau khi admin duyệt settlement
            await _walletService.CreditStudioEarningAsync(
                settlement.StudioId,
                settlement.StudioAmount,
                settlement.BookingId,
                $"[Admin duyệt] Thu nhập từ Booking #{settlement.Booking.BookingCode}");

            return MapSettlement(settlement);
        }

        private async Task<Service?> GetServiceForModerationAsync(long serviceId)
        {
            return await _context.Services
                .Include(s => s.Studio)
                .Include(s => s.Category)
                .Include(s => s.Packages)
                .Include(s => s.HiddenByNavigation)
                .FirstOrDefaultAsync(s => s.ServiceId == serviceId);
        }

        private IQueryable<Payment> PaymentQuery()
        {
            return _context.Payments
                .Include(p => p.Method)
                .Include(p => p.PaymentStatus)
                .Include(p => p.Booking).ThenInclude(b => b.Customer)
                .Include(p => p.Booking).ThenInclude(b => b.Studio)
                .Include(p => p.Booking).ThenInclude(b => b.Package)
                .Include(p => p.Booking).ThenInclude(b => b.Status);
        }

        private IQueryable<Settlement> SettlementQuery()
        {
            return _context.Settlements
                .Include(s => s.Studio)
                .Include(s => s.Booking).ThenInclude(b => b.Customer)
                .Include(s => s.Booking).ThenInclude(b => b.Status);
        }

        private IQueryable<Booking> AdminBookingDetailQuery()
        {
            return _context.Bookings
                .Include(b => b.Customer)
                .Include(b => b.Studio).ThenInclude(s => s.Owner)
                .Include(b => b.Package).ThenInclude(p => p.Service)
                .Include(b => b.Status)
                .Include(b => b.Slot)
                .Include(b => b.Payments).ThenInclude(p => p.Method)
                .Include(b => b.Payments).ThenInclude(p => p.PaymentStatus)
                .Include(b => b.BookingLogs).ThenInclude(l => l.ChangedByNavigation)
                .Include(b => b.DisputeCreatedByNavigation)
                .Include(b => b.DisputeResolvedByNavigation);
        }

        private IQueryable<Booking> ValidRevenueBookingsQuery(DateTime? from, DateTime? to)
        {
            var query = _context.Bookings
                .Include(b => b.Customer)
                .Include(b => b.Studio)
                .Include(b => b.Status)
                .Include(b => b.Package).ThenInclude(p => p.Service)
                .Include(b => b.Payments).ThenInclude(p => p.PaymentStatus)
                .Where(b => b.Status.StatusName == "COMPLETED")
                .Where(b => b.CompletedAt.HasValue)
                .Where(b => b.Payments.Any(p => p.PaymentStatus.StatusName == "PAID"));

            if (from.HasValue)
                query = query.Where(b => b.CompletedAt!.Value >= from.Value);

            if (to.HasValue)
                query = query.Where(b => b.CompletedAt!.Value <= to.Value);

            return query;
        }

        private async Task<BookingStatus> GetBookingStatusAsync(string statusName)
        {
            return await _context.BookingStatuses.FirstOrDefaultAsync(s => s.StatusName == statusName)
                ?? throw new InvalidOperationException($"Booking status {statusName} does not exist in database.");
        }

        private async Task<PaymentStatus> GetPaymentStatusAsync(string statusName)
        {
            return await _context.PaymentStatuses.FirstOrDefaultAsync(s => s.StatusName == statusName)
                ?? throw new InvalidOperationException($"Payment status {statusName} does not exist in database.");
        }

        private static bool IsDisputed(Booking booking)
            => booking.DisputedAt.HasValue && !booking.DisputeResolvedAt.HasValue;

        private static string GetEffectiveBookingStatus(Booking booking)
            => IsDisputed(booking) ? "DISPUTED" : booking.Status.StatusName;

        private async Task MarkLatestPaidPaymentForRefundAsync(Booking booking, string reason)
        {
            var payment = booking.Payments
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefault(p => p.PaymentStatus.StatusName == "PAID");
            if (payment == null || payment.Method.MethodName == "CASH") return;

            var refundPending = await GetPaymentStatusAsync("REFUND_PENDING");
            payment.PaymentStatusId = refundPending.PaymentStatusId;
            payment.PaymentStatus = refundPending;
            payment.RefundMethod = "MANUAL";
            payment.RefundPendingReason = reason;
            payment.RefundReason = reason;
            payment.UpdatedAt = DateTime.UtcNow;
        }

        private void AddBookingLog(long bookingId, string? oldStatus, string newStatus, long changedBy, string? note)
        {
            _context.BookingLogs.Add(new BookingLog
            {
                BookingId = bookingId,
                OldStatus = oldStatus,
                NewStatus = newStatus,
                ChangedBy = changedBy,
                Note = note,
                ChangedAt = DateTime.UtcNow
            });
        }

        private static string BuildAdminDisputeNote(string action, string? adminNote)
        {
            return string.IsNullOrWhiteSpace(adminNote)
                ? $"Admin dispute decision: {action}"
                : $"Admin dispute decision: {action}. Note: {adminNote.Trim()}";
        }

        private static PaymentResponse MapPaymentResponse(Payment payment) => new()
        {
            Id = payment.PaymentId,
            BookingId = payment.BookingId,
            PaymentCode = payment.PaymentCode,
            MethodName = payment.Method.MethodName,
            Status = payment.PaymentStatus.StatusName,
            PaymentProvider = payment.PaymentProvider,
            Amount = payment.Amount,
            CurrencyCode = payment.CurrencyCode,
            TransactionCode = payment.TransactionCode,
            PaidAt = payment.PaidAt?.ToString("O"),
            RefundedAt = payment.RefundedAt?.ToString("O"),
            RefundMethod = payment.RefundMethod,
            RefundPendingReason = payment.RefundPendingReason,
            CreatedAt = payment.CreatedAt.ToString("O")
        };

        private static AdminBookingDetailDto MapAdminBookingDetail(Booking booking)
        {
            var payments = booking.Payments
                .OrderByDescending(p => p.CreatedAt)
                .Select(MapPaymentResponse)
                .ToList();

            return new AdminBookingDetailDto
            {
                Id = booking.BookingId,
                BookingCode = booking.BookingCode,
                Status = GetEffectiveBookingStatus(booking),
                RealStatus = booking.Status.StatusName,
                ShootingDate = booking.ShootingDate.ToString("yyyy-MM-dd"),
                StartTime = booking.Slot.StartTime.ToString("HH:mm"),
                EndTime = booking.Slot.EndTime.ToString("HH:mm"),
                ShootingLocation = booking.ShootingLocation,
                Note = booking.Note,
                TotalPrice = booking.TotalPrice,
                CommissionPercent = booking.CommissionPercent,
                CommissionAmount = booking.CommissionAmount,
                StudioRevenue = booking.StudioRevenue,
                PaymentExpiresAt = booking.PaymentExpiresAt?.ToString("O"),
                ConfirmedAt = booking.ConfirmedAt?.ToString("O"),
                RejectedAt = booking.RejectedAt?.ToString("O"),
                RejectReason = booking.RejectReason,
                CompletedAt = booking.CompletedAt?.ToString("O"),
                CancelledAt = booking.CancelledAt?.ToString("O"),
                CancelledBy = booking.CancelledBy,
                CancelReason = booking.CancelReason,
                CreatedAt = booking.CreatedAt.ToString("O"),
                UpdatedAt = booking.UpdatedAt.ToString("O"),
                Customer = new AdminBookingPartyDto
                {
                    Id = booking.CustomerId,
                    Name = booking.Customer.FullName,
                    Email = booking.Customer.Email,
                    Phone = booking.Customer.Phone
                },
                Studio = new AdminBookingStudioDto
                {
                    Id = booking.StudioId,
                    Name = booking.Studio.StudioName,
                    StudioName = booking.Studio.StudioName,
                    Email = booking.Studio.Email ?? booking.Studio.Owner?.Email ?? string.Empty,
                    Phone = booking.Studio.Phone ?? booking.Studio.Owner?.Phone,
                    City = booking.Studio.City,
                    District = booking.Studio.District,
                    AddressLine = booking.Studio.AddressLine
                },
                Package = new AdminBookingPackageDto
                {
                    Id = booking.PackageId,
                    PackageName = booking.Package.PackageName,
                    ServiceName = booking.Package.Service.ServiceName,
                    Price = booking.Package.Price
                },
                LatestPayment = payments.FirstOrDefault(),
                Payments = payments,
                Logs = booking.BookingLogs
                    .OrderByDescending(l => l.ChangedAt)
                    .Select(l => new AdminBookingLogDto
                    {
                        Id = l.LogId,
                        OldStatus = l.OldStatus,
                        NewStatus = l.NewStatus,
                        ChangedBy = l.ChangedBy,
                        ChangedByName = l.ChangedByNavigation?.FullName,
                        Note = l.Note,
                        ChangedAt = l.ChangedAt.ToString("O")
                    })
                    .ToList(),
                Dispute = booking.DisputedAt.HasValue
                    ? new AdminBookingDisputeDto
                    {
                        Reason = booking.DisputeNote,
                        DisputedAt = booking.DisputedAt?.ToString("O"),
                        CreatedBy = booking.DisputeCreatedBy,
                        CreatedByName = booking.DisputeCreatedByNavigation?.FullName ?? (booking.DisputeCreatedByRole == "STUDIO_OWNER" ? booking.Studio.StudioName : booking.Customer.FullName),
                        CreatedByRole = booking.DisputeCreatedByRole,
                        ResolvedAt = booking.DisputeResolvedAt?.ToString("O"),
                        ResolvedBy = booking.DisputeResolvedBy,
                        ResolvedByName = booking.DisputeResolvedByNavigation?.FullName
                    }
                    : null
            };
        }

        private static void ApplyServiceHiddenState(Service service, long adminId)
        {
            service.IsHidden = true;
            service.IsActive = false;
            service.HiddenBy = adminId;
            service.HiddenAt = DateTime.UtcNow;
            service.UpdatedAt = DateTime.UtcNow;
            service.UpdatedBy = adminId;
        }

        private static AdminServiceDto MapAdminService(Service service)
        {
            var activePackages = service.Packages.Where(p => p.DeletedAt == null).ToList();
            return new AdminServiceDto
            {
                ServiceId = service.ServiceId,
                ServiceName = service.ServiceName,
                StudioId = service.StudioId,
                StudioName = service.Studio.StudioName,
                CategoryId = service.CategoryId,
                CategoryName = service.Category.CategoryName,
                City = service.City ?? service.Studio.City,
                MinPrice = activePackages.Count == 0 ? null : activePackages.Min(p => p.Price),
                MaxPrice = activePackages.Count == 0 ? null : activePackages.Max(p => p.Price),
                IsActive = service.IsActive,
                IsHidden = service.IsHidden,
                HiddenBy = service.HiddenBy,
                HiddenByName = service.HiddenByNavigation?.FullName,
                HiddenAt = service.HiddenAt?.ToString("O"),
                CreatedAt = service.CreatedAt.ToString("O"),
                UpdatedAt = service.UpdatedAt.ToString("O"),
                PackageCount = activePackages.Count
            };
        }

        private static AdminPaymentDto MapAdminPayment(Payment payment)
        {
            return new AdminPaymentDto
            {
                PaymentId = payment.PaymentId,
                PaymentCode = payment.PaymentCode,
                BookingId = payment.BookingId,
                BookingCode = payment.Booking.BookingCode,
                CustomerId = payment.Booking.CustomerId,
                CustomerName = payment.Booking.Customer.FullName,
                CustomerEmail = payment.Booking.Customer.Email,
                StudioId = payment.Booking.StudioId,
                StudioName = payment.Booking.Studio.StudioName,
                Amount = payment.Amount,
                CurrencyCode = payment.CurrencyCode,
                PaymentMethod = payment.Method.MethodName,
                PaymentStatus = payment.PaymentStatus.StatusName,
                TransactionCode = payment.TransactionCode,
                ProviderRef = payment.ProviderRef,
                FailureReason = payment.FailureReason,
                PaidAt = payment.PaidAt?.ToString("O"),
                RefundedAt = payment.RefundedAt?.ToString("O"),
                CreatedAt = payment.CreatedAt.ToString("O"),
                UpdatedAt = payment.UpdatedAt.ToString("O")
            };
        }

        private static AdminPaymentDetailDto MapAdminPaymentDetail(Payment payment)
        {
            var summary = MapAdminPayment(payment);
            return new AdminPaymentDetailDto
            {
                PaymentId = summary.PaymentId,
                PaymentCode = summary.PaymentCode,
                BookingId = summary.BookingId,
                BookingCode = summary.BookingCode,
                CustomerId = summary.CustomerId,
                CustomerName = summary.CustomerName,
                CustomerEmail = summary.CustomerEmail,
                StudioId = summary.StudioId,
                StudioName = summary.StudioName,
                Amount = summary.Amount,
                CurrencyCode = summary.CurrencyCode,
                PaymentMethod = summary.PaymentMethod,
                PaymentStatus = summary.PaymentStatus,
                TransactionCode = summary.TransactionCode,
                ProviderRef = summary.ProviderRef,
                FailureReason = summary.FailureReason,
                PaidAt = summary.PaidAt,
                RefundedAt = summary.RefundedAt,
                CreatedAt = summary.CreatedAt,
                UpdatedAt = summary.UpdatedAt,
                BookingStatus = payment.Booking.Status.StatusName,
                ShootingDate = payment.Booking.ShootingDate.ToString("yyyy-MM-dd"),
                ShootingLocation = payment.Booking.ShootingLocation,
                PackageName = payment.Booking.Package.PackageName,
                GrossAmount = payment.Booking.TotalPrice,
                CommissionPercent = payment.Booking.CommissionPercent,
                CommissionAmount = payment.Booking.CommissionAmount,
                StudioRevenue = payment.Booking.StudioRevenue,
                RefundReason = payment.RefundReason
            };
        }

        private static AdminCommissionDto MapAdminCommission(Booking booking)
        {
            var paidPayment = booking.Payments
                .Where(p => p.PaymentStatus.StatusName == "PAID")
                .OrderByDescending(p => p.PaidAt ?? p.CreatedAt)
                .First();

            return new AdminCommissionDto
            {
                BookingId = booking.BookingId,
                BookingCode = booking.BookingCode,
                StudioId = booking.StudioId,
                StudioName = booking.Studio.StudioName,
                CustomerName = booking.Customer.FullName,
                ServiceName = booking.Package.Service.ServiceName,
                GrossAmount = booking.TotalPrice,
                CommissionPercent = booking.CommissionPercent,
                CommissionAmount = booking.CommissionAmount,
                StudioRevenue = booking.StudioRevenue,
                PaymentStatus = paidPayment.PaymentStatus.StatusName,
                BookingStatus = booking.Status.StatusName,
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
