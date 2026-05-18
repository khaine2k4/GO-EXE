using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class Message
{
    public long MessageId { get; set; }

    public long ConversationId { get; set; }

    public long SenderId { get; set; }

    public string Content { get; set; } = null!;

    public bool IsRead { get; set; }

    public DateTime? ReadAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Conversation Conversation { get; set; } = null!;

    public virtual User Sender { get; set; } = null!;
}
