using exe201.Server.Models;

namespace EXE201.Server.Repositories
{
    public interface IChatRepository
    {
        Task<Conversation?> GetConversationByIdAsync(long conversationId);
        Task<Conversation?> GetConversationByParticipantsAsync(long customerId, long studioId);
        Task<List<Conversation>> GetConversationsByUserIdAsync(long userId, bool isStudioOwner);
        Task<Conversation> CreateConversationAsync(Conversation conversation);
        Task UpdateConversationLastMessageAsync(long conversationId, DateTime lastMessageAt);

        Task<List<Message>> GetMessagesByConversationIdAsync(long conversationId, int take = 100);
        Task<Message> CreateMessageAsync(Message message);
        Task MarkMessagesAsReadAsync(long conversationId, long readerId);
        Task<int> CountUnreadMessagesAsync(long conversationId, long readerId);
    }
}
