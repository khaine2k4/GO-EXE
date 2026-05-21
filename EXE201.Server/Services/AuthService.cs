using exe201.Server.Models;
using EXE201.Server.Repositories;
using EXE201.Server.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Google.Apis.Auth;

namespace EXE201.Server.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IStudioRepository _studioRepository;
        private readonly IConfiguration _configuration;

        public AuthService(IUserRepository userRepository, IStudioRepository studioRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _studioRepository = studioRepository;
            _configuration = configuration;
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
                    dto.BanReason = studio.BanReason;
                }
            }

            return dto;
        }

        public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request)
        {
            var user = await _userRepository.GetUserByEmailAsync(request.Email);

            if (user == null || user.Status != "ACTIVE")
            {
                return null;
            }

            // Verify password using BCrypt with plain-text fallback
            bool isPasswordCorrect = false;
            if (user.PasswordHash.StartsWith("$2") || user.PasswordHash.Length > 30)
            {
                isPasswordCorrect = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            }
            else
            {
                isPasswordCorrect = user.PasswordHash == request.Password;
            }

            if (!isPasswordCorrect)
            {
                return null;
            }

            // Generate JWT Token
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Role, user.Role?.RoleName ?? "USER")
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            // Cập nhật LastLoginAt
            user.LastLoginAt = DateTime.UtcNow;
            await _userRepository.UpdateUserAsync(user);

            var userDto = await MapToUserDto(user);

            return new LoginResponseDto
            {
                Token = tokenString,
                User = userDto
            };
        }

        public async Task<LoginResponseDto?> GoogleLoginAsync(string credential)
        {
            // 1. Verify Google ID token
            GoogleJsonWebSignature.Payload payload;
            try
            {
                var settings = new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { _configuration["Google:ClientId"]! }
                };
                payload = await GoogleJsonWebSignature.ValidateAsync(credential, settings);
            }
            catch
            {
                return null; // Token không hợp lệ
            }

            // 2. Tìm user theo email, nếu chưa có thì tạo mới
            var user = await _userRepository.GetUserByEmailAsync(payload.Email);

            if (user == null)
            {
                // Tạo tài khoản mới với role CUSTOMER
                var role = await _userRepository.GetRoleByNameAsync("CUSTOMER");
                if (role == null) return null;

                user = new User
                {
                    RoleId = role.RoleId,
                    FullName = payload.Name ?? payload.Email,
                    Email = payload.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()), // random pw
                    Status = "ACTIVE",
                    EmailVerified = true,
                    AvatarUrl = payload.Picture ?? $"https://api.dicebear.com/7.x/initials/svg?seed={Uri.EscapeDataString(payload.Name ?? payload.Email)}&backgroundColor=6366f1",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };

                user = await _userRepository.CreateUserAsync(user);
                // Reload with role
                user = await _userRepository.GetUserByIdAsync(user.UserId) ?? user;
            }
            else if (user.Status != "ACTIVE")
            {
                return null; // Tài khoản bị khóa
            }

            // 3. Cập nhật avatar nếu Google có ảnh mới hơn
            if (!string.IsNullOrEmpty(payload.Picture) && user.AvatarUrl != payload.Picture)
            {
                user.AvatarUrl = payload.Picture;
                user.UpdatedAt = DateTime.UtcNow;
                await _userRepository.UpdateUserAsync(user);
            }

            // 4. Generate JWT
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Role, user.Role?.RoleName ?? "CUSTOMER")
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            user.LastLoginAt = DateTime.UtcNow;
            await _userRepository.UpdateUserAsync(user);

            var userDto = await MapToUserDto(user);
            return new LoginResponseDto { Token = tokenString, User = userDto };
        }

        public async Task<UserDto?> GetMeAsync(long userId)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null) return null;

            return await MapToUserDto(user);
        }

        public async Task<UserDto?> RegisterAsync(RegisterRequestDto request)
        {
            var existingUser = await _userRepository.GetUserByEmailAsync(request.Email);
            if (existingUser != null)
            {
                throw new Exception("Email đã được sử dụng.");
            }

            string roleName = request.Role == "PHOTOGRAPHER" ? "STUDIO_OWNER" : "CUSTOMER";
            var role = await _userRepository.GetRoleByNameAsync(roleName);
            if (role == null)
            {
                throw new Exception("Quyền tài khoản không hợp lệ.");
            }

            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var user = new User
            {
                RoleId = role.RoleId,
                FullName = request.Name,
                Email = request.Email,
                PasswordHash = hashedPassword,
                Status = "ACTIVE",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                AvatarUrl = $"https://api.dicebear.com/7.x/initials/svg?seed={Uri.EscapeDataString(request.Name)}&backgroundColor=6366f1"
            };

            var createdUser = await _userRepository.CreateUserAsync(user);

            if (request.Role == "PHOTOGRAPHER")
            {
                var studio = new Studio
                {
                    OwnerId = createdUser.UserId,
                    StudioName = $"{request.Name} Studio",
                    Description = request.Bio ?? "Chào mừng bạn đến với studio của tôi!",
                    City = request.Location ?? "N/A",
                    Status = "PENDING",
                    CoverUrl = "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&auto=format&fit=crop&q=80",
                    CommissionPercent = 10.0m,
                    AvgRating = 5.0m,
                    TotalReviews = 0,
                    TotalBookings = 0,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _studioRepository.CreateStudioAsync(studio);
            }

            // Reload user with roles loaded for mapping
            var reloadedUser = await _userRepository.GetUserByIdAsync(createdUser.UserId);
            if (reloadedUser == null) return null;

            return await MapToUserDto(reloadedUser);
        }

        public async Task<UserDto?> UpdateProfileAsync(long userId, UpdateProfileRequestDto request)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null) return null;

            user.FullName = request.Name;
            user.Phone = request.Phone;
            user.AvatarUrl = request.AvatarUrl;
            user.Gender = request.Gender;
            
            if (!string.IsNullOrEmpty(request.Dob))
            {
                if (DateOnly.TryParse(request.Dob, out var dobDate))
                {
                    user.Dob = dobDate;
                }
            }
            else
            {
                user.Dob = null;
            }
            
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateUserAsync(user);

            if (user.Role?.RoleName == "STUDIO_OWNER")
            {
                var studio = await _studioRepository.GetStudioByOwnerIdAsync(userId);
                if (studio != null)
                {
                    if (!string.IsNullOrEmpty(request.StudioName)) studio.StudioName = request.StudioName;
                    studio.LogoUrl = request.LogoUrl;
                    studio.Phone = request.StudioPhone;
                    studio.Email = request.StudioEmail;
                    studio.Description = request.Bio;
                    studio.City = request.City;
                    studio.District = request.District;
                    studio.AddressLine = request.AddressLine;
                    studio.CoverUrl = request.CoverUrl;
                    studio.UpdatedAt = DateTime.UtcNow;

                    await _studioRepository.UpdateStudioAsync(studio);
                }
            }

            // Reload with roles
            var reloadedUser = await _userRepository.GetUserByIdAsync(userId);
            if (reloadedUser == null) return null;

            return await MapToUserDto(reloadedUser);
        }

        public async Task<bool> ChangePasswordAsync(long userId, ChangePasswordRequestDto request)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null) return false;

            bool isCurrentPasswordCorrect = false;
            if (user.PasswordHash.StartsWith("$2") || user.PasswordHash.Length > 30)
            {
                isCurrentPasswordCorrect = BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash);
            }
            else
            {
                isCurrentPasswordCorrect = user.PasswordHash == request.CurrentPassword;
            }

            if (!isCurrentPasswordCorrect)
            {
                return false;
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateUserAsync(user);
            return true;
        }
    }
}
