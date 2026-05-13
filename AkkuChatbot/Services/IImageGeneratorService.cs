// Path: Services/IImageGeneratorService.cs
namespace AkkuChatbot.Services
{
    public interface IImageGeneratorService
    {
        Task<ImageGenResult> GenerateAsync(ImageGeneratorRequest request);
    }

    public class ImageGenResult
    {
        public bool Success { get; set; }
        public byte[]? ImageBytes { get; set; }
        public string? Error { get; set; }
        public string? Url { get; set; }   // optional for direct URL
    }

    public class ImageGeneratorRequest
    {
        public string Prompt { get; set; } = "";
        public string Model { get; set; } = "flux";
        public int Width { get; set; } = 1024;
        public int Height { get; set; } = 1024;
        public int? Seed { get; set; }
        public string? NegativePrompt { get; set; }
    }
}