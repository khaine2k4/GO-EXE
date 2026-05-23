using exe201.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace EXE201.Server.Repositories
{
    public class ChatRepository : IChatRepository
    {
        private readonly PhotoStudioBookingContext _context;

        public ChatRepository(PhotoStudioBookingContext context)
        {
            _context = context;
        }

        public async Task<Conversation?> GetConversationByIdAsync(long conversationId)
        {
            return await _context.Conversations
                .Include(c => c.Customer)
                .Include(c => c.Studio)
                .FirstOrDefaultAsync(c => c.ConversationId == conversationId);
        }

        public async Task<Conversation?> GetConversationByParticipantsAsync(long customerId, long studioId)
        {
            return await _context.Conversations
                .Include(c => c.Customer)
                .Include(c => c.Studio)
                .FirstOrDefaultAsync(c => c.CustomerId == customerId && c.StudioId == studioId);
        }

        public async Task<List<Conversation>> GetConversationsByUserIdAsync(long userId, bool isStudioOwner)
        {
            if (isStudioOwner)
            {
                // Studio owner xem tất cả cuộc trò chuyện với studio của họ
                return await _context.Conversations
                    .Include(c => c.Customer)
                    .Include(c => c.Studio)
                    .Where(c => c.Studio.OwnerId == userId)
                    .OrderByDescending(c => c.LastMessageAt ?? c.CreatedAt)
                    .ToListAsync();
            }
            else
            {
                // Customer xem tất cả cuộc trò chuyện của họ
                return await _context.Conversations
                    .Include(c => c.Customer)
                    .Include(c => c.Studio)
                    .Where(c => c.CustomerId == userId)
                    .OrderByDescending(c => c.LastMessageAt ?? c.CreatedAt)
                    .ToListAsync();
            }
        }

        public async Task<Conversation> CreateConversationAsync(Conversation conversation)
        {
            _context.Conversations.Add(conversation);
            await _context.SaveChangesAsync();
            return conversation;
        }

        public async Task UpdateConversationLastMessageAsync(long conversationId, DateTime lastMessageAt)
        {
            var conv = await _context.Conversations.FindAsync(conversationId);
            if (conv != null)
            {
                conv.LastMessageAt = lastMessageAt;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<Message>> GetMessagesByConversationIdAsync(long conversationId, int take = 100)
        {
            return await _context.Messages
                .Include(m => m.Sender)
                .Where(m => m.ConversationId == conversationId)
                .OrderBy(m => m.CreatedAt)
                .Take(take)
                .ToListAsync();
        }

        public async Task<Message> CreateMessageAsync(Message message)
        {
            _context.Messages.Add(message);
            await _context.SaveChangesAsync();
            // Load sender info
            await _context.Entry(message).Reference(m => m.Sender).LoadAsync();
            return message;
        }

        public async Task MarkMessagesAsReadAsync(long conversationId, long readerId)
        {
            var unread = await _context.Messages
                .Where(m => m.ConversationId == conversationId
                         && m.SenderId != readerId
                         && !m.IsRead)
                .ToListAsync();

            foreach (var msg in unread)
            {
                msg.IsRead = true;
                msg.ReadAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();
        }

        public async Task<int> CountUnreadMessagesAsync(long conversationId, long readerId)
        {
            return await _context.Messages
                .CountAsync(m => m.ConversationId == conversationId
                              && m.SenderId != readerId
                              && !m.IsRead);
        }
    }
}
