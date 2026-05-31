using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using PayOS;
using PayOS.Models;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;

namespace EXE201.Server.Services
{
    public class PayOsService : IPayOsService
    {
        private readonly PayOSClient _payOS;
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;

        public PayOsService(PayOSClient payOS, IConfiguration config)
        {
            _payOS = payOS;
            _config = config;
            _httpClient = new HttpClient();
        }

        public async Task<CreatePaymentLinkResponse> CreatePaymentLinkAsync(long orderCode, int amount, string description, string cancelUrl, string returnUrl)
        {
            var paymentRequest = new CreatePaymentLinkRequest
            {
                OrderCode = orderCode,
                Amount = amount,
                Description = description,
                Items = new List<PaymentLinkItem>
                {
                    new()
                    {
                        Name = "Booking Session",
                        Quantity = 1,
                        Price = amount
                    }
                },
                CancelUrl = cancelUrl,
                ReturnUrl = returnUrl
            };

            return await _payOS.PaymentRequests.CreateAsync(paymentRequest);
        }

        public async Task<PaymentLink> GetPaymentLinkInformationAsync(long orderCode)
        {
            return await _payOS.PaymentRequests.GetAsync(orderCode);
        }

        public async Task<WebhookData> VerifyWebhookDataAsync(string webhookBodyJson)
        {
            var webhook = JsonSerializer.Deserialize<Webhook>(webhookBodyJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (webhook == null)
            {
                throw new InvalidOperationException("PayOS webhook body is invalid.");
            }

            return await _payOS.Webhooks.VerifyAsync(webhook);
        }

        public async Task<bool> ExecutePayoutAsync(string accountNumber, string bankCode, string accountName, int amount, string description)
        {
            try
            {
                var clientId = _config["PayOS:PayoutClientId"] ?? _config["PayOS:ClientId"];
                var apiKey = _config["PayOS:PayoutApiKey"] ?? _config["PayOS:ApiKey"];
                var checksumKey = _config["PayOS:PayoutChecksumKey"] ?? _config["PayOS:ChecksumKey"];

                if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(checksumKey))
                {
                    throw new InvalidOperationException("PayOS configuration is missing required keys.");
                }

                // Chuẩn hóa tên ngân hàng sang mã BIN Code (6 số) bắt buộc của PayOS/NAPAS
                var normalizedBankId = NormalizeBankCode(bankCode);

                // Tạo mã tham chiếu duy nhất cho giao dịch
                var referenceId = $"PAYOUT-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";

                // PayOS Payout yêu cầu description tối đa 25 ký tự
                var truncatedDescription = description;
                if (!string.IsNullOrEmpty(truncatedDescription) && truncatedDescription.Length > 25)
                {
                    truncatedDescription = truncatedDescription.Substring(0, 25);
                }

                var requestData = new Dictionary<string, object>
                {
                    { "amount", amount },
                    { "description", truncatedDescription },
                    { "referenceId", referenceId },
                    { "toAccountNumber", accountNumber },
                    { "toBin", normalizedBankId }
                };

                // Gọi SDK chính thức để sinh chữ ký số hợp lệ cho lệnh chi
                var signature = _payOS.Crypto.CreateSignature(checksumKey, requestData, null);

                var jsonPayload = JsonSerializer.Serialize(requestData);
                var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                var request = new HttpRequestMessage(HttpMethod.Post, "https://api-merchant.payos.vn/v1/payouts");
                request.Headers.Add("x-client-id", clientId);
                request.Headers.Add("x-api-key", apiKey);
                request.Headers.Add("x-idempotency-key", referenceId);
                request.Headers.Add("x-signature", signature);
                request.Content = content;

                var response = await _httpClient.SendAsync(request);
                if (response.IsSuccessStatusCode)
                {
                    var jsonString = await response.Content.ReadAsStringAsync();
                    try
                    {
                        using var doc = JsonDocument.Parse(jsonString);
                        if (doc.RootElement.TryGetProperty("code", out var codeProp))
                        {
                            var code = codeProp.GetString();
                            if (code == "00")
                            {
                                return true;
                            }

                            var desc = doc.RootElement.TryGetProperty("desc", out var descProp) ? descProp.GetString() : "Unknown error";
                            Console.WriteLine($"[PAYOS ERROR] PayOS Payout API returned error code: {code}, Description: {desc}");
                            return false;
                        }
                    }
                    catch (Exception jsonEx)
                    {
                        Console.WriteLine($"[PAYOS ERROR] Failed to parse PayOS response JSON: {jsonEx.Message}");
                    }

                    return true;
                }

                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[PAYOS ERROR] PayOS Payout failed. Status: {response.StatusCode}, Error: {errorContent}");
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PAYOS ERROR] Exception during PayOS Payout: {ex.Message}");
                return false;
            }
        }

        private string NormalizeBankCode(string bankCode)
        {
            if (string.IsNullOrWhiteSpace(bankCode)) return "";
            
            var upper = bankCode.Trim().ToUpperInvariant();
            
            // Nếu đã là 6 chữ số BIN (NAPAS) thì trả về luôn
            if (upper.Length == 6 && int.TryParse(upper, out _))
            {
                return upper;
            }

            // Map tên viết tắt ngân hàng thông dụng sang mã BIN (NAPAS)
            if (upper.Contains("MB") || upper.Contains("MILITARY")) return "970422"; // MB Bank
            if (upper.Contains("VIETIN")) return "970415"; // VietinBank
            if (upper.Contains("VIETCOM") || upper.Contains("VCB")) return "970436"; // Vietcombank
            if (upper.Contains("BIDV")) return "970418"; // BIDV
            if (upper.Contains("TECHCOM") || upper.Contains("TCB")) return "970407"; // Techcombank
            if (upper.Contains("AGRI")) return "970405"; // Agribank
            if (upper.Contains("VPB") || upper.Contains("VP")) return "970432"; // VPBank
            if (upper.Contains("TPB") || upper.Contains("TP")) return "970423"; // TPBank
            if (upper.Contains("SACOM")) return "970403"; // Sacombank
            if (upper.Contains("ACB")) return "970416"; // ACB
            if (upper.Contains("HDB") || upper.Contains("HD")) return "970437"; // HDBank
            if (upper.Contains("SHB")) return "970443"; // SHB
            if (upper.Contains("VIB")) return "970441"; // VIB
            if (upper.Contains("MSB")) return "970426"; // MSB
            if (upper.Contains("OCB")) return "970430"; // OCB
            if (upper.Contains("LIENVIET") || upper.Contains("LPB") || upper.Contains("POST")) return "970449"; // LPBank

            return upper; // Trả về nguyên bản nếu không khớp
        }

        private string ComputeHmacSha256(string message, string key)
        {
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var messageBytes = Encoding.UTF8.GetBytes(message);
            using (var hmac = new HMACSHA256(keyBytes))
            {
                var hashBytes = hmac.ComputeHash(messageBytes);
                return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
            }
        }
    }
}
