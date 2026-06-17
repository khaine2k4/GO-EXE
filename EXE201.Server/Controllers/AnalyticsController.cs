using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using exe201.Server.Models;
using EXE201.Server.DTOs;
using System.Security.Claims;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly PhotoStudioBookingContext _context;

        public AnalyticsController(PhotoStudioBookingContext context)
        {
            _context = context;
        }

        /// <summary>
        /// POST /api/analytics/track — Record a page view (public, no auth required).
        /// </summary>
        [HttpPost("track")]
        [AllowAnonymous]
        public async Task<IActionResult> TrackPageView([FromBody] TrackPageViewRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.PagePath) || string.IsNullOrWhiteSpace(request.SessionId))
                return BadRequest("PagePath and SessionId are required.");

            // Optionally extract user id from JWT if authenticated
            long? userId = null;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && long.TryParse(userIdClaim.Value, out var parsedId))
                userId = parsedId;

            var pageView = new PageView
            {
                PagePath = request.PagePath.Length > 500 ? request.PagePath[..500] : request.PagePath,
                UserId = userId,
                SessionId = request.SessionId.Length > 100 ? request.SessionId[..100] : request.SessionId,
                UserAgent = Request.Headers.UserAgent.ToString().Length > 500
                    ? Request.Headers.UserAgent.ToString()[..500]
                    : Request.Headers.UserAgent.ToString(),
                Referrer = request.Referrer?.Length > 500 ? request.Referrer[..500] : request.Referrer,
                CreatedAt = DateTime.UtcNow
            };

            _context.PageViews.Add(pageView);
            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        /// <summary>
        /// GET /api/analytics/stats — Return analytics stats (Admin only).
        /// </summary>
        [HttpGet("stats")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> GetAnalyticsStats([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var now = DateTime.UtcNow;
                var todayStart = now.Date;
                var weekStart = now.Date.AddDays(-6);
                var rangeStart = (startDate?.Date ?? now.Date.AddDays(-29));
                var rangeEnd = (endDate?.Date ?? now.Date).AddDays(1);
                if (rangeStart >= rangeEnd)
                {
                    return BadRequest("startDate must be before or equal to endDate.");
                }
                var excludedAnalyticsPaths = new[] { "/login", "/register", "/reset-password", "/verify-email" };

                // ── Page view counts ──
                var trackedPageViews = _context.PageViews
                    .Where(p =>
                        !excludedAnalyticsPaths.Contains(p.PagePath) &&
                        (p.UserId == null || p.User!.Role.RoleName != "ADMIN"));
                var rangePageViews = trackedPageViews.Where(p => p.CreatedAt >= rangeStart && p.CreatedAt < rangeEnd);

                var todayViews = await trackedPageViews.CountAsync(p => p.CreatedAt >= todayStart);
                var weekViews = await trackedPageViews.CountAsync(p => p.CreatedAt >= weekStart);
                var monthViews = await rangePageViews.CountAsync();
                var allTimeViews = await trackedPageViews.CountAsync();

                var todayUnique = await trackedPageViews.Where(p => p.CreatedAt >= todayStart).Select(p => p.SessionId).Distinct().CountAsync();
                var weekUnique = await trackedPageViews.Where(p => p.CreatedAt >= weekStart).Select(p => p.SessionId).Distinct().CountAsync();
                var monthUnique = await rangePageViews.Select(p => p.SessionId).Distinct().CountAsync();
                var allTimeUnique = await trackedPageViews.Select(p => p.SessionId).Distinct().CountAsync();

                var guestViews = rangePageViews.Where(p => p.UserId == null);
                var customerViews = rangePageViews.Where(p =>
                    p.UserId != null &&
                    (p.User!.Role.RoleName == "CUSTOMER" || p.User.Role.RoleName == "USER"));
                var photographerViews = rangePageViews.Where(p =>
                    p.UserId != null &&
                    (p.User!.Role.RoleName == "PHOTOGRAPHER" || p.User.Role.RoleName == "STUDIO_OWNER"));
                var monthPotentialCustomerVisitors = await rangePageViews
                    .Where(p =>
                        p.UserId == null ||
                        p.User!.Role.RoleName == "CUSTOMER" ||
                        p.User.Role.RoleName == "USER")
                    .Select(p => p.SessionId)
                    .Distinct()
                    .CountAsync();
                var visitorSegments = new List<VisitorSegmentDto>
                {
                    new()
                    {
                        Segment = "guest",
                        Label = "Khách vãng lai",
                        Views = await guestViews.CountAsync(),
                        UniqueVisitors = await guestViews.Select(p => p.SessionId).Distinct().CountAsync()
                    },
                    new()
                    {
                        Segment = "customer",
                        Label = "Customer",
                        Views = await customerViews.CountAsync(),
                        UniqueVisitors = await customerViews.Select(p => p.SessionId).Distinct().CountAsync()
                    },
                    new()
                    {
                        Segment = "photographer",
                        Label = "Photographer",
                        Views = await photographerViews.CountAsync(),
                        UniqueVisitors = await photographerViews.Select(p => p.SessionId).Distinct().CountAsync()
                    }
                };

                var totalUsers = await _context.Users.CountAsync(u => u.Status == "ACTIVE" && u.Role.RoleName != "ADMIN");

                var dailyViewRows = await trackedPageViews
                    .Where(p => p.CreatedAt >= rangeStart && p.CreatedAt < rangeEnd)
                    .GroupBy(p => p.CreatedAt.Date)
                    .Select(g => new
                    {
                        Date = g.Key,
                        Views = g.Count(),
                        UniqueVisitors = g.Select(x => x.SessionId).Distinct().Count()
                    })
                    .OrderBy(d => d.Date)
                    .ToListAsync();

                var dailyViews = dailyViewRows
                    .Select(d => new DailyViewDto
                    {
                        Date = d.Date.ToString("yyyy-MM-dd"),
                        Views = d.Views,
                        UniqueVisitors = d.UniqueVisitors
                    })
                    .ToList();

                var filledDaily = new List<DailyViewDto>();
                for (var dateCursor = rangeStart; dateCursor < rangeEnd; dateCursor = dateCursor.AddDays(1))
                {
                    var date = dateCursor.ToString("yyyy-MM-dd");
                    var existing = dailyViews.FirstOrDefault(d => d.Date == date);
                    filledDaily.Add(existing ?? new DailyViewDto { Date = date, Views = 0, UniqueVisitors = 0 });
                }

                var topPages = await trackedPageViews
                    .Where(p => p.CreatedAt >= rangeStart && p.CreatedAt < rangeEnd)
                    .GroupBy(p => p.PagePath)
                    .Select(g => new TopPageDto
                    {
                        PagePath = g.Key,
                        Views = g.Count(),
                        UniqueVisitors = g.Select(x => x.SessionId).Distinct().Count()
                    })
                    .OrderByDescending(t => t.Views)
                    .Take(10)
                    .ToListAsync();

                var firstDayOfMonth = new DateTime(rangeStart.Year, rangeStart.Month, 1);
                var lastDayMonth = new DateTime(rangeEnd.AddDays(-1).Year, rangeEnd.AddDays(-1).Month, 1);

                var monthlyNewUsers = await _context.Users
                    .Where(u => u.CreatedAt >= firstDayOfMonth && u.CreatedAt < rangeEnd && u.Role.RoleName != "ADMIN")
                    .GroupBy(u => new { u.CreatedAt.Year, u.CreatedAt.Month })
                    .Select(g => new { g.Key.Year, g.Key.Month, Count = g.Count() })
                    .OrderBy(g => g.Year).ThenBy(g => g.Month)
                    .ToListAsync();

                var totalUsersBefore = await _context.Users
                    .CountAsync(u => u.CreatedAt < firstDayOfMonth && u.Role.RoleName != "ADMIN");

                var userGrowth = new List<MonthlyUserGrowthDto>();
                var cumulative = totalUsersBefore;

                for (var targetDate = firstDayOfMonth; targetDate <= lastDayMonth; targetDate = targetDate.AddMonths(1))
                {
                    var monthData = monthlyNewUsers.FirstOrDefault(m => m.Year == targetDate.Year && m.Month == targetDate.Month);
                    var newUsers = monthData?.Count ?? 0;
                    cumulative += newUsers;

                    userGrowth.Add(new MonthlyUserGrowthDto
                    {
                        Year = targetDate.Year,
                        Month = targetDate.Month,
                        NewUsers = newUsers,
                        CumulativeUsers = cumulative
                    });
                }
                return Ok(new AnalyticsStatsResponse
                {
                    TodayViews = todayViews,
                    WeekViews = weekViews,
                    MonthViews = monthViews,
                    AllTimeViews = allTimeViews,
                    TodayUniqueVisitors = todayUnique,
                    WeekUniqueVisitors = weekUnique,
                    MonthUniqueVisitors = monthUnique,
                    AllTimeUniqueVisitors = allTimeUnique,
                    MonthPotentialCustomerVisitors = monthPotentialCustomerVisitors,
                    TotalRegisteredUsers = totalUsers,
                    DailyViews = filledDaily,
                    TopPages = topPages,
                    VisitorSegments = visitorSegments,
                    UserGrowth = userGrowth
                });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
