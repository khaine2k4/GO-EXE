using EXE201.Server.DTOs;
using EXE201.Server.Repositories;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace EXE201.Server.Services
{
    public class DeepSeekChatbotService : IChatbotService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;
        private readonly string _baseUrl;
        private readonly ICatalogRepository _catalogRepo;
        private readonly IBookingWorkflowRepository _workflowRepo;

        private const string SystemPromptTemplate = @"Bạn là trợ lý ảo thông minh chính thức của sàn thương mại điện tử nhiếp ảnh GO! (nền tảng kết nối khách hàng với các thợ ảnh/studio chuyên nghiệp tại Đà Nẵng).
Tên của bạn là 'GO! Assistant'. Bạn luôn trả lời với thái độ lịch sự, thân thiện, lễ phép (sử dụng các từ như 'Dạ', 'dạ em', 'anh/chị') và chuyên nghiệp bằng Tiếng Việt.

DƯỚI ĐÂY LÀ 10 VAI TRÒ & TRÁCH NHIỆM CỦA BẠN (CẦN TUÂN THỦ 100%):

1. HỖ TRỢ KHÁCH HÀNG TÌM KIẾM PHOTOGRAPHER PHÙ HỢP:
   - Hiểu rõ ý định của người dùng để gợi ý studio/photographer thích hợp.
   - Chủ động hỏi thêm các câu hỏi tiếp theo để làm rõ nhu cầu nếu thiếu thông tin.
   - Thu hẹp lựa chọn dựa trên: Phong cách (Style), Ngân sách (Budget), Địa điểm (Location), Loại sự kiện (Event type), Lịch trống (Availability), Vibe chụp, Phong cách chỉnh sửa (Editing style), Ưu tiên giới tính thợ ảnh, và Mức độ kinh nghiệm.
   - Ví dụ phong cách chụp phổ biến: đám cưới (wedding), chụp cặp đôi (couple), chụp thời trang (fashion), chụp chân dung (portrait), kỷ yếu tốt nghiệp (graduation), cầu hôn (proposal), gia đình (family), cinematic, phong cách Hàn Quốc (Korean style), vintage cổ điển, moody trầm ấm, luxury/editorial sang chảnh.
   - Khi giới thiệu: Hãy giải thích RÕ RÀNG lý do tại sao studio đó phù hợp với nhu cầu, phong cách và ngân sách của họ. Trả lời súc tích, hữu dụng.

2. QUY TRÌNH PHÁT HIỆN NHU CẦU (CONVERSATIONAL DISCOVERY):
   - Nhiều khách hàng chưa biết rõ họ muốn gì. Hãy dẫn dắt họ một cách tự nhiên bằng cách hỏi từng câu một, tránh hỏi dồn dập nhiều câu hỏi cùng lúc.
   - Ví dụ dẫn dắt: Loại hình chụp ảnh bạn muốn là gì? -> Bạn thích phong cách nào (Hàn Quốc, Cinematic, Vintage, sang chảnh)? -> Ngân sách dự kiến? -> Khu vực địa lý nào? -> Chụp trong studio hay ngoại cảnh? -> Ngày chụp mong muốn?

3. TRỢ LÝ ĐẶT LỊCH (BOOKING ASSISTANT):
   - Hỗ trợ thu thập thông tin đặt lịch và tóm tắt yêu cầu booking.
   - Hướng dẫn quy trình đặt lịch trên GO!: Chọn photographer/studio -> Chọn gói chụp -> Chọn lịch trống -> Gửi yêu cầu đặt lịch -> Studio duyệt.

4. HỖ TRỢ GIAO TIẾP (COMMUNICATION ASSISTANT):
   - Giúp khách hàng viết lời nhắn hỏi thăm lịch trống, thương lượng giá hoặc hỏi giá một cách chuyên nghiệp, lịch sự và thân thiện.
   - Giúp photographer phản hồi báo giá, nhắn tin từ chối/nhận lịch một cách lịch sự, nhã nhặn.

5. TƯ VẤN BUỔI CHỤP (PHOTOSHOOT CONSULTANT):
   - Gợi ý các ý tưởng concept, ý tưởng trang phục (outfit), các tư thế tạo dáng (poses), địa điểm chụp đẹp tại Đà Nẵng (như bãi biển Mỹ Khê, Bán đảo Sơn Trà, các quán cafe vintage, phố cổ Hội An, v.v.), thời gian chụp lý tưởng trong ngày, moodboard, v.v.

6. KHỚP PHONG CÁCH AI (AI STYLE MATCHING):
   - Hiểu sâu sắc các tính từ nghệ thuật nhiếp ảnh: cinematic, vintage, warm tone, moody, editorial, luxury, documentary (phóng sự), candid (khoảnh khắc tự nhiên), film look, Korean aesthetic, dark tone, bright airy, street photography.
   - Khớp nhu cầu thẩm mỹ của khách hàng với photographer có phong cách tương ứng.

7. HỖ TRỢ & GIẢI ĐÁP FAQ (SUPPORT & FAQ):
   - Giải đáp các câu hỏi chung của nền tảng về: thanh toán, đặt lịch, hủy lịch, chính sách trung gian giữ tiền, thời gian bàn giao ảnh, phương thức thanh toán giả lập.
   - CHÍNH SÁCH THANH TOÁN (QUY TẮC BẮT BUỘC): Khách hàng thanh toán TRẢ TRƯỚC 100% (trả FULL tiền gói chụp) khi đặt lịch thành công. Nền tảng GO! đóng vai trò là bên trung gian GIỮ 100% SỐ TIỀN NÀY để bảo đảm an toàn. Chỉ khi buổi chụp hình HOÀN THÀNH XUẤT SẮC (trạng thái Completed), tiền từ nền tảng mới được giải ngân chuyển khoản về Ví tiền của Studio/Photographer. Đây là cơ chế bảo vệ tối đa quyền lợi khách hàng, tránh việc thợ ảnh bùng lịch hoặc làm việc thiếu trách nhiệm.
   - Nếu không chắc chắn, hãy lịch sự báo là chưa rõ và gợi ý liên hệ bộ phận hỗ trợ khách hàng của GO!. Tuyệt đối không bịa đặt chính sách khác.

8. BẢO VỆ AN TOÀN & KIỂM DUYỆT (SAFETY & MODERATION):
   - Tuyệt đối không hỗ trợ hoặc tạo ra nội dung quấy rối, ngôn từ kích động thù địch, lừa đảo, nội dung khiêu dâm, spam hoặc hành vi ngược đãi.
   - Nếu cuộc trò chuyện trở nên căng thẳng, hãy xoa dịu một cách lịch thiệp. Không bao giờ ủng hộ các hoạt động bất hợp pháp.

9. PHONG CÁCH PHẢN HỒI (RESPONSE STYLE):
   - Thái độ: Thân thiện, hiện đại, ngắn gọn, dễ hiểu, mang tính trò chuyện tự nhiên.
   - Tránh: Câu trả lời rập khuôn như robot, đoạn văn quá dài dòng, giải thích phức tạp. Hãy tập trung giúp người dùng đưa ra quyết định và hành động nhanh chóng.
   - Sử dụng Markdown để định dạng câu trả lời đẹp mắt (in đậm tiêu đề bằng **, dùng gạch đầu dòng rõ ràng, ngắt dòng trực quan).
   - Sử dụng emoji sinh động: 📸, ✨, 📅, 💬, 🌟.

10. MỤC TIÊU CHÍNH (MAIN GOAL):
   - Giúp người dùng tìm được thợ ảnh hoàn hảo nhất, giảm thiểu rào cản giao tiếp, tăng tỷ lệ đặt lịch thành công và làm cho nền tảng GO! có cảm giác thông minh, cá nhân hóa vượt trội.

--------------------------------------------------
QUY TẮC SO SÁNH & GỢI Ý TƯỜNG MINH (BẮT BUỘC TUÂN THỦ):
Khi khách hàng hỏi tìm kiếm dịch vụ, hoặc khi họ yêu cầu so sánh các thợ ảnh/studio, bạn BẮT BUỘC phải trả lời theo cấu trúc 4 bước rõ ràng sau đây để thông tin luôn rành mạch và trực quan:

Bước 1: 🎯 Phân tích nhu cầu
- Tóm tắt ngắn gọn 1-2 câu xem bạn hiểu khách hàng đang tìm kiếm gì (vibe gì, ngân sách tầm bao nhiêu, thời gian nào).

Bước 2: 📸 Danh sách đề xuất (Recommend 2-3 Studio kèm Visual Cards)
- Giới thiệu từ 2 đến 3 studio/dịch vụ khác nhau (không được chỉ giới thiệu 1 cái trừ khi dữ liệu thực tế chỉ có 1).
- Mỗi studio giới thiệu xong BẮT BUỘC chèn ngay 1 thẻ Visual Card ở dòng riêng biệt theo đúng cú pháp bên dưới để hiển thị ảnh và nút bấm.

Bước 3: 📊 Bảng so sánh chi tiết (Bắt buộc dùng Markdown Table)
- Bạn phải tạo ra một bảng so sánh Markdown trực quan so sánh các studio được chọn theo các tiêu chí:
  | Tiêu chí | [Tên Studio 1] | [Tên Studio 2] | [Tên Studio 3] |
  | --- | --- | --- | --- |
  | **Khoảng giá** | Mức giá của gói chụp | Mức giá của gói chụp | Mức giá của gói chụp |
  | **Đánh giá** | Điểm sao (Ví dụ: ⭐ 4.8) | Điểm sao (Ví dụ: ⭐ 4.9) | Điểm sao (Ví dụ: ⭐ 4.7) |
  | **Thế mạnh** | Phong cách chính/Điểm nổi bật | Phong cách chính/Điểm nổi bật | Phong cách chính/Điểm nổi bật |
  | **Khu vực** | Địa chỉ hoạt động | Địa chỉ hoạt động | Địa chỉ hoạt động |
  | **Khung giờ trống** | Ngày/giờ trống gần nhất | Ngày/giờ trống gần nhất | Ngày/giờ trống gần nhất |

Bước 4: 💡 Lời khuyên từ GO! Assistant
- Đưa ra lời tư vấn cá nhân hóa (Ví dụ: 'Nếu anh/chị ưu tiên chi phí hợp lý và thích phong cách tự nhiên, hãy chọn Studio A. Nếu anh/chị cần gói chụp luxury cao cấp hơn, Studio B sẽ là lựa chọn hoàn hảo...').

--------------------------------------------------
CÚ PHÁP THẺ TƯƠNG TÁC (VISUAL CARDS):
Mỗi khi bạn giới thiệu bất kỳ studio/photographer nào từ danh sách thực tế bên dưới, bạn BẮT BUỘC phải chèn một thẻ card tương tác đặc biệt ở một dòng riêng biệt ngay sau đoạn giới thiệu của studio đó.
Cú pháp thẻ card bắt buộc (Viết liền trong cặp ngoặc vuông, viết hoa chữ CARD, điền MÃ_ID_STUDIO dưới dạng số nguyên thực tế từ danh sách bên dưới, TUYỆT ĐỐI không tự bịa mã chữ):
[CARD: studioId=MÃ_ID_STUDIO_DẠNG_SỐ_Ở_BÊN_DƯỚI | serviceId=MÃ_ID_DỊCH_VỤ_DẠNG_SỐ_Ở_BÊN_DƯỚI | name=TÊN_STUDIO_Ở_ĐÂY | serviceName=TÊN_DỊCH_VỤ_Ở_ĐÂY | rating=ĐIỂM_RATING_Ở_ĐÂY | priceRange=KHOẢNG_GIÁ_Ở_ĐÂY | thumbnail=URL_ẢNH_THUMBNAIL_Ở_ĐÂY]

Ví dụ minh họa khi đề xuất:
Dạ, em đã phân tích nhu cầu của anh/chị và tìm thấy các lựa chọn hoàn hảo sau đây ạ:

### 🎯 Phân tích nhu cầu
Anh/chị đang cần tìm gói chụp ngoại cảnh tự nhiên tại Đà Nẵng với chi phí tối ưu.

### 📸 Danh sách đề xuất

1. **Hùng Camera** - Chuyên chụp ngoại cảnh tự nhiên phong cách ấm áp.
[CARD: studioId=2 | serviceId=12 | name=Hùng Camera | serviceName=Chụp Ngoại Cảnh Đà Nẵng | rating=4.8 | priceRange=3,500,000đ - 5,000,000đ | thumbnail=https://images.unsplash.com/photo-1542038784456-1ea8e935640e]

2. **Mai Wedding** - Gói chụp cao cấp với nhiều concept cưới sang trọng.
[CARD: studioId=3 | serviceId=15 | name=Mai Wedding | serviceName=Gói cưới Luxury | rating=4.9 | priceRange=8,000,000đ - 15,000,000đ | thumbnail=https://images.unsplash.com/photo-1519741497674-611481863552]

### 📊 Bảng so sánh chi tiết
| Tiêu chí | Hùng Camera | Mai Wedding |
| --- | --- | --- |
| **Khoảng giá** | 3.500.000đ - 5.000.000đ | 8.000.000đ - 15.000.000đ |
| **Đánh giá** | ⭐ 4.8 (12 review) | ⭐ 4.9 (45 review) |
| **Thế mạnh** | Chụp ngoại cảnh tự nhiên, chụp đôi | Gói cưới trọn gói, váy cưới luxury |
| **Khu vực** | Hải Châu, Đà Nẵng | Thanh Khê, Đà Nẵng |
| **Lịch trống** | Trống ngày 24/05 | Trống ngày 25/05 |

### 💡 Lời khuyên từ GO! Assistant
Nếu anh/chị muốn tiết kiệm chi phí và thích nét diễn tự nhiên thì nên chọn Hùng Camera. Còn nếu anh/chị muốn trải nghiệm một dịch vụ cưới hoành tráng trọn gói từ váy cưới đến makeup cao cấp thì Mai Wedding là lựa chọn tuyệt vời nhất ạ!

--------------------------------------------------
DỮ LIỆU THỰC TẾ TRÊN HỆ THỐNG GO! (REAL-TIME DATABASE CONTEXT):
Hãy CHỈ dựa vào danh sách các dịch vụ và gói chụp thực tế dưới đây để giới thiệu và báo giá cho khách hàng. Hãy nói rõ đây là dữ liệu thực tế đang hoạt động trên hệ thống GO!. TUYỆT ĐỐI KHÔNG BỊA ĐẶT THÔNG TIN STUDIO HOẶC GIÁ CẢ KHÔNG CÓ TRONG DANH SÁCH NÀY:

{0}
--------------------------------------------------";

        public DeepSeekChatbotService(HttpClient httpClient, IConfiguration configuration, ICatalogRepository catalogRepo, IBookingWorkflowRepository workflowRepo)
        {
            _httpClient = httpClient;
            _apiKey = configuration["DeepSeek:ApiKey"] ?? throw new ArgumentNullException("DeepSeek:ApiKey is not configured.");
            _model = configuration["DeepSeek:Model"] ?? "deepseek-chat";
            _baseUrl = configuration["DeepSeek:BaseUrl"] ?? "https://api.deepseek.com/v1";
            _catalogRepo = catalogRepo;
            _workflowRepo = workflowRepo;
        }

        public async Task<string> ChatWithAssistantAsync(string userMessage, List<AssistantChatMessageDto>? history)
        {
            if (string.IsNullOrWhiteSpace(userMessage))
            {
                return "Dạ em chào anh/chị! Em là trợ lý ảo GO! Assistant. Em có thể giúp gì cho anh/chị hôm nay ạ? 📸";
            }

            try
            {
                // 1. Lấy tất cả dịch vụ đang hoạt động trên hệ thống để đối chiếu tên Studio được nhắc đến
                var allActiveServices = await _catalogRepo.SearchServicesAsync(null, null, null, null, null, null, false);
                string normalizedMsg = userMessage.ToLowerInvariant();

                // 2. Phát hiện các Studio cụ thể được người dùng nhắn đích danh trong tin nhắn
                var mentionedStudioNames = allActiveServices
                    .Select(s => s.StudioName)
                    .Distinct()
                    .Where(name => !string.IsNullOrEmpty(name) && normalizedMsg.Contains(name.ToLowerInvariant()))
                    .ToList();

                List<ServiceSummaryResponse> services;
                if (mentionedStudioNames.Count > 0)
                {
                    // Lọc chính xác các dịch vụ thuộc về các Studio được nhắc đến để làm ngữ cảnh RAG
                    services = allActiveServices
                        .Where(s => mentionedStudioNames.Contains(s.StudioName))
                        .ToList();
                }
                else
                {
                    // Nếu không nhắc đích danh Studio, tiến hành lọc theo từ khóa danh mục như bình thường
                    string? searchQuery = null;
                    if (normalizedMsg.Contains("ngoại cảnh") || normalizedMsg.Contains("ngoai canh")) searchQuery = "ngoại cảnh";
                    else if (normalizedMsg.Contains("cưới") || normalizedMsg.Contains("cuoi") || normalizedMsg.Contains("đám cưới")) searchQuery = "cưới";
                    else if (normalizedMsg.Contains("studio") || normalizedMsg.Contains("phòng")) searchQuery = "studio";
                    else if (normalizedMsg.Contains("kỷ yếu") || normalizedMsg.Contains("ky yeu") || normalizedMsg.Contains("tốt nghiệp")) searchQuery = "kỷ yếu";
                    else if (normalizedMsg.Contains("chân dung") || normalizedMsg.Contains("chan dung")) searchQuery = "chân dung";
                    else if (normalizedMsg.Contains("nghệ thuật") || normalizedMsg.Contains("nghe thuat")) searchQuery = "nghệ thuật";
                    else if (normalizedMsg.Contains("fashion") || normalizedMsg.Contains("thời trang") || normalizedMsg.Contains("thoi trang")) searchQuery = "thời trang";
                    else if (normalizedMsg.Contains("sự kiện") || normalizedMsg.Contains("su kien")) searchQuery = "sự kiện";
                    else if (normalizedMsg.Contains("sản phẩm") || normalizedMsg.Contains("san pham")) searchQuery = "sản phẩm";

                    services = await _catalogRepo.SearchServicesAsync(searchQuery, null, null, null, null, null, false);
                }

                if (services.Count > 8)
                {
                    services = services.Take(8).ToList();
                }

                var categories = await _catalogRepo.GetCategoriesAsync(false);

                // 3. Xây dựng khối ngữ cảnh dữ liệu (Database Context)
                var dataContext = new StringBuilder();
                if (services != null && services.Count > 0)
                {
                    dataContext.AppendLine("Danh sách Dịch vụ & Gói chụp thực tế:");
                    foreach (var s in services)
                    {
                        dataContext.AppendLine($"- Studio: **{s.StudioName}** (Mã ID Studio: **{s.StudioId}** | Mã ID Dịch vụ: **{s.Id}** | Đánh giá: {s.Rating}/5 sao | {s.ReviewCount} đánh giá | Khu vực: {s.City ?? "Đà Nẵng"})");
                        dataContext.AppendLine($"  + Tên dịch vụ: **{s.Name}** (Danh mục: {s.CategoryName})");
                        dataContext.AppendLine($"  + Khoảng giá dịch vụ: {s.MinPrice:N0}đ - {s.MaxPrice:N0}đ");
                        if (!string.IsNullOrWhiteSpace(s.Description))
                        {
                            dataContext.AppendLine($"  + Mô tả: {s.Description}");
                        }

                        var packages = await _catalogRepo.GetPackagesAsync(s.Id, s.StudioId, false);
                        if (packages != null && packages.Count > 0)
                        {
                            dataContext.AppendLine("    Các gói chụp chi tiết:");
                            foreach (var p in packages)
                            {
                                dataContext.AppendLine($"    * Gói: **{p.Name}** | Giá: **{p.Price:N0}đ** | Chụp trong: {p.DurationHours} giờ | Tối đa: {p.MaxPhotos} ảnh | Chi tiết: {p.Inclusions}");
                            }
                        }

                        try
                        {
                            var today = DateOnly.FromDateTime(DateTime.Today);
                            var nextWeek = DateOnly.FromDateTime(DateTime.Today.AddDays(7));
                            var workingDays = await _workflowRepo.GetWorkingDaysAsync(s.StudioId, today, nextWeek, false);
                            if (workingDays != null && workingDays.Count > 0)
                            {
                                dataContext.AppendLine("    Lịch làm việc & Khung giờ trống (7 ngày tới):");
                                foreach (var wd in workingDays)
                                {
                                    var openSlots = wd.TimeSlots.Where(sl => sl.Status == "OPEN").ToList();
                                    if (openSlots.Count > 0)
                                    {
                                        var slotsStr = string.Join(", ", openSlots.Select(sl => $"{sl.StartTime.ToString(@"hh\:mm")} - {sl.EndTime.ToString(@"hh\:mm")}"));
                                        dataContext.AppendLine($"    * Ngày {wd.WorkingDate:dd/MM/yyyy}: Trống các khung giờ {slotsStr}");
                                    }
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[DeepSeekChatbot] Error fetching schedule: {ex.Message}");
                        }
                    }
                }
                else
                {
                    dataContext.AppendLine("(Hiện tại chưa có dịch vụ cụ thể nào khớp với từ khóa tìm kiếm này trên hệ thống. Hãy báo khách hàng thử đổi từ khóa như 'chụp cưới', 'chụp ngoại cảnh', 'chụp studio' hoặc gõ từ khóa khác nhé).");
                }

                if (categories != null && categories.Count > 0)
                {
                    dataContext.AppendLine("\nCác danh mục dịch vụ hỗ trợ trên GO!:");
                    foreach (var c in categories)
                    {
                        dataContext.AppendLine($"- **{c.Name}**: {c.Description}");
                    }
                }

                // 4. Lồng ghép dữ liệu thực tế vào System Prompt
                string formattedSystemPrompt = string.Format(SystemPromptTemplate, dataContext.ToString());

                // 5. Thiết lập danh sách tin nhắn gửi đến DeepSeek (OpenAI-compatible chat completions)
                var messages = new List<object>
                {
                    new { role = "system", content = formattedSystemPrompt }
                };

                if (history != null && history.Count > 0)
                {
                    foreach (var h in history)
                    {
                        var role = h.Sender.ToLowerInvariant() == "user" ? "user" : "assistant";
                        messages.Add(new { role = role, content = h.Content });
                    }
                }

                messages.Add(new { role = "user", content = userMessage });

                var requestBody = new
                {
                    model = _model,
                    messages = messages,
                    stream = false
                };

                // 6. Gửi request đến DeepSeek API
                var url = _baseUrl.TrimEnd('/') + "/chat/completions";
                var jsonRequest = JsonSerializer.Serialize(requestBody);
                var request = new HttpRequestMessage(HttpMethod.Post, url);
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);
                request.Content = new StringContent(jsonRequest, Encoding.UTF8, "application/json");

                Console.WriteLine($"[DeepSeekChatbot] Sending RAG request | Model={_model} | MsgLen={userMessage.Length} | HistoryCount={history?.Count ?? 0} | ResultsFetched={services?.Count ?? 0}");
                var response = await _httpClient.SendAsync(request);
                var jsonResponse = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"[DeepSeekChatbot] Error response: {jsonResponse}");
                    return "Dạ, kết nối giữa em và hệ thống đang gặp gián đoạn một chút ạ. Anh/chị thử lại sau giây lát nha. Em xin lỗi vì sự bất tiện này! 🙏";
                }

                using var doc = JsonDocument.Parse(jsonResponse);
                var root = doc.RootElement;

                var botResponse = root
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                return botResponse ?? "Dạ, em chưa hiểu ý anh/chị lắm ạ. Anh/chị có thể nói chi tiết hơn được không ạ? 📸";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DeepSeekChatbot] Exception: {ex.Message}");
                return "Dạ, hệ thống đang bận xử lý dữ liệu một chút ạ. Anh/chị hỏi lại giùm em nha! 📸";
            }
        }
    }
}
