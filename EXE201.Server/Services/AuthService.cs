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
        private readonly IEmailService _emailService;

        public AuthService(IUserRepository userRepository, IStudioRepository studioRepository, IConfiguration configuration, IEmailService emailService)
        {
            _userRepository = userRepository;
            _studioRepository = studioRepository;
            _configuration = configuration;
            _emailService = emailService;
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

            if (user == null)
            {
                return null;
            }

            if (user.Status == "UNVERIFIED")
            {
                throw new Exception("UNVERIFIED");
            }

            if (user.Status != "ACTIVE")
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
            string verificationToken = Guid.NewGuid().ToString();

            var user = new User
            {
                RoleId = role.RoleId,
                FullName = request.Name,
                Email = request.Email,
                PasswordHash = hashedPassword,
                Status = "UNVERIFIED",
                EmailVerified = false,
                VerificationToken = verificationToken,
                VerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24),
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

            // Đường dẫn kích hoạt tài khoản bằng HashRouter
            var frontendUrl = _configuration["PayOS:FrontendUrl"] ?? _configuration["SePay:FrontendBaseUrl"] ?? "http://localhost:5173";
            string verifyUrl = $"{frontendUrl}/#/verify-email?token={verificationToken}&email={Uri.EscapeDataString(request.Email)}";

            // Gửi email kích hoạt tài khoản trong luồng chạy ngầm để không chặn phản hồi HTTP
            _ = Task.Run(async () =>
            {
                try
                {
                    string verifyBody = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);'>
                            <div style='text-align: center; margin-bottom: 25px;'>
                                <h1 style='color: #4f46e5; margin: 0; font-size: 28px; font-weight: 800;'>GO! Marketplace</h1>
                                <p style='color: #64748b; font-size: 14px; margin: 5px 0 0 0;'>Nền tảng kết nối Nhiếp ảnh gia Đà Nẵng</p>
                            </div>
                            <hr style='border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;' />
                            <p style='font-size: 16px; color: #1e293b;'>Xin chào <strong>{request.Name}</strong>,</p>
                            <p style='font-size: 15px; color: #475569; line-height: 1.6;'>Chào mừng bạn đến với GO! Marketplace. Để hoàn tất đăng ký và bắt đầu trải nghiệm dịch vụ kết nối chụp ảnh hàng đầu tại Đà Nẵng, bạn vui lòng kích hoạt tài khoản của mình bằng cách nhấp vào nút bên dưới:</p>
                            <div style='text-align: center; margin: 35px 0;'>
                                <a href='{verifyUrl}' style='background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1);'>Kích hoạt tài khoản của bạn</a>
                            </div>
                            <p style='font-size: 13px; color: #4b5563;'>Liên kết này có hiệu lực trong vòng <strong>24 tiếng</strong> kể từ thời điểm đăng ký.</p>
                            <hr style='border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;' />
                            <p style='font-size: 12px; color: #94a3b8; line-height: 1.6;'>Nếu nút ở trên không hoạt động, bạn hãy copy và dán đường link sau vào trình duyệt của bạn:<br/>
                            <a href='{verifyUrl}' style='color: #4f46e5; word-break: break-all;'>{verifyUrl}</a></p>
                            <p style='font-size: 11px; color: #cbd5e1; text-align: center; margin-top: 20px;'>Email này được gửi tự động từ hệ thống GO!. Vui lòng không phản hồi trực tiếp email này.</p>
                        </div>
                    ";
                    await _emailService.SendEmailAsync(request.Email, "Xác nhận đăng ký tài khoản GO! Marketplace 📸", verifyBody);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[RegisterEmail] Failed: {ex.Message}");
                }
            });

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

        public async Task<bool> ForgotPasswordAsync(string email)
        {
            var user = await _userRepository.GetUserByEmailAsync(email);
            if (user == null)
            {
                return false;
            }

            // Tạo token an toàn
            string token = Guid.NewGuid().ToString();
            user.ResetToken = token;
            user.ResetTokenExpiresAt = DateTime.UtcNow.AddMinutes(15); // Hạn dùng 15 phút
            user.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateUserAsync(user);

            // Đường link đổi mật khẩu
            var frontendUrl = _configuration["PayOS:FrontendUrl"] ?? _configuration["SePay:FrontendBaseUrl"] ?? "http://localhost:5173";
            string resetUrl = $"{frontendUrl}/#/reset-password?token={token}&email={Uri.EscapeDataString(email)}";

            // Gửi email chứa đường dẫn khôi phục mật khẩu chuẩn ngoài đời
            _ = Task.Run(async () =>
            {
                try
                {
                    string resetBody = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);'>
                            <div style='text-align: center; margin-bottom: 25px;'>
                                <h1 style='color: #4f46e5; margin: 0; font-size: 28px; font-weight: 800;'>GO! Marketplace</h1>
                                <p style='color: #64748b; font-size: 14px; margin: 5px 0 0 0;'>Nền tảng kết nối Nhiếp ảnh gia Đà Nẵng</p>
                            </div>
                            <hr style='border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;' />
                            <p style='font-size: 16px; color: #1e293b;'>Xin chào <strong>{user.FullName}</strong>,</p>
                            <p style='font-size: 15px; color: #475569; line-height: 1.6;'>Chúng tôi nhận được yêu cầu khôi phục mật khẩu tài khoản GO! Marketplace của bạn. Hãy click vào nút bên dưới để đặt lại mật khẩu của mình. Liên kết này chỉ có thời hạn sử dụng trong <strong>15 phút</strong>.</p>
                            <div style='text-align: center; margin: 30px 0;'>
                                <a href='{resetUrl}' style='background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1);'>Đặt lại mật khẩu của bạn</a>
                            </div>
                            <p style='font-size: 13px; color: #ef4444; font-weight: bold; text-align: center;'>⚠️ Lưu ý: Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ hỗ trợ.</p>
                            <hr style='border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;' />
                            <p style='font-size: 12px; color: #94a3b8; line-height: 1.6;'>Nếu nút ở trên không hoạt động, bạn hãy copy và dán đường link sau vào trình duyệt của bạn:<br/>
                            <a href='{resetUrl}' style='color: #4f46e5; word-break: break-all;'>{resetUrl}</a></p>
                            <p style='font-size: 11px; color: #cbd5e1; text-align: center; margin-top: 20px;'>Email này được gửi tự động từ hệ thống GO!. Vui lòng không phản hồi trực tiếp email này.</p>
                        </div>
                    ";
                    await _emailService.SendEmailAsync(email, "Yêu cầu khôi phục mật khẩu trên GO! Marketplace 🔐", resetBody);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[ForgotPasswordEmail] Failed: {ex.Message}");
                }
            });

            return true;
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordRequestDto request)
        {
            var user = await _userRepository.GetUserByEmailAsync(request.Email);
            if (user == null)
            {
                return false;
            }

            if (string.IsNullOrEmpty(user.ResetToken) || user.ResetToken != request.Token)
            {
                return false;
            }

            if (!user.ResetTokenExpiresAt.HasValue || user.ResetTokenExpiresAt.Value < DateTime.UtcNow)
            {
                return false;
            }

            // Băm mật khẩu mới và làm sạch token
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.ResetToken = null;
            user.ResetTokenExpiresAt = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateUserAsync(user);
            return true;
        }

        public async Task<bool> VerifyEmailAsync(VerifyEmailRequestDto request)
        {
            var user = await _userRepository.GetUserByEmailAsync(request.Email);
            if (user == null)
            {
                return false;
            }

            if (string.IsNullOrEmpty(user.VerificationToken) || user.VerificationToken != request.Token)
            {
                return false;
            }

            if (!user.VerificationTokenExpiresAt.HasValue || user.VerificationTokenExpiresAt.Value < DateTime.UtcNow)
            {
                return false;
            }

            // Kích hoạt tài khoản thành công
            user.Status = "ACTIVE";
            user.EmailVerified = true;
            user.VerificationToken = null;
            user.VerificationTokenExpiresAt = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateUserAsync(user);
            return true;
        }
    }
}
