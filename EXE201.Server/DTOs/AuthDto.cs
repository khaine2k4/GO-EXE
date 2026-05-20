namespace EXE201.Server.DTOs
{
    public class LoginRequestDto
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }

    public class LoginResponseDto
    {
        public string Token { get; set; } = null!;
        public UserDto User { get; set; } = null!;
    }

    public class UserDto
    {
        public long Id { get; set; }
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? Role { get; set; }
        public string Status { get; set; } = null!;
        public string? Phone { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Gender { get; set; }
        public string? Dob { get; set; }
        // Studio specific
        public string? StudioName { get; set; }
        public string? LogoUrl { get; set; }
        public string? StudioPhone { get; set; }
        public string? StudioEmail { get; set; }
        public string? Bio { get; set; }
        public string? City { get; set; }
        public string? District { get; set; }
        public string? AddressLine { get; set; }
        public string? CoverUrl { get; set; }
    }

    public class RegisterRequestDto
    {
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string Role { get; set; } = null!; // USER hoặc PHOTOGRAPHER
        public string? Bio { get; set; }
        public string? Location { get; set; }
    }

    public class UpdateProfileRequestDto
    {
        public string Name { get; set; } = null!;
        public string? Phone { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Gender { get; set; }
        public string? Dob { get; set; } // Định dạng YYYY-MM-DD
        // Studio specific (optional)
        public string? StudioName { get; set; }
        public string? LogoUrl { get; set; }
        public string? StudioPhone { get; set; }
        public string? StudioEmail { get; set; }
        public string? Bio { get; set; }
        public string? City { get; set; }
        public string? District { get; set; }
        public string? AddressLine { get; set; }
        public string? CoverUrl { get; set; }
    }

    public class ChangePasswordRequestDto
    {
        public string CurrentPassword { get; set; } = null!;
        public string NewPassword { get; set; } = null!;
    }
}
