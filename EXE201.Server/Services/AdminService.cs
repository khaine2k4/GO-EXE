using exe201.Server.Models;
using EXE201.Server.Repositories;
using EXE201.Server.DTOs;
using Microsoft.EntityFrameworkCore;

namespace EXE201.Server.Services
{
    public class AdminService : IAdminService
    {
        private readonly IUserRepository _userRepository;
        private readonly IStudioRepository _studioRepository;
        private readonly PhotoStudioBookingContext _context;

        public AdminService(IUserRepository userRepository, IStudioRepository studioRepository, PhotoStudioBookingContext context)
        {
            _userRepository = userRepository;
            _studioRepository = studioRepository;
            _context = context;
        }

        private async Task<UserDto> MapToUserDto(User user)
        {
            var dto = new UserDto
            {
                Id = user.UserId,
                Name = user.FullName,
                Email = user.Email,
                Role = user.Role?.RoleName,
                Status = user.Status,
                Phone = user.Phone,
                AvatarUrl = user.AvatarUrl,
                Gender = user.Gender,
                Dob = user.Dob?.ToString("yyyy-MM-dd")
            };

            if (user.Role?.RoleName == "STUDIO_OWNER")
            {
                var studio = await _studioRepository.GetStudioByOwnerIdAsync(user.UserId);
                if (studio != null)
                {
                    dto.StudioName = studio.StudioName;
                    dto.LogoUrl = studio.LogoUrl;
                    dto.StudioPhone = studio.Phone;
                    dto.StudioEmail = studio.Email;
                    dto.Bio = studio.Description;
                    dto.City = studio.City;
                    dto.District = studio.District;
                    dto.AddressLine = studio.AddressLine;
                    dto.CoverUrl = studio.CoverUrl;
                    // Đối với studio, DTO status sẽ đại diện cho trạng thái phê duyệt của studio
                    dto.Status = studio.Status;
                }
            }

            return dto;
        }

        public async Task<List<UserDto>> GetUsersAsync(string? search = null, string? status = null, string? sortBy = null, string? role = null)
        {
            var users = await _userRepository.GetAllUsersAsync();

            // Server-side search
            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.ToLower();
                users = users.Where(u =>
                    (u.FullName != null && u.FullName.ToLower().Contains(q)) ||
                    (u.Email != null && u.Email.ToLower().Contains(q))
                ).ToList();
            }

            // Status filter
            if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
                users = users.Where(u => u.Status == status).ToList();

            // Role filter
            if (!string.IsNullOrWhiteSpace(role) && role != "ALL")
                users = users.Where(u => u.Role != null && u.Role.RoleName == role).ToList();

            // Sort
            users = (sortBy ?? "name") switch
            {
                "email" => users.OrderBy(u => u.Email).ToList(),
                "status" => users.OrderBy(u => u.Status).ThenBy(u => u.FullName).ToList(),
                "name" => users.OrderBy(u => u.FullName).ToList(),
                _ => users.OrderBy(u => u.FullName).ToList(),
            };

            var dtos = new List<UserDto>();
            foreach (var u in users)
            {
                var dto = await MapToUserDto(u);
                dtos.Add(dto);
            }
            return dtos;
        }

        public async Task<bool> UpdateUserStatusAsync(long userId, string status, long adminId)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null) return false;

            user.Status = status; // "ACTIVE" or "LOCKED"
            user.UpdatedBy = adminId;
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateUserAsync(user);
            return true;
        }

        public async Task<bool> UpdateUserRoleAsync(long userId, string roleName, long adminId)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null) return false;

            var role = await _userRepository.GetRoleByNameAsync(roleName);
            if (role == null) return false;

            user.RoleId = role.RoleId;
            user.UpdatedBy = adminId;
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateUserAsync(user);
            return true;
        }

        public async Task<List<UserDto>> GetStudiosAsync(string? search = null, string? status = null, string? sortBy = null)
        {
            var studios = await _studioRepository.GetAllStudiosAsync();

            // Server-side search
            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.ToLower();
                studios = studios.Where(s =>
                    (s.StudioName != null && s.StudioName.ToLower().Contains(q)) ||
                    (s.City != null && s.City.ToLower().Contains(q)) ||
                    (s.Description != null && s.Description.ToLower().Contains(q))
                ).ToList();
            }

            // Status filter
            if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
                studios = studios.Where(s => s.Status == status).ToList();

            // Sort
            studios = (sortBy ?? "name") switch
            {
                "rating" => studios.OrderByDescending(s => s.AvgRating).ToList(),
                "name" => studios.OrderBy(s => s.StudioName).ToList(),
                _ => studios.OrderBy(s => s.StudioName).ToList(),
            };

            var dtos = new List<UserDto>();
            foreach (var s in studios)
            {
                var owner = s.Owner ?? await _userRepository.GetUserByIdAsync(s.OwnerId);
                if (owner == null) continue;

                var dto = new UserDto
                {
                    Id = owner.UserId,
                    Name = owner.FullName,
                    Email = owner.Email,
                    Role = owner.Role?.RoleName ?? "STUDIO_OWNER",
                    Status = s.Status,
                    Phone = owner.Phone,
                    AvatarUrl = owner.AvatarUrl,
                    Gender = owner.Gender,
                    Dob = owner.Dob?.ToString("yyyy-MM-dd"),
                    StudioName = s.StudioName,
                    LogoUrl = s.LogoUrl,
                    StudioPhone = s.Phone,
                    StudioEmail = s.Email,
                    Bio = s.Description,
                    City = s.City,
                    District = s.District,
                    AddressLine = s.AddressLine,
                    CoverUrl = s.CoverUrl
                };
                dtos.Add(dto);
            }
            return dtos;
        }

        public async Task<bool> ApproveStudioAsync(long studioId, long adminId)
        {
            var studio = await _studioRepository.GetStudioByIdAsync(studioId) 
                         ?? await _studioRepository.GetStudioByOwnerIdAsync(studioId);
            if (studio == null) return false;

            studio.Status = "APPROVED";
            studio.ApprovedBy = adminId;
            studio.ApprovedAt = DateTime.UtcNow;
            studio.UpdatedAt = DateTime.UtcNow;
            studio.UpdatedBy = adminId;

            await _studioRepository.UpdateStudioAsync(studio);
            return true;
        }

        public async Task<bool> RejectStudioAsync(long studioId, string reason, long adminId)
        {
            var studio = await _studioRepository.GetStudioByIdAsync(studioId)
                         ?? await _studioRepository.GetStudioByOwnerIdAsync(studioId);
            if (studio == null) return false;

            studio.Status = "REJECTED";
            studio.RejectionReason = reason;
            studio.RejectedBy = adminId;
            studio.RejectedAt = DateTime.UtcNow;
            studio.UpdatedAt = DateTime.UtcNow;
            studio.UpdatedBy = adminId;

            await _studioRepository.UpdateStudioAsync(studio);
            return true;
        }

        public async Task<List<AdminBookingDto>> GetBookingsAsync(string? search = null, string? status = null, string? paymentStatus = null, string? sortBy = null)
        {
            var query = _context.Bookings
                .Include(b => b.Customer)
                .Include(b => b.Studio)
                .Include(b => b.Package)
                .Include(b => b.Status)
                .Include(b => b.Payments).ThenInclude(p => p.PaymentStatus)
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
                query = query.Where(b => b.Status.StatusName == status);

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
                Status = b.Status.StatusName,
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

        public async Task<bool> BanStudioAsync(long studioId, string reason, long adminId)
        {
            var studio = await _studioRepository.GetStudioByIdAsync(studioId)
                         ?? await _studioRepository.GetStudioByOwnerIdAsync(studioId);
            if (studio == null) return false;

            studio.Status = "BANNED";
            studio.BannedBy = adminId;
            studio.BannedAt = DateTime.UtcNow;
            studio.BanReason = reason;
            studio.UpdatedAt = DateTime.UtcNow;
            studio.UpdatedBy = adminId;

            await _studioRepository.UpdateStudioAsync(studio);
            return true;
        }

        public async Task<bool> UnbanStudioAsync(long studioId, long adminId)
        {
            var studio = await _studioRepository.GetStudioByIdAsync(studioId)
                         ?? await _studioRepository.GetStudioByOwnerIdAsync(studioId);
            if (studio == null) return false;

            studio.Status = "APPROVED";
            studio.BannedBy = null;
            studio.BannedAt = null;
            studio.BanReason = null;
            studio.UpdatedAt = DateTime.UtcNow;
            studio.UpdatedBy = adminId;

            await _studioRepository.UpdateStudioAsync(studio);
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
            {
                query = query.Where(r => r.IsHidden == isHidden.Value);
            }

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
    }
}
