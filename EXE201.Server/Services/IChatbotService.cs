using System.Collections.Generic;
using System.Threading.Tasks;
using EXE201.Server.DTOs;

namespace EXE201.Server.Services
{
    public interface IChatbotService
    {
        Task<string> ChatWithAssistantAsync(string userMessage, List<AssistantChatMessageDto>? history);
    }
}
