using System.Net;
using System.Security.Cryptography;
using System.Text;

namespace EXE201.Server.Utils
{
    public class VnPayLibrary
    {
        private readonly SortedDictionary<string, string> _requestData = new(StringComparer.Ordinal);
        private readonly SortedDictionary<string, string> _responseData = new(StringComparer.Ordinal);

        public void AddRequestData(string key, string value)
        {
            if (!string.IsNullOrEmpty(value))
            {
                _requestData[key] = value;
            }
        }

        public void AddResponseData(string key, string value)
        {
            if (!string.IsNullOrEmpty(value))
            {
                _responseData[key] = value;
            }
        }

        public string CreateRequestUrl(string baseUrl, string hashSecret)
        {
            var queryString = new StringBuilder();
            var rawData = new StringBuilder();

            foreach (var kv in _requestData)
            {
                if (queryString.Length > 0)
                {
                    queryString.Append("&");
                    rawData.Append("&");
                }

                queryString.Append(UrlEncode(kv.Key) + "=" + UrlEncode(kv.Value));
                rawData.Append(UrlEncode(kv.Key) + "=" + UrlEncode(kv.Value));
            }

            var secureHash = HmacSha512(hashSecret, rawData.ToString());
            queryString.Append("&vnp_SecureHash=" + secureHash);

            return baseUrl + "?" + queryString.ToString();
        }

        public bool ValidateSignature(string secureHash, string hashSecret)
        {
            var rawData = new StringBuilder();

            foreach (var kv in _responseData)
            {
                if (kv.Key.StartsWith("vnp_") && kv.Key != "vnp_SecureHash" && kv.Key != "vnp_SecureHashType")
                {
                    if (rawData.Length > 0)
                    {
                        rawData.Append("&");
                    }
                    rawData.Append(UrlEncode(kv.Key) + "=" + UrlEncode(kv.Value));
                }
            }

            var mySecureHash = HmacSha512(hashSecret, rawData.ToString());
            return mySecureHash.Equals(secureHash, StringComparison.InvariantCultureIgnoreCase);
        }

        public static string HmacSha512(string key, string inputData)
        {
            var hash = new StringBuilder();
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var inputBytes = Encoding.UTF8.GetBytes(inputData);
            using (var hmac = new HMACSHA512(keyBytes))
            {
                var hashValue = hmac.ComputeHash(inputBytes);
                foreach (var theByte in hashValue)
                {
                    hash.Append(theByte.ToString("x2"));
                }
            }
            return hash.ToString();
        }

        private string UrlEncode(string input)
        {
            if (string.IsNullOrEmpty(input)) return string.Empty;
            
            // Standard WebUtility.UrlEncode encodes spaces as "+"
            var encoded = WebUtility.UrlEncode(input);
            
            // Convert percent-encoded hex to UPPERCASE to match VNPay expectations
            var sb = new StringBuilder();
            for (int i = 0; i < encoded.Length; i++)
            {
                if (encoded[i] == '%' && i + 2 < encoded.Length)
                {
                    sb.Append('%');
                    sb.Append(char.ToUpper(encoded[i + 1]));
                    sb.Append(char.ToUpper(encoded[i + 2]));
                    i += 2;
                }
                else
                {
                    sb.Append(encoded[i]);
                }
            }
            return sb.ToString();
        }
    }
}
