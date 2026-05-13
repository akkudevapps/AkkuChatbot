// Models/Dtos/TemplateDto.cs
namespace AkkuChatbot.Models.Dtos
{
    public class TemplateDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string Prompt { get; set; } = "";
        public string Category { get; set; } = "";
        public string Style { get; set; } = "";
        public string? ThumbnailUrl { get; set; }
        public bool IsPublic { get; set; }
        public bool IsSystem { get; set; }
        public string UserId { get; set; } = "";
        public string UserName { get; set; } = "";
        public DateTime CreatedAt { get; set; }
        public int CoinAwarded { get; set; }

        // 🆕 Image Generation Settings
        public string FluxModel { get; set; } = "flux";
        public string? NegativePrompt { get; set; }
        public int Width { get; set; } = 1024;
        public int Height { get; set; } = 1024;
        public int Steps { get; set; } = 20;
        public double GuidanceScale { get; set; } = 7.5;
        public int? Seed { get; set; }
    }

    public class CreateTemplateDto
    {
        public string Title { get; set; } = "";
        public string Prompt { get; set; } = "";
        public string Category { get; set; } = "";
        public string Style { get; set; } = "";
        public string? ThumbnailUrl { get; set; }
        public bool IsPublic { get; set; } = true;

        // 🆕 Image Generation Settings
        public string FluxModel { get; set; } = "flux";
        public string? NegativePrompt { get; set; }
        public int Width { get; set; } = 1024;
        public int Height { get; set; } = 1024;
        public int Steps { get; set; } = 20;
        public double GuidanceScale { get; set; } = 7.5;
        public int? Seed { get; set; }
    }
}