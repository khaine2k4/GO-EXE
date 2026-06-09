using System.Threading.Tasks;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;

namespace EXE201.Server.Services
{
    public interface IPayOsService
    {
        Task<CreatePaymentLinkResponse> CreatePaymentLinkAsync(long orderCode, int amount, string description, string cancelUrl, string returnUrl);
        Task<WebhookData> VerifyWebhookDataAsync(string webhookBodyJson);
        Task<PaymentLink> GetPaymentLinkInformationAsync(long orderCode);
        Task<bool> CancelPaymentLinkAsync(long orderCode);
        Task<bool> ExecutePayoutAsync(string accountNumber, string bankCode, string accountName, int amount, string description);
    }
}
