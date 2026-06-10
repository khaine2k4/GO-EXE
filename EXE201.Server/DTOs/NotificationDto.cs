using System;

namespace EXE201.Server.DTOs
{
    public class NotificationDto
    {
        public long NotificationId { get; set; }
        public long UserId { get; set; }
        public string Type { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string? Content { get; set; }
        public string? RefType { get; set; }
        public long? RefId { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
