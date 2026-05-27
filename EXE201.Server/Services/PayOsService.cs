using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using PayOS;
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

                // Prepare request body
                var orderCode = DateTime.UtcNow.Ticks;
                var referenceId = $"PAYOUT-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";

                var requestData = new Dictionary<string, object>
                {
                    { "accountNumber", accountNumber },
                    { "bankCode", bankCode },
                    { "accountName", accountName },
                    { "amount", amount },
                    { "description", description },
                    { "orderCode", orderCode },
                    { "referenceId", referenceId }
                };

                // Generate signature by sorting keys alphabetically
                var sortedParams = new SortedDictionary<string, string>();
                foreach (var kv in requestData)
                {
                    sortedParams.Add(kv.Key, kv.Value.ToString() ?? "");
                }

                var signString = new StringBuilder();
                foreach (var kv in sortedParams)
                {
                    if (signString.Length > 0) signString.Append("&");
                    signString.Append($"{kv.Key}={kv.Value}");
                }

                var signature = ComputeHmacSha256(signString.ToString(), checksumKey);
                requestData.Add("signature", signature);

                var jsonPayload = JsonSerializer.Serialize(requestData);
                var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                var request = new HttpRequestMessage(HttpMethod.Post, "https://api-merchant.payos.vn/v1/payouts");
                request.Headers.Add("x-client-id", clientId);
                request.Headers.Add("x-api-key", apiKey);
                request.Content = content;

                var response = await _httpClient.SendAsync(request);
                if (response.IsSuccessStatusCode)
                {
                    return true;
                }

                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"PayOS Payout failed. Status: {response.StatusCode}, Error: {errorContent}");
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception during PayOS Payout: {ex.Message}");
                return false;
            }
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
