using System.Threading.Tasks;

namespace EXE201.Server.Services
{
    public interface IGeminiModerationService
    {
        Task<(bool IsViolated, string Reason)> ModerateMessageAsync(string content, bool throwOnError = false);
        Task<GeminiDebugResult> TestModerationDetailedAsync(string content);
    }

    public class GeminiDebugResult
    {
        public bool IsViolated { get; set; }
        public string Reason { get; set; } = string.Empty;
        public int StatusCode { get; set; }
        public string RawResponse { get; set; } = string.Empty;
    }
}
