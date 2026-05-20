namespace EXE201.Server.DTOs
{
    public class AddressDto
    {
        public long AddressId { get; set; }
        public long UserId { get; set; }
        public string? City { get; set; }
        public string? District { get; set; }
        public string? Ward { get; set; }
        public string? AddressLine { get; set; }
        public bool IsDefault { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateAddressRequestDto
    {
        public string? City { get; set; }
        public string? District { get; set; }
        public string? Ward { get; set; }
        public string? AddressLine { get; set; }
        public bool IsDefault { get; set; }
    }

    public class UpdateAddressRequestDto
    {
        public string? City { get; set; }
        public string? District { get; set; }
        public string? Ward { get; set; }
        public string? AddressLine { get; set; }
        public bool IsDefault { get; set; }
    }
}
