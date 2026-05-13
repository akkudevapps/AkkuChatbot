namespace AkkuChatbot.Services
{
    public interface INativeOcrService
    {
        Task<string> ExtractTextAsync(byte[] imageBytes, string language = "eng+tam+hin");
        Task<List<List<string>>> ExtractTableAsync(byte[] imageBytes, string language = "eng+tam+hin");
    }
}