using exe201.Server.Models;
using EXE201.Server.DTOs;
using EXE201.Server.Repositories;

namespace EXE201.Server.Services
{
    public class AdminService : IAdminService
    {
        private readonly IUserRepository _userRepository;
        private readonly IStudioRepository _studioRepository;
        private readonly IAdminRepository _adminRepository;

        public AdminService(
            IUserRepository userRepository,
            IStudioRepository studioRepository,
            IAdminRepository adminRepository)
        {
            _userRepository = userRepository;
            _studioRepository = studioRepository;
            _adminRepository = adminRepository;
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
                    dto.StudioStatus = studio.Status;
                }
            }

            return dto;
        }

        public async Task<List<UserDto>> GetUsersAsync(string? search = null, string? status = null, string? sortBy = null, string? role = null)
        {
            var users = await _userRepository.GetAllUsersAsync();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.ToLower();
                users = users.Where(u =>
                    (u.FullName != null && u.FullName.ToLower().Contains(q)) ||
                    (u.Email != null && u.Email.ToLower().Contains(q))
                ).ToList();
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
                users = users.Where(u => u.Status == status).ToList();

            if (!string.IsNullOrWhiteSpace(role) && role != "ALL")
                users = users.Where(u => u.Role != null && u.Role.RoleName == role).ToList();

            users = (sortBy ?? "name") switch
            {
                "email" => users.OrderBy(u => u.Email).ToList(),
                "status" => users.OrderBy(u => u.Status).ThenBy(u => u.FullName).ToList(),
                "name" => users.OrderBy(u => u.FullName).ToList(),
                _ => users.OrderBy(u => u.FullName).ToList(),
            };

            var dtos = new List<UserDto>();
            foreach (var user in users)
            {
                dtos.Add(await MapToUserDto(user));
            }

            return dtos;
        }

        public async Task<bool> UpdateUserStatusAsync(long userId, string status, long adminId)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null) return false;

            user.Status = status;
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

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.ToLower();
                studios = studios.Where(s =>
                    (s.StudioName != null && s.StudioName.ToLower().Contains(q)) ||
                    (s.City != null && s.City.ToLower().Contains(q)) ||
                    (s.Description != null && s.Description.ToLower().Contains(q))
                ).ToList();
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
                studios = studios.Where(s => s.Status == status).ToList();

            studios = (sortBy ?? "name") switch
            {
                "rating" => studios.OrderByDescending(s => s.AvgRating).ToList(),
                "name" => studios.OrderBy(s => s.StudioName).ToList(),
                _ => studios.OrderBy(s => s.StudioName).ToList(),
            };

            var dtos = new List<UserDto>();
            foreach (var studio in studios)
            {
                var owner = studio.Owner ?? await _userRepository.GetUserByIdAsync(studio.OwnerId);
                if (owner == null) continue;

                dtos.Add(new UserDto
                {
                    Id = owner.UserId,
                    Name = owner.FullName,
                    Email = owner.Email,
                    Role = owner.Role?.RoleName ?? "STUDIO_OWNER",
                    Status = studio.Status,
                    Phone = owner.Phone,
                    AvatarUrl = owner.AvatarUrl,
                    Gender = owner.Gender,
                    Dob = owner.Dob?.ToString("yyyy-MM-dd"),
                    StudioName = studio.StudioName,
                    LogoUrl = studio.LogoUrl,
                    StudioPhone = studio.Phone,
                    StudioEmail = studio.Email,
                    Bio = studio.Description,
                    City = studio.City,
                    District = studio.District,
                    AddressLine = studio.AddressLine,
                    CoverUrl = studio.CoverUrl
                });
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

        public Task<List<AdminBookingDto>> GetBookingsAsync(string? search = null, string? status = null, string? paymentStatus = null, string? sortBy = null)
            => _adminRepository.GetBookingsAsync(search, status, paymentStatus, sortBy);

        public Task<List<AdminReportDto>> GetReportsAsync(string? search = null, string? status = null, string? targetType = null, string? sortBy = null)
            => _adminRepository.GetReportsAsync(search, status, targetType, sortBy);

        public Task<bool> ResolveReportAsync(long reportId, string status, string? handlerNote, long adminId)
            => _adminRepository.ResolveReportAsync(reportId, status, handlerNote, adminId);

        public Task<List<AdminReviewDto>> GetReviewsAsync(string? search = null, bool? isHidden = null)
            => _adminRepository.GetReviewsAsync(search, isHidden);

        public Task<bool> ToggleHideReviewAsync(long reviewId, bool isHidden, string? note, long adminId)
            => _adminRepository.ToggleHideReviewAsync(reviewId, isHidden, note, adminId);

        public Task<List<AdminServiceDto>> GetServicesAsync(string? search = null, string? status = null, long? categoryId = null, long? studioId = null, bool? isHidden = null, string? sortBy = null)
            => _adminRepository.GetServicesAsync(search, status, categoryId, studioId, isHidden, sortBy);

        public Task<AdminServiceDto?> HideServiceAsync(long serviceId, long adminId, string? reason = null)
            => _adminRepository.HideServiceAsync(serviceId, adminId, reason);

        public Task<AdminServiceDto?> UnhideServiceAsync(long serviceId, long adminId)
            => _adminRepository.UnhideServiceAsync(serviceId, adminId);

        public Task<AdminServiceDto?> SoftDeleteServiceAsync(long serviceId, long adminId, string? reason = null)
            => _adminRepository.SoftDeleteServiceAsync(serviceId, adminId, reason);

        public Task<List<AdminPaymentDto>> GetPaymentsAsync(string? search = null, string? status = null, string? method = null, long? studioId = null, DateTime? from = null, DateTime? to = null, string? sortBy = null)
            => _adminRepository.GetPaymentsAsync(search, status, method, studioId, from, to, sortBy);

        public Task<AdminPaymentDetailDto?> GetPaymentDetailAsync(long paymentId)
            => _adminRepository.GetPaymentDetailAsync(paymentId);

        public Task<AdminPaymentDetailDto?> UpdatePaymentStatusAsync(long paymentId, UpdateAdminPaymentStatusRequestDto request, long adminId)
            => _adminRepository.UpdatePaymentStatusAsync(paymentId, request, adminId);

        public Task<AdminRevenueSummaryDto> GetRevenueSummaryAsync(DateTime? from = null, DateTime? to = null)
            => _adminRepository.GetRevenueSummaryAsync(from, to);

        public Task<List<AdminMonthlyRevenueDto>> GetMonthlyRevenueAsync(DateTime? from = null, DateTime? to = null)
            => _adminRepository.GetMonthlyRevenueAsync(from, to);

        public Task<List<AdminCommissionDto>> GetCommissionsAsync(long? studioId = null, string? search = null, DateTime? from = null, DateTime? to = null, string? sortBy = null)
            => _adminRepository.GetCommissionsAsync(studioId, search, from, to, sortBy);

        public Task<List<SettlementDto>> GetSettlementsAsync(string? status = null, long? studioId = null, string? search = null, string? sortBy = null)
            => _adminRepository.GetSettlementsAsync(status, studioId, search, sortBy);

        public Task<SettlementDto?> MarkSettlementPaidAsync(long settlementId, SettlementPayoutRequestDto request, long adminId)
            => _adminRepository.MarkSettlementPaidAsync(settlementId, request.PayoutMethod);
    }
}
