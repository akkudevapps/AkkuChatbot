// Models/UserPromptTemplate.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AkkuChatbot.Models
{
    public class UserPromptTemplate
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Prompt { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Category { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Style { get; set; } = string.Empty;

        public string? ThumbnailUrl { get; set; }

        public bool IsSystem { get; set; } = false;
        public bool IsPublic { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public int CoinAwarded { get; set; } = 0;

        // ══════════════════════════════════════════
        //  🆕 IMAGE GENERATION SETTINGS
        // ══════════════════════════════════════════

        /// <summary>Flux model: flux | turbo | flux-realism | flux-anime | flux-3d | any-dark</summary>
        [MaxLength(50)]
        public string FluxModel { get; set; } = "flux";

        /// <summary>Things to avoid in the image</summary>
        public string? NegativePrompt { get; set; }

        /// <summary>Output width in pixels (256–2048)</summary>
        public int Width { get; set; } = 1024;

        /// <summary>Output height in pixels (256–2048)</summary>
        public int Height { get; set; } = 1024;

        /// <summary>Inference steps / quality (10–50)</summary>
        public int Steps { get; set; } = 20;

        /// <summary>Guidance scale / CFG (1–20)</summary>
        public double GuidanceScale { get; set; } = 7.5;

        /// <summary>Reproducibility seed — null = random every time</summary>
        public int? Seed { get; set; }

        // Navigation
        [ForeignKey(nameof(UserId))]
        public virtual ApplicationUser? User { get; set; }
    }
}