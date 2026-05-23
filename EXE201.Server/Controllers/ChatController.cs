using EXE201.Server.DTOs;
using EXE201.Server.Hubs;
using EXE201.Server.Repositories;
using exe201.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace EXE201.Server.Controllers
{
    [ApiController]
    [Route("api/chat")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatRepository _chatRepo;
        private readonly IStudioRepository _studioRepo;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly Services.IGeminiModerationService _moderationService;

        public ChatController(
            IChatRepository chatRepo, 
            IStudioRepository studioRepo, 
            IHubContext<ChatHub> hubContext,
            Services.IGeminiModerationService moderationService)
        {
            _chatRepo = chatRepo;
            _studioRepo = studioRepo;
            _hubContext = hubContext;
            _moderationService = moderationService;
        }

        private long GetCurrentUserId()
        {
            return long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        }

        private bool IsStudioOwner()
        {
            return User.FindFirstValue(ClaimTypes.Role) == "STUDIO_OWNER";
        }

        // ── GET /api/chat/conversations ─────────────────────────────
        // Lấy danh sách tất cả cuộc trò chuyện của user hiện tại
        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var userId = GetCurrentUserId();
            var isOwner = IsStudioOwner();
            var conversations = await _chatRepo.GetConversationsByUserIdAsync(userId, isOwner);

            var result = new List<ConversationDto>();
            foreach (var c in conversations)
            {
                var lastMsg = await _chatRepo.GetMessagesByConversationIdAsync(c.ConversationId, 1);
                var unread = await _chatRepo.CountUnreadMessagesAsync(c.ConversationId, userId);

                result.Add(new ConversationDto
                {
                    ConversationId = c.ConversationId,
                    CustomerId = c.CustomerId,
                    CustomerName = c.Customer.FullName,
                    CustomerAvatarUrl = c.Customer.AvatarUrl,
                    StudioId = c.StudioId,
                    StudioName = c.Studio.StudioName,
                    StudioLogoUrl = c.Studio.LogoUrl,
                    BookingId = c.BookingId,
                    LastMessage = lastMsg.FirstOrDefault()?.Content,
                    LastMessageAt = c.LastMessageAt,
                    UnreadCount = unread
                });
            }

            return Ok(result);
        }

        // ── POST /api/chat/conversations ────────────────────────────
        // Tạo hoặc lấy conversation giữa customer và studio
        [HttpPost("conversations")]
        public async Task<IActionResult> GetOrCreateConversation([FromBody] GetOrCreateConversationDto dto)
        {
            var userId = GetCurrentUserId();
            var isOwner = IsStudioOwner();

            long customerId;
            long studioId;

            if (isOwner)
            {
                if (dto.CustomerId == null)
                {
                    return BadRequest("CustomerId is required when a studio owner initiates a conversation.");
                }
                customerId = dto.CustomerId.Value;

                // Check that this studio belongs to the current studio owner
                var studio = await _studioRepo.GetStudioByIdAsync(dto.StudioId);
                if (studio == null || studio.OwnerId != userId)
                {
                    return Forbid();
                }
                studioId = dto.StudioId;
            }
            else
            {
                customerId = userId;
                studioId = dto.StudioId;
            }

            // Tìm conversation cũ
            var existing = await _chatRepo.GetConversationByParticipantsAsync(customerId, studioId);
            if (existing != null)
            {
                return Ok(new ConversationDto
                {
                    ConversationId = existing.ConversationId,
                    CustomerId = existing.CustomerId,
                    CustomerName = existing.Customer.FullName,
                    CustomerAvatarUrl = existing.Customer.AvatarUrl,
                    StudioId = existing.StudioId,
                    StudioName = existing.Studio.StudioName,
                    StudioLogoUrl = existing.Studio.LogoUrl,
                    BookingId = existing.BookingId ?? dto.BookingId
                });
            }

            // Tạo mới
            var conv = new Conversation
            {
                CustomerId = customerId,
                StudioId = studioId,
                BookingId = dto.BookingId,
                CreatedAt = DateTime.UtcNow
            };
            var created = await _chatRepo.CreateConversationAsync(conv);

            // Load related data
            var full = await _chatRepo.GetConversationByIdAsync(created.ConversationId);
            return Ok(new ConversationDto
            {
                ConversationId = full!.ConversationId,
                CustomerId = full.CustomerId,
                CustomerName = full.Customer.FullName,
                CustomerAvatarUrl = full.Customer.AvatarUrl,
                StudioId = full.StudioId,
                StudioName = full.Studio.StudioName,
                StudioLogoUrl = full.Studio.LogoUrl,
                BookingId = full.BookingId
            });
        }

        // ── GET /api/chat/conversations/{id}/messages ───────────────
        // Lấy lịch sử tin nhắn của conversation
        [HttpGet("conversations/{id}/messages")]
        public async Task<IActionResult> GetMessages(long id)
        {
            var userId = GetCurrentUserId();

            // Đánh dấu đã đọc khi mở
            await _chatRepo.MarkMessagesAsReadAsync(id, userId);

            var messages = await _chatRepo.GetMessagesByConversationIdAsync(id, 100);
            var result = messages.Select(m => new MessageDto
            {
                MessageId = m.MessageId,
                ConversationId = m.ConversationId,
                SenderId = m.SenderId,
                SenderName = m.Sender.FullName,
                SenderAvatarUrl = m.Sender.AvatarUrl,
                Content = m.Content,
                IsRead = m.IsRead,
                CreatedAt = m.CreatedAt
            });

            return Ok(result);
        }

        // ── POST /api/chat/conversations/{id}/messages ──────────────
        // Gửi tin nhắn — lưu DB + push SignalR realtime
        [HttpPost("conversations/{id}/messages")]
        public async Task<IActionResult> SendMessage(long id, [FromBody] SendMessageRequestDto dto)
        {
            var userId = GetCurrentUserId();

            // 🤖 Kiểm duyệt tin nhắn bằng Gemini
            var (isViolated, reason) = await _moderationService.ModerateMessageAsync(dto.Content);
            if (isViolated)
            {
                return BadRequest($"Tin nhắn bị chặn do vi phạm chính sách của GO! ({reason})");
            }

            var msg = new Message
            {
                ConversationId = id,
                SenderId = userId,
                Content = dto.Content,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            var saved = await _chatRepo.CreateMessageAsync(msg);
            await _chatRepo.UpdateConversationLastMessageAsync(id, saved.CreatedAt);

            var msgDto = new MessageDto
            {
                MessageId = saved.MessageId,
                ConversationId = saved.ConversationId,
                SenderId = saved.SenderId,
                SenderName = saved.Sender.FullName,
                SenderAvatarUrl = saved.Sender.AvatarUrl,
                Content = saved.Content,
                IsRead = saved.IsRead,
                CreatedAt = saved.CreatedAt
            };

            // 🚀 Push realtime tới tất cả người trong "phòng" của conversation này
            await _hubContext.Clients.Group($"conv_{id}").SendAsync("ReceiveMessage", msgDto);

            return Ok(msgDto);
        }

        // ── GET /api/chat/test-gemini ──────────────────────────────
        // Endpoint test nhanh kết nối và hoạt động của Gemini API
        [HttpGet("test-gemini")]
        [AllowAnonymous]
        public async Task<IActionResult> TestGemini([FromQuery] string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return BadRequest("Vui lòng cung cấp tham số 'text' để kiểm tra (ví dụ: ?text=hello)");
            }

            try
            {
                var (isViolated, reason) = await _moderationService.ModerateMessageAsync(text);
                return Ok(new
                {
                    InputText = text,
                    IsViolated = isViolated,
                    Reason = reason,
                    Status = "Success"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Status = "Error",
                    Message = ex.Message,
                    StackTrace = ex.StackTrace
                });
            }
        }
    }
}
