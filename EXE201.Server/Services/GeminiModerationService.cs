using Microsoft.Extensions.Configuration;
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace EXE201.Server.Services
{
    public class GeminiModerationService : IGeminiModerationService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public GeminiModerationService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Gemini:ApiKey"] ?? throw new ArgumentNullException("Gemini:ApiKey is not configured.");
        }

        public async Task<(bool IsViolated, string Reason)> ModerateMessageAsync(string content)
        {
            if (string.IsNullOrWhiteSpace(content))
            {
                return (false, string.Empty);
            }

            try
            {
                var systemPrompt = @"Bạn là hệ thống kiểm duyệt tin nhắn tự động của sàn thương mại điện tử nhiếp ảnh GO!. 
Mục tiêu duy nhất của bạn là ngăn chặn người dùng (khách hàng hoặc nhiếp ảnh gia) tìm cách trao đổi thông tin liên hệ riêng hoặc giao dịch trực tiếp bên ngoài hệ thống để tránh phí sàn (platform leakage / bypass).

Hãy phân tích tin nhắn sau đây và xác định xem người dùng có đang vi phạm các quy định sau không:
1. Chia sẻ thông tin liên hệ cá nhân: số điện thoại, số Zalo, link Facebook/Instagram/Telegram, email, hoặc số tài khoản ngân hàng.
2. Đề xuất hoặc gợi ý giao dịch ngoài hệ thống: thanh toán chuyển khoản trực tiếp, giao dịch tiền mặt riêng, book lịch trực tiếp bên ngoài, hoặc dùng các cụm từ ẩn ý giao dịch riêng (ví dụ: 'gặp riêng', 'bank trực tiếp', 'ck ngoài', 'giao dịch ngoài', v.v.).

Bạn PHẢI trả về kết quả dưới định dạng JSON chính xác như sau và không chứa thêm bất kỳ văn bản nào khác:
{
  ""isViolated"": true hoặc false (boolean),
  ""reason"": ""Giải thích ngắn gọn lý do vi phạm bằng tiếng Việt, ví dụ: 'Phát hiện số điện thoại và đề xuất giao dịch ngoài hệ thống' hoặc để trống nếu không vi phạm""
}";

                var requestBody = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new[]
                            {
                                new { text = $"{systemPrompt}\n\nTin nhắn cần kiểm duyệt: \"{content}\"" }
                            }
                        }
                    },
                    generationConfig = new
                    {
                        responseMimeType = "application/json"
                    }
                };

                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={_apiKey}";
                var jsonRequest = JsonSerializer.Serialize(requestBody);
                var httpContent = new StringContent(jsonRequest, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(url, httpContent);
                if (!response.IsSuccessStatusCode)
                {
                    // Nếu lỗi API Gemini, cho phép đi qua để tránh ảnh hưởng tới trải nghiệm người dùng
                    return (false, string.Empty);
                }

                var jsonResponse = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(jsonResponse);
                var root = doc.RootElement;
                
                // Lấy nội dung text JSON từ cấu trúc phản hồi của Gemini
                var textResponse = root
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                if (string.IsNullOrWhiteSpace(textResponse))
                {
                    return (false, string.Empty);
                }

                var moderationResult = JsonSerializer.Deserialize<GeminiModerationResult>(textResponse, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (moderationResult != null)
                {
                    return (moderationResult.IsViolated, moderationResult.Reason);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GeminiModeration] Error: {ex.Message}");
            }

            return (false, string.Empty);
        }

        private class GeminiModerationResult
        {
            [JsonPropertyName("isViolated")]
            public bool IsViolated { get; set; }

            [JsonPropertyName("reason")]
            public string Reason { get; set; } = string.Empty;
        }
    }
}
