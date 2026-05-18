using System;
using System.Collections.Generic;

namespace exe201.Server.Models;

public partial class Conversation
{
    public long ConversationId { get; set; }

    public long CustomerId { get; set; }

    public long StudioId { get; set; }

    public long? BookingId { get; set; }

    public DateTime? LastMessageAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Booking? Booking { get; set; }

    public virtual User Customer { get; set; } = null!;

    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();

    public virtual Studio Studio { get; set; } = null!;
}
