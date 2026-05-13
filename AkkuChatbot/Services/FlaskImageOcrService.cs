using System.Net.Http.Json;
using Microsoft.AspNetCore.Http;

namespace AkkuChatbot.Services
{
    public class FlaskImageOcrService : IFlaskImageOcrService
    {
        private readonly HttpClient _http;

        public FlaskImageOcrService(HttpClient http)
        {
            _http = http;
        }

        public async Task<OcrResult> ExtractTextAsync(IFormFile image, string language = "eng+tam+hin", int psm = 6, bool useEasyOcr = false)
        {
            using var content = new MultipartFormDataContent();
            var fileContent = new StreamContent(image.OpenReadStream());
            fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(image.ContentType);
            content.Add(fileContent, "image", image.FileName);
            content.Add(new StringContent(language), "lang");
            content.Add(new StringContent(psm.ToString()), "psm");
            content.Add(new StringContent(useEasyOcr.ToString().ToLower()), "use_easyocr");

            var response = await _http.PostAsync("/ocr", content);
            var result = await response.Content.ReadFromJsonAsync<OcrResult>();
            return result ?? new OcrResult { Success = false, Error = "Empty response" };
        }

        public async Task<List<List<string>>> ExtractTableAsync(IFormFile image, string language = "eng+tam+hin")
        {
            using var content = new MultipartFormDataContent();
            var fileContent = new StreamContent(image.OpenReadStream());
            fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(image.ContentType);
            content.Add(fileContent, "image", image.FileName);
            content.Add(new StringContent(language), "lang");

            var response = await _http.PostAsync("/ocr/table", content);
            if (!response.IsSuccessStatusCode) return new List<List<string>>();
            var wrapper = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
            if (wrapper != null && wrapper.TryGetValue("data", out var data) && data is System.Text.Json.JsonElement arr)
            {
                var table = new List<List<string>>();
                foreach (var row in arr.EnumerateArray())
                {
                    var r = new List<string>();
                    foreach (var cell in row.EnumerateArray())
                        r.Add(cell.GetString() ?? "");
                    table.Add(r);
                }
                return table;
            }
            return new List<List<string>>();
        }
    }
}