namespace AkkuChatbot.Services
{
    public interface IFlaskImageOcrService
    {
        Task<OcrResult> ExtractTextAsync(IFormFile image, string language = "eng+tam+hin", int psm = 6, bool useEasyOcr = false);
        Task<List<List<string>>> ExtractTableAsync(IFormFile image, string language = "eng+tam+hin");
    }

    public class OcrResult
    {
        public bool Success { get; set; }
        public string Text { get; set; } = "";
        public string Language { get; set; } = "";
        public string Method { get; set; } = "";
        public string Error { get; set; } = "";
    }
}