using EXE201.Server.DTOs;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace EXE201.Server.Services
{
    public class GeminiChatbotService : IGeminiChatbotService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;

        private const string SystemPrompt = @"Bạn là trợ lý ảo thông minh chính thức của sàn thương mại điện tử nhiếp ảnh GO! (nền tảng kết nối khách hàng với các thợ ảnh/studio chuyên nghiệp tại Đà Nẵng).
Tên của bạn là 'GO! Assistant'. Bạn luôn trả lời với thái độ lịch sự, thân thiện, lễ phép (sử dụng các từ như 'Dạ', 'dạ em', 'anh/chị') và chuyên nghiệp bằng Tiếng Việt.

Nhiệm vụ chính của bạn:
1. Hướng dẫn khách hàng tìm kiếm, so sánh và đặt lịch chụp ảnh (booking) với các studio/photographer trên sàn.
2. Hướng dẫn các photographer cách quản lý hồ sơ, gói dịch vụ (packages), lịch làm việc (schedule) và xác nhận booking.
3. Giải đáp các thắc mắc về chính sách hoạt động, đánh giá chất lượng (reviews) sau khi hoàn thành buổi chụp.

Luồng quy trình cốt lõi của sàn GO! (hãy nắm vững để giải thích cho khách hàng):
- Bước 1: Tìm kiếm & Lọc (Search & Filter) -> Khách hàng lọc studio theo Thành phố/Quận huyện, Xếp hạng sao (rating), Khoảng giá (price), và Danh mục dịch vụ (Category như Chụp Ngoại Cảnh, Chụp Studio, Chụp Cưới, v.v.).
- Bước 2: So sánh -> Khách hàng xem hồ sơ, các gói chụp (packages), hình ảnh mẫu (portfolio) của studio để chọn studio ưng ý nhất.
- Bước 3: Gửi yêu cầu đặt lịch (Booking Request) -> Khách hàng chọn gói dịch vụ, ngày giờ chụp và gửi yêu cầu.
- Bước 4: Studio duyệt -> Photographer/Studio nhận được yêu cầu sẽ bấm Xác nhận (Confirm) hoặc Từ chối (Reject).
- Bước 5: Hoàn tất & Đánh giá -> Sau khi buổi chụp kết thúc thành công, khách hàng viết đánh giá (Review) và chấm điểm rating cho studio.

Một số quy định/chính sách quan trọng của GO!:
- **Đặt cọc/Thanh toán:** Hiện tại trong giai đoạn MVP, tính năng thanh toán đang ở dạng giả lập status records, chưa tích hợp cổng thanh toán thực tế (hoặc có tích hợp VnPay Sandbox nếu cấu hình sẵn).
- **Chặn giao dịch ngoài:** Nhắc nhở người dùng thực hiện mọi giao dịch và trao đổi thông qua nền tảng GO! để bảo vệ quyền lợi cá nhân, tránh bị lừa đảo. Mọi hành vi chia sẻ số điện thoại, zalo, facebook, ck ngoài... đều bị hệ thống phát hiện và chặn đứng tự động.

Yêu cầu định dạng câu trả lời:
- Sử dụng Markdown để trình bày đẹp mắt (dùng danh sách gạch đầu dòng, chữ đậm để làm nổi bật thông tin).
- Sử dụng các biểu tượng cảm xúc (emoji) như 📸, ✨, 📅, 💬, 🌟 một cách khéo léo để câu trả lời sinh động, thu hút và premium.
- Trả lời ngắn gọn, đúng trọng tâm và gợi ý câu hỏi tiếp theo để hỗ trợ người dùng tốt hơn.";

        public GeminiChatbotService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Gemini:ApiKey"] ?? throw new ArgumentNullException("Gemini:ApiKey is not configured.");
            _model = configuration["Gemini:Model"] ?? "gemini-2.5-flash";
        }

        public async Task<string> ChatWithAssistantAsync(string userMessage, List<AssistantChatMessageDto>? history)
        {
            if (string.IsNullOrWhiteSpace(userMessage))
            {
                return "Dạ em chào anh/chị! Em là trợ lý ảo GO! Assistant. Em có thể giúp gì cho anh/chị hôm nay ạ? 📸";
            }

            try
            {
                // Construct request body with systemInstruction and contents
                var requestContents = new List<object>();

                // Add history
                if (history != null && history.Count > 0)
                {
                    foreach (var h in history)
                    {
                        var role = h.Sender.ToLowerInvariant() == "user" ? "user" : "model";
                        requestContents.Add(new
                        {
                            role = role,
                            parts = new[] { new { text = h.Content } }
                        });
                    }
                }

                // Add current message
                requestContents.Add(new
                {
                    role = "user",
                    parts = new[] { new { text = userMessage } }
                });

                var requestBody = new
                {
                    systemInstruction = new
                    {
                        parts = new[] { new { text = SystemPrompt } }
                    },
                    contents = requestContents
                };

                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";
                var jsonRequest = JsonSerializer.Serialize(requestBody);
                var httpContent = new StringContent(jsonRequest, Encoding.UTF8, "application/json");

                Console.WriteLine($"[GeminiChatbot] Sending request | Model={_model} | MessageLength={userMessage.Length} | HistoryCount={history?.Count ?? 0}");
                var response = await _httpClient.PostAsync(url, httpContent);
                var jsonResponse = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"[GeminiChatbot] Error response from Gemini: {jsonResponse}");
                    return "Dạ, hệ thống đang gặp gián đoạn kết nối một chút ạ. Anh/chị vui lòng thử lại sau giây lát nha. Em xin lỗi vì sự bất tiện này! 🙏";
                }

                using var doc = JsonDocument.Parse(jsonResponse);
                var root = doc.RootElement;
                
                var botResponse = root
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                return botResponse ?? "Dạ, em chưa hiểu ý anh/chị lắm ạ. Anh/chị có thể nói rõ hơn được không ạ? 📸";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GeminiChatbot] Exception: {ex.Message}");
                return "Dạ, em đang gặp chút trục trặc kỹ thuật khi xử lý câu trả lời. Anh/chị hỏi lại giùm em nha! 📸";
            }
        }
    }
}
