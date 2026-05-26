using Microsoft.Extensions.Configuration;
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace EXE201.Server.Services
{
    public class GeminiModerationService : IGeminiModerationService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;
        private static readonly Regex PhoneRegex = new(@"(?<!\d)(?:\+?84|0)(?:[\s.\-]?\d){8,10}(?!\d)", RegexOptions.Compiled);
        private static readonly Regex EmailRegex = new(@"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", RegexOptions.Compiled);
        private static readonly Regex LinkRegex = new(@"(https?:\/\/|www\.|facebook\.com|fb\.com|zalo\.me|t\.me|telegram\.me|instagram\.com|messenger\.com)", RegexOptions.Compiled | RegexOptions.IgnoreCase);
        private static readonly Regex NonLatinScriptRegex = new(@"[\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7F\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF]", RegexOptions.Compiled);
        private static readonly string[] BlockedKeywords =
        {
            "zalo",
            "facebook",
            "fb",
            "zl",
            "telegram",
            "messenger",
            "instagram",
            "số điện thoại",
            "sdt",
            "sđt",
            "phone",
            "gmail",
            "chuyển khoản riêng",
            "chuyen khoan rieng",
            "ck ngoài",
            "ck ngoai",
            "bank ngoài",
            "bank ngoai",
            "thanh toán riêng",
            "thanh toan rieng",
            "giao dịch ngoài",
            "giao dich ngoai",
            "book riêng",
            "book rieng",
            "gặp riêng",
            "gap rieng"
        };
        private static readonly string[] SuspiciousKeywords =
        {
            "liên hệ",
            "lien he",
            "ở ngoài",
            "o ngoai",
            "bên ngoài",
            "ben ngoai",
            "riêng",
            "rieng",
            "tiền mặt",
            "tien mat",
            "chuyển khoản",
            "chuyen khoan",
            "ngân hàng",
            "ngan hang",
            "bank"
        };

        public GeminiModerationService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Gemini:ApiKey"] ?? throw new ArgumentNullException("Gemini:ApiKey is not configured.");
            _model = configuration["Gemini:Model"] ?? "gemini-3.1-flash-lite";

        }

        public async Task<(bool IsViolated, string Reason)> ModerateMessageAsync(string content, bool throwOnError = false)
        {
            if (string.IsNullOrWhiteSpace(content))
            {
                return (false, string.Empty);
            }

            var ruleResult = CheckLocalRules(content);
            if (ruleResult.IsViolated)
            {
                Console.WriteLine($"[GeminiModeration] Blocked by local rule | Reason={ruleResult.Reason} | Length={content.Length} | Time={DateTime.UtcNow:O}");
                return ruleResult;
            }

            if (!ShouldUseGemini(content))
            {
                Console.WriteLine($"[GeminiModeration] Allowed by local rules, skipped Gemini | Length={content.Length} | Time={DateTime.UtcNow:O}");
                return (false, string.Empty);
            }

            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                if (throwOnError)
                {
                    throw new InvalidOperationException("Gemini:ApiKey is not configured.");
                }

                Console.WriteLine($"[GeminiModeration] Gemini skipped because ApiKey is not configured | Length={content.Length} | Time={DateTime.UtcNow:O}");
                return (false, string.Empty);
            }

            try
            {
                Console.WriteLine($"[GeminiModeration] Gemini called | Action=ModerateMessage | Model={_model} | Length={content.Length} | Time={DateTime.UtcNow:O}");
                var systemPrompt = @"Bạn là hệ thống kiểm duyệt tin nhắn tự động của sàn thương mại điện tử nhiếp ảnh GO!. 
Mục tiêu duy nhất của bạn là ngăn chặn người dùng (khách hàng hoặc nhiếp ảnh gia) tìm cách trao đổi thông tin liên hệ riêng hoặc giao dịch trực tiếp bên ngoài hệ thống để tránh phí sàn (platform leakage / bypass).

BẤT KỲ TIN NHẮN NÀO CHỨA SỐ ĐIỆN THOẠI, ZALO, FACEBOOK, TELEGRAM, EMAIL HOẶC ĐỀ XUẤT CHUYỂN KHOẢN NGOÀI, THANH TOÁN RIÊNG ĐỀU PHẢI BỊ COI LÀ VI PHẠM 100%.

Hãy phân tích tin nhắn sau đây và xác định xem người dùng có đang vi phạm các quy định sau không:
1. Chia sẻ thông tin liên hệ cá nhân: số điện thoại, số Zalo, link Facebook/Instagram/Telegram, email, hoặc số tài khoản ngân hàng.
2. Đề xuất hoặc gợi ý giao dịch ngoài hệ thống: thanh toán chuyển khoản trực tiếp, giao dịch tiền mặt riêng, book lịch trực tiếp bên ngoài, hoặc dùng các cụm từ ẩn ý giao dịch riêng (ví dụ: 'gặp riêng', 'bank trực tiếp', 'ck ngoài', 'giao dịch ngoài', 'sđt', v.v.).

Bạn PHẢI trả về kết quả dưới định dạng JSON chính xác như sau và không chứa thêm bất kỳ văn bản nào khác:
{
  ""isViolated"": true hoặc false (phải là kiểu dữ liệu boolean, không nằm trong dấu ngoặc kép),
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

                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";
                var jsonRequest = JsonSerializer.Serialize(requestBody);
                var httpContent = new StringContent(jsonRequest, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(url, httpContent);
                var jsonResponse = await response.Content.ReadAsStringAsync();
                
                Console.WriteLine($"[GeminiModeration] Status: {response.StatusCode}");
                Console.WriteLine($"[GeminiModeration] Response: {jsonResponse}");

                if (!response.IsSuccessStatusCode)
                {
                    if (throwOnError)
                    {
                        throw new System.Net.Http.HttpRequestException($"Gemini API returned {response.StatusCode}: {jsonResponse}");
                    }
                    // Nếu lỗi API Gemini, cho phép đi qua để tránh ảnh hưởng tới trải nghiệm người dùng
                    return (false, string.Empty);
                }

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

                using var parsedTextDoc = JsonDocument.Parse(textResponse);
                var textRoot = parsedTextDoc.RootElement;
                
                bool isViolated = false;
                if (textRoot.TryGetProperty("isViolated", out var isViolatedProp))
                {
                    if (isViolatedProp.ValueKind == JsonValueKind.True)
                    {
                        isViolated = true;
                    }
                    else if (isViolatedProp.ValueKind == JsonValueKind.False)
                    {
                        isViolated = false;
                    }
                    else if (isViolatedProp.ValueKind == JsonValueKind.String)
                    {
                        var strVal = isViolatedProp.GetString()?.ToLowerInvariant();
                        isViolated = strVal == "true" || strVal == "yes" || strVal == "1";
                    }
                }

                string reason = string.Empty;
                if (textRoot.TryGetProperty("reason", out var reasonProp))
                {
                    reason = reasonProp.GetString() ?? string.Empty;
                }

                return (isViolated, reason);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GeminiModeration] Error: {ex.Message}");
            }

            return (false, string.Empty);
        }

        private static bool ShouldUseGemini(string content)
        {
            var normalized = content.Trim().ToLowerInvariant();
            if (normalized.Length >= 200)
            {
                return true;
            }

            if (NonLatinScriptRegex.IsMatch(content))
            {
                return true;
            }

            return SuspiciousKeywords.Any(keyword => normalized.Contains(keyword));
        }

        private static (bool IsViolated, string Reason) CheckLocalRules(string content)
        {
            var normalized = content.Trim().ToLowerInvariant();

            if (PhoneRegex.IsMatch(content))
            {
                return (true, "Phát hiện số điện thoại.");
            }

            if (EmailRegex.IsMatch(content))
            {
                return (true, "Phát hiện email.");
            }

            if (LinkRegex.IsMatch(content))
            {
                return (true, "Phát hiện link hoặc tài khoản mạng xã hội.");
            }

            foreach (var keyword in BlockedKeywords)
            {
                if (normalized.Contains(keyword))
                {
                    return (true, "Phát hiện thông tin liên hệ hoặc giao dịch ngoài hệ thống.");
                }
            }

            return (false, string.Empty);
        }
    }
}



