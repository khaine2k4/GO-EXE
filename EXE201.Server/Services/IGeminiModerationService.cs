using System.Threading.Tasks;

namespace EXE201.Server.Services
{
    public interface IGeminiModerationService
    {
        Task<(bool IsViolated, string Reason)> ModerateMessageAsync(string content, bool throwOnError = false);
    }
}
