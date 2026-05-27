namespace EXE201.Server.DTOs
{
    // ── Conversation ─────────────────────────────────────
    public class ConversationDto
    {
        public long ConversationId { get; set; }
        public long CustomerId { get; set; }
        public string CustomerName { get; set; } = null!;
        public string? CustomerAvatarUrl { get; set; }
        public long StudioId { get; set; }
        public string StudioName { get; set; } = null!;
        public string? StudioLogoUrl { get; set; }
        public long? BookingId { get; set; }
        public string? LastMessage { get; set; }
        public DateTime? LastMessageAt { get; set; }
        public int UnreadCount { get; set; }
    }

    // ── Message ──────────────────────────────────────────
    public class MessageDto
    {
        public long MessageId { get; set; }
        public long ConversationId { get; set; }
        public long SenderId { get; set; }
        public string SenderName { get; set; } = null!;
        public string? SenderAvatarUrl { get; set; }
        public string Content { get; set; } = null!;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ── Requests ─────────────────────────────────────────
    public class SendMessageRequestDto
    {
        public long StudioId { get; set; }      // người dùng chat với studio nào
        public long? BookingId { get; set; }    // tuỳ chọn, gắn với booking
        public string Content { get; set; } = null!;
    }

    public class GetOrCreateConversationDto
    {
        public long StudioId { get; set; }
        public long? CustomerId { get; set; }
        public long? BookingId { get; set; }
    }

    // ── AI Assistant Chatbot ──────────────────────────────
    public class AssistantChatMessageDto
    {
        public string Sender { get; set; } = null!; // "user" hoặc "bot"
        public string Content { get; set; } = null!;
    }

    public class AssistantChatRequestDto
    {
        public string Message { get; set; } = null!;
        public List<AssistantChatMessageDto>? History { get; set; }
    }
}
