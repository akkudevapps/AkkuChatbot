namespace AkkuChatbot.Models.ImageGeneration
{
    public class GenerateRequest
    {
        public string Prompt { get; set; } = string.Empty;
        public string Model { get; set; } = "pollinations";
        public int Width { get; set; } = 512;
        public int Height { get; set; } = 512;
        public string? NegativePrompt { get; set; }
        public string? Style { get; set; }
        public int? Seed { get; set; }
    }

    public class GenerateResponse
    {
        public bool Success { get; set; }
        public string? ImageUrl { get; set; }
        public string? Error { get; set; }
        public int CoinsUsed { get; set; }
        public int NewBalance { get; set; }
    }
}