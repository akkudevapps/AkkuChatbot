using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using AkkuChatbot.Models;

namespace AkkuChatbot.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<ChatSession> ChatSessions { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<CoinTransaction> CoinTransactions { get; set; }
        public DbSet<SessionGroup> SessionGroups { get; set; }
        public DbSet<SessionGroupMember> SessionGroupMembers { get; set; }
        public DbSet<UserPromptTemplate> UserPromptTemplates { get; set; }
        public DbSet<Artwork> Artworks { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // ── ChatSession → ChatMessages ─────────────────────────────
            // ✅ NoAction: SQL Server cascade cycle fix
            builder.Entity<ChatSession>()
                .HasMany(s => s.Messages)
                .WithOne(m => m.Session)
                .HasForeignKey(m => m.SessionId)
                .OnDelete(DeleteBehavior.NoAction);   // ← KEY FIX

            // ── ChatMessage → User ─────────────────────────────────────
            builder.Entity<ChatMessage>()
                .HasOne(m => m.User)
                .WithMany(u => u.ChatMessages)
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.NoAction);   // ← KEY FIX

            // ── SessionGroup ───────────────────────────────────────────
            builder.Entity<SessionGroup>()
                .HasMany(g => g.Members)
                .WithOne(m => m.Group)
                .HasForeignKey(m => m.GroupId);

            builder.Entity<SessionGroupMember>()
                .HasOne(m => m.Session)
                .WithMany()
                .HasForeignKey(m => m.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<SessionGroupMember>()
                .HasOne(m => m.Group)
                .WithMany(g => g.Members)
                .HasForeignKey(m => m.GroupId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<SessionGroup>()
                .HasOne(g => g.User)
                .WithMany()
                .HasForeignKey(g => g.UserId);

            // ── Artwork ────────────────────────────────────────────────
            builder.Entity<Artwork>()
                .HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId);

            // ══════════════════════════════════════════════════════════
            //  SEED — SYSTEM PROMPT TEMPLATES
            //  ✅ All new image fields included
            //  ✅ Fixed DateTime (no UtcNow)
            // ══════════════════════════════════════════════════════════
            var sys = "system";
            var dt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            builder.Entity<UserPromptTemplate>().HasData(

                new UserPromptTemplate
                {
                    Id = -101,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "Cinematic Movie Poster",
                    Prompt = "Create a cinematic movie poster for: [film title]. Genre: [action/drama/horror/sci-fi]. Include dramatic lighting, a central hero/villain figure, and a tagline at the bottom. Ultra-detailed, 4K, film grain.",
                    Category = "Cinematic",
                    Style = "Movie Poster",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=101",
                    FluxModel = "flux-realism",
                    NegativePrompt = "blurry, low quality, text errors",
                    Width = 1024,
                    Height = 1536,
                    Steps = 30,
                    GuidanceScale = 7.5,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -102,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "Fantasy Character Portrait",
                    Prompt = "Fantasy character portrait of: [character name]. Race: [elf/dwarf/orc/human]. Class: [mage/warrior/rogue]. Magical glowing eyes, intricate armor, mystical background, highly detailed digital painting.",
                    Category = "Digital Art",
                    Style = "Fantasy",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=102",
                    FluxModel = "flux-anime",
                    NegativePrompt = "deformed, ugly, bad anatomy",
                    Width = 896,
                    Height = 1152,
                    Steps = 30,
                    GuidanceScale = 8.0,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -103,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "Vintage Travel Poster",
                    Prompt = "Vintage travel poster for: [destination]. Style: 1920s Art Deco. Colors: muted retro palette. Paper texture, distressed edges, nostalgic feel.",
                    Category = "Photography",
                    Style = "Vintage",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=103",
                    FluxModel = "flux",
                    NegativePrompt = "modern, digital, sharp",
                    Width = 768,
                    Height = 1024,
                    Steps = 25,
                    GuidanceScale = 7.0,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -104,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "Product Packaging Mockup",
                    Prompt = "Photorealistic product packaging mockup for: [product name]. Box on a white background, studio lighting, 8K, with brand logo, ingredients list, and barcode. Marketing-ready.",
                    Category = "Photography",
                    Style = "Product",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=104",
                    FluxModel = "flux-realism",
                    NegativePrompt = "blurry, watermark, distorted",
                    Width = 1024,
                    Height = 1024,
                    Steps = 28,
                    GuidanceScale = 7.5,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -105,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "Monochrome Ink Sketch",
                    Prompt = "Ink sketch of: [subject]. Black ink on off-white paper, cross-hatching, expressive lines, no color, high contrast, artistic, fine art style.",
                    Category = "Digital Art",
                    Style = "Sketch",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=105",
                    FluxModel = "any-dark",
                    NegativePrompt = "color, photograph, digital",
                    Width = 1024,
                    Height = 1024,
                    Steps = 20,
                    GuidanceScale = 6.0,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -106,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "SQL Query Optimizer",
                    Prompt = "Optimize the following SQL query. Add proper indexes, rewrite inefficient joins, use CTEs where beneficial, and explain performance gains.",
                    Category = "Code",
                    Style = "SQL",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=106",
                    FluxModel = "flux",
                    NegativePrompt = null,
                    Width = 1024,
                    Height = 1024,
                    Steps = 20,
                    GuidanceScale = 7.5,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -107,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "Python Debugger Assistant",
                    Prompt = "Debug this Python code. Identify syntax errors, logical mistakes, and edge cases. Provide fixed code with comments explaining each correction.",
                    Category = "Code",
                    Style = "Python",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=107",
                    FluxModel = "flux",
                    NegativePrompt = null,
                    Width = 1024,
                    Height = 1024,
                    Steps = 20,
                    GuidanceScale = 7.5,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -108,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "REST API Documentation",
                    Prompt = "Generate OpenAPI (Swagger) documentation for the following API endpoints. Include request/response schemas, example values, error codes, and authentication method.",
                    Category = "Code",
                    Style = "API",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=108",
                    FluxModel = "flux",
                    NegativePrompt = null,
                    Width = 1024,
                    Height = 1024,
                    Steps = 20,
                    GuidanceScale = 7.5,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -109,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "Persuasive Sales Email",
                    Prompt = "Write a persuasive sales email for: [product/service]. Target audience: [description]. Highlight benefits, include urgency and end with a clear call-to-action.",
                    Category = "Writing",
                    Style = "Sales",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=109",
                    FluxModel = "flux",
                    NegativePrompt = null,
                    Width = 1024,
                    Height = 1024,
                    Steps = 20,
                    GuidanceScale = 7.5,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -110,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "Product Review Amazon Style",
                    Prompt = "Write a detailed product review for: [product name]. Rating: 4.5/5. Include pros, cons, technical specifications, and a personal usage story.",
                    Category = "Writing",
                    Style = "Review",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=110",
                    FluxModel = "flux",
                    NegativePrompt = null,
                    Width = 1024,
                    Height = 1024,
                    Steps = 20,
                    GuidanceScale = 7.5,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -111,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "How-To Guide",
                    Prompt = "Write a step-by-step guide on: [topic]. Include numbered steps, warnings, tool/materials list, and a troubleshooting section. Clear and beginner-friendly.",
                    Category = "Writing",
                    Style = "Tutorial",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=111",
                    FluxModel = "flux",
                    NegativePrompt = null,
                    Width = 1024,
                    Height = 1024,
                    Steps = 20,
                    GuidanceScale = 7.5,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -112,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "LinkedIn Carousel Post",
                    Prompt = "Create a LinkedIn carousel post (6 slides) about: [topic]. Each slide has a heading, short bullet points, and an engaging question. End with a call-to-action.",
                    Category = "Writing",
                    Style = "Social Media",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=112",
                    FluxModel = "flux",
                    NegativePrompt = null,
                    Width = 1024,
                    Height = 1024,
                    Steps = 20,
                    GuidanceScale = 7.5,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -113,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "ROI Calculator Explanation",
                    Prompt = "Explain how to calculate Return on Investment (ROI) for [project/software]. Provide formula, example with numbers, and interpretation of results.",
                    Category = "Analysis",
                    Style = "Business",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=113",
                    FluxModel = "flux",
                    NegativePrompt = null,
                    Width = 1024,
                    Height = 1024,
                    Steps = 20,
                    GuidanceScale = 7.5,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -114,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "SWOT Competitor Analysis",
                    Prompt = "Perform a SWOT analysis for [competitor name] in the [industry] sector. Include specific examples and strategic recommendations.",
                    Category = "Analysis",
                    Style = "Strategy",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=114",
                    FluxModel = "flux",
                    NegativePrompt = null,
                    Width = 1024,
                    Height = 1024,
                    Steps = 20,
                    GuidanceScale = 7.5,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -115,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "Data Cleaning Checklist",
                    Prompt = "List 10 essential steps to clean a messy dataset. Include handling missing values, removing duplicates, standardizing formats, outlier detection.",
                    Category = "Analysis",
                    Style = "Data Science",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=115",
                    FluxModel = "flux",
                    NegativePrompt = null,
                    Width = 1024,
                    Height = 1024,
                    Steps = 20,
                    GuidanceScale = 7.5,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -116,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "English to Hinglish Translation",
                    Prompt = "Translate the following text into Hinglish (Hindi written in Latin script). Keep the informal, friendly tone as if messaging a friend.",
                    Category = "Translate",
                    Style = "Hinglish",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=116",
                    FluxModel = "flux",
                    NegativePrompt = null,
                    Width = 1024,
                    Height = 1024,
                    Steps = 20,
                    GuidanceScale = 7.5,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -117,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "Formal to Casual Rewriter",
                    Prompt = "Rewrite the following formal paragraph into casual, conversational style for WhatsApp. Use short sentences, contractions, and emojis.",
                    Category = "Translate",
                    Style = "Casual",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=117",
                    FluxModel = "flux",
                    NegativePrompt = null,
                    Width = 1024,
                    Height = 1024,
                    Steps = 20,
                    GuidanceScale = 7.5,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -118,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "Glossary Creator",
                    Prompt = "Extract key terms from the following document and create a glossary. Sort alphabetically. Each entry: term - definition (one sentence).",
                    Category = "Translate",
                    Style = "Technical Writing",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=118",
                    FluxModel = "flux",
                    NegativePrompt = null,
                    Width = 1024,
                    Height = 1024,
                    Steps = 20,
                    GuidanceScale = 7.5,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -119,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "Tamil Motivational Quote",
                    Prompt = "சிறந்த தமிழ் மேற்கோளை உருவாக்குக: [topic]. மேற்கோள் 15-25 வார்த்தைகளில் இருக்க வேண்டும். பாரம்பரிய தமிழ் இலக்கிய பாணியில் அமைய வேண்டும்.",
                    Category = "Tamil",
                    Style = "Quote",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=119",
                    FluxModel = "flux",
                    NegativePrompt = null,
                    Width = 1024,
                    Height = 1024,
                    Steps = 20,
                    GuidanceScale = 7.5,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -120,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "Tamil News Headline",
                    Prompt = "தற்போதைய [topic] பற்றிய செய்தித் தலைப்பை எழுதுக. பத்திரிகை பாணியில், சுருக்கமாக, கவனத்தை ஈர்க்கும் வண்ணம். துணைத்தலைப்பும் சேர்க்கவும்.",
                    Category = "Tamil",
                    Style = "News",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=120",
                    FluxModel = "flux",
                    NegativePrompt = null,
                    Width = 1024,
                    Height = 1024,
                    Steps = 20,
                    GuidanceScale = 7.5,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -1,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "Photorealistic Product",
                    Prompt = "Professional product photography of [subject], white background, studio lighting, 8K",
                    Category = "Photography",
                    Style = "Studio",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=1",
                    FluxModel = "flux-realism",
                    NegativePrompt = "blurry, dark, shadow",
                    Width = 1024,
                    Height = 1024,
                    Steps = 25,
                    GuidanceScale = 7.5,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -2,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "Digital Concept Art",
                    Prompt = "Digital concept art of [subject], vibrant colors, ArtStation trending, highly detailed",
                    Category = "Digital Art",
                    Style = "Concept",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=2",
                    FluxModel = "flux-anime",
                    NegativePrompt = "blurry, low quality",
                    Width = 1024,
                    Height = 1024,
                    Steps = 30,
                    GuidanceScale = 8.0,
                    Seed = null
                },

                new UserPromptTemplate
                {
                    Id = -5,
                    UserId = sys,
                    CreatedAt = dt,
                    CoinAwarded = 0,
                    IsSystem = true,
                    IsPublic = true,
                    Title = "Photorealistic Image",
                    Prompt = "Generate a photorealistic image of: [describe subject here]. Use natural lighting, high detail, 4K quality.",
                    Category = "image",
                    Style = "Photorealistic",
                    ThumbnailUrl = "https://picsum.photos/120/80?random=5",
                    FluxModel = "flux-realism",
                    NegativePrompt = "cartoon, anime, painting",
                    Width = 1024,
                    Height = 1024,
                    Steps = 28,
                    GuidanceScale = 7.5,
                    Seed = null
                }
            );
        }
    }
}