using System.Security.Cryptography;
using System.Text;

namespace EXE201.Server.Services
{
    public interface ICloudinaryService
    {
        CloudinarySignatureResponse GenerateSignature(string? folder);
    }

    public class CloudinarySignatureResponse
    {
        public long Timestamp { get; set; }
        public string Signature { get; set; } = null!;
        public string ApiKey { get; set; } = null!;
        public string CloudName { get; set; } = null!;
        public string? Folder { get; set; }
    }

    public class CloudinaryService : ICloudinaryService
    {
        private readonly IConfiguration _configuration;

        public CloudinaryService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public CloudinarySignatureResponse GenerateSignature(string? folder)
        {
            var cloudName = _configuration["Cloudinary:CloudName"]!;
            var apiKey = _configuration["Cloudinary:ApiKey"]!;
            var apiSecret = _configuration["Cloudinary:ApiSecret"]!;

            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            // Build the string to sign - parameters must be sorted alphabetically
            var paramsToSign = new SortedDictionary<string, string>
            {
                { "timestamp", timestamp.ToString() }
            };

            if (!string.IsNullOrWhiteSpace(folder))
            {
                paramsToSign["folder"] = folder;
            }

            var stringToSign = string.Join("&", paramsToSign.Select(kvp => $"{kvp.Key}={kvp.Value}"));
            stringToSign += apiSecret;

            // Generate SHA-1 signature
            using var sha1 = SHA1.Create();
            var hash = sha1.ComputeHash(Encoding.UTF8.GetBytes(stringToSign));
            var signature = BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();

            return new CloudinarySignatureResponse
            {
                Timestamp = timestamp,
                Signature = signature,
                ApiKey = apiKey,
                CloudName = cloudName,
                Folder = folder
            };
        }
    }
}
