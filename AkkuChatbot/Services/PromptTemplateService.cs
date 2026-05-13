// Services/PromptTemplateService.cs
using AkkuChatbot.Data;
using AkkuChatbot.Models;
using AkkuChatbot.Models.Dtos;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AkkuChatbot.Services
{
    public class PromptTemplateService : IPromptTemplateService
    {
        private readonly ApplicationDbContext _db;
        private readonly ICoinService _coinService;

        public PromptTemplateService(ApplicationDbContext db, ICoinService coinService)
        {
            _db = db;
            _coinService = coinService;
        }

        // ─────────────────────────────────────────────────────────────
        //  GET: User's own templates
        // ─────────────────────────────────────────────────────────────
        public async Task<PagedTemplatesResponse> GetUserTemplatesAsync(
            string userId, int page, int pageSize,
            string? search, string? category, string? style, string? sort)
        {
            var query = _db.UserPromptTemplates
                .Include(t => t.User)
                .Where(t => t.UserId == userId);

            return await ApplyFiltersAndPagination(query, page, pageSize, search, category, style, sort);
        }

        // ─────────────────────────────────────────────────────────────
        //  GET: All public / system templates
        // ─────────────────────────────────────────────────────────────
        public async Task<PagedTemplatesResponse> GetPublicTemplatesAsync(
            int page, int pageSize,
            string? search, string? category, string? style, string? sort)
        {
            var query = _db.UserPromptTemplates
                .Include(t => t.User)
                .Where(t => t.IsPublic || t.IsSystem);

            return await ApplyFiltersAndPagination(query, page, pageSize, search, category, style, sort);
        }

        // ─────────────────────────────────────────────────────────────
        //  SHARED: Filter + Paginate + Map → TemplateDto
        // ─────────────────────────────────────────────────────────────
        private async Task<PagedTemplatesResponse> ApplyFiltersAndPagination(
            IQueryable<UserPromptTemplate> query,
            int page, int pageSize,
            string? search, string? category, string? style, string? sort)
        {
            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(t => t.Title.Contains(search) || t.Prompt.Contains(search));

            if (!string.IsNullOrWhiteSpace(category))
                query = query.Where(t => t.Category == category);

            if (!string.IsNullOrWhiteSpace(style))
                query = query.Where(t => t.Style == style);

            int totalCount = await query.CountAsync();

            query = (sort?.ToLower()) switch
            {
                "oldest" => query.OrderBy(t => t.CreatedAt),
                "popular" => query.OrderByDescending(t => t.CoinAwarded),
                _ => query.OrderByDescending(t => t.CreatedAt)
            };

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new TemplateDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Prompt = t.Prompt,
                    Category = t.Category,
                    Style = t.Style,
                    ThumbnailUrl = t.ThumbnailUrl,
                    IsPublic = t.IsPublic,
                    IsSystem = t.IsSystem,
                    UserId = t.UserId,
                    UserName = t.User != null ? (t.User.UserName ?? t.User.Email) : t.UserId,
                    CreatedAt = t.CreatedAt,
                    CoinAwarded = t.CoinAwarded,
                    // 🆕 Image settings
                    FluxModel = t.FluxModel,
                    NegativePrompt = t.NegativePrompt,
                    Width = t.Width,
                    Height = t.Height,
                    Steps = t.Steps,
                    GuidanceScale = t.GuidanceScale,
                    Seed = t.Seed
                })
                .ToListAsync();

            return new PagedTemplatesResponse
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        // ─────────────────────────────────────────────────────────────
        //  GET: Single template by ID
        // ─────────────────────────────────────────────────────────────
        public async Task<TemplateDto?> GetTemplateByIdAsync(int id)
        {
            var t = await _db.UserPromptTemplates
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (t == null) return null;

            return MapToDto(t, t.User?.UserName ?? t.User?.Email ?? t.UserId);
        }

        // ─────────────────────────────────────────────────────────────
        //  CREATE
        // ─────────────────────────────────────────────────────────────
        public async Task<TemplateDto> CreateTemplateAsync(
            string userId, string title, string prompt,
            string category, string style, string? thumbnailUrl, bool isPublic,
            string fluxModel = "flux", string? negativePrompt = null,
            int width = 1024, int height = 1024,
            int steps = 20, double guidanceScale = 7.5, int? seed = null)
        {
            var template = new UserPromptTemplate
            {
                UserId = userId,
                Title = title,
                Prompt = prompt,
                Category = category,
                Style = style,
                ThumbnailUrl = thumbnailUrl,
                IsSystem = false,
                IsPublic = isPublic,
                CreatedAt = DateTime.UtcNow,
                // 🆕 Image settings
                FluxModel = string.IsNullOrWhiteSpace(fluxModel) ? "flux" : fluxModel,
                NegativePrompt = negativePrompt,
                Width = Math.Clamp(width, 256, 2048),
                Height = Math.Clamp(height, 256, 2048),
                Steps = Math.Clamp(steps, 10, 50),
                GuidanceScale = Math.Clamp(guidanceScale, 1.0, 20.0),
                Seed = seed
            };

            if (isPublic)
            {
                bool success = await _coinService.AddCoinsAsync(
                    userId, 2, "Template creation reward", TransactionType.TemplateCreation);
                if (success) template.CoinAwarded = 2;
            }

            _db.UserPromptTemplates.Add(template);
            await _db.SaveChangesAsync();

            var user = await _db.Users.FindAsync(userId);
            return MapToDto(template, user?.UserName ?? user?.Email ?? userId);
        }

        // ─────────────────────────────────────────────────────────────
        //  DELETE
        // ─────────────────────────────────────────────────────────────
        public async Task<bool> DeleteTemplateAsync(int id, string currentUserId, bool isAdmin)
        {
            var template = await _db.UserPromptTemplates.FindAsync(id);
            if (template == null) return false;
            if (template.IsSystem && !isAdmin) return false;
            if (template.UserId != currentUserId && !isAdmin) return false;

            if (template.CoinAwarded > 0)
                await _coinService.DeductCoinsAsync(
                    template.UserId, template.CoinAwarded,
                    "Template deleted (public template removed)");

            _db.UserPromptTemplates.Remove(template);
            await _db.SaveChangesAsync();
            return true;
        }

        // ─────────────────────────────────────────────────────────────
        //  UPDATE
        // ─────────────────────────────────────────────────────────────
        public async Task<bool> UpdateTemplateAsync(
            int id, string title, string prompt,
            string category, string style, string? thumbnailUrl, bool isPublic,
            string fluxModel = "flux", string? negativePrompt = null,
            int width = 1024, int height = 1024,
            int steps = 20, double guidanceScale = 7.5, int? seed = null)
        {
            var template = await _db.UserPromptTemplates.FindAsync(id);
            if (template == null) return false;

            template.Title = title;
            template.Prompt = prompt;
            template.Category = category;
            template.Style = style;
            template.ThumbnailUrl = thumbnailUrl;
            template.IsPublic = isPublic;
            template.UpdatedAt = DateTime.UtcNow;
            // 🆕 Image settings
            template.FluxModel = string.IsNullOrWhiteSpace(fluxModel) ? "flux" : fluxModel;
            template.NegativePrompt = negativePrompt;
            template.Width = Math.Clamp(width, 256, 2048);
            template.Height = Math.Clamp(height, 256, 2048);
            template.Steps = Math.Clamp(steps, 10, 50);
            template.GuidanceScale = Math.Clamp(guidanceScale, 1.0, 20.0);
            template.Seed = seed;

            await _db.SaveChangesAsync();
            return true;
        }

        // ─────────────────────────────────────────────────────────────
        //  EXPORT → .apt file (Version 2)
        // ─────────────────────────────────────────────────────────────
        public async Task<byte[]> ExportTemplatesAsync(IEnumerable<int> ids)
        {
            var templates = await _db.UserPromptTemplates
                .Where(t => ids.Contains(t.Id))
                .ToListAsync();

            var export = new
            {
                Version = 2,
                ExportedAt = DateTime.UtcNow,
                Templates = templates.Select(t => new
                {
                    t.Title,
                    t.Prompt,
                    t.Category,
                    t.Style,
                    t.ThumbnailUrl,
                    t.IsPublic,
                    // 🆕 Image settings included in export
                    t.FluxModel,
                    t.NegativePrompt,
                    t.Width,
                    t.Height,
                    t.Steps,
                    t.GuidanceScale,
                    t.Seed
                })
            };

            return JsonSerializer.SerializeToUtf8Bytes(
                export, new JsonSerializerOptions { WriteIndented = true });
        }

        // ─────────────────────────────────────────────────────────────
        //  IMPORT ← .apt file (Version 1 & 2 compatible)
        // ─────────────────────────────────────────────────────────────
        public async Task<PagedTemplatesResponse> ImportTemplatesAsync(string userId, byte[] fileData)
        {
            var doc = JsonDocument.Parse(fileData);
            var root = doc.RootElement;
            var templates = root.GetProperty("Templates").EnumerateArray();

            foreach (var item in templates)
            {
                // Helper: safely read a string property
                string GetStr(string key, string def = "") =>
                    item.TryGetProperty(key, out var v) ? v.GetString() ?? def : def;

                bool GetBool(string key, bool def = false) =>
                    item.TryGetProperty(key, out var v) ? v.GetBoolean() : def;

                int GetInt(string key, int def = 0) =>
                    item.TryGetProperty(key, out var v) ? v.GetInt32() : def;

                double GetDbl(string key, double def = 0) =>
                    item.TryGetProperty(key, out var v) ? v.GetDouble() : def;

                bool isPublic = GetBool("IsPublic");

                var template = new UserPromptTemplate
                {
                    UserId = userId,
                    Title = GetStr("Title"),
                    Prompt = GetStr("Prompt"),
                    Category = GetStr("Category"),
                    Style = GetStr("Style"),
                    ThumbnailUrl = item.TryGetProperty("ThumbnailUrl", out var tv) ? tv.GetString() : null,
                    IsPublic = isPublic,
                    IsSystem = false,
                    CreatedAt = DateTime.UtcNow,
                    // 🆕 Image settings — backward compatible (V1 files use defaults)
                    FluxModel = GetStr("FluxModel", "flux"),
                    NegativePrompt = item.TryGetProperty("NegativePrompt", out var np) ? np.GetString() : null,
                    Width = GetInt("Width", 1024),
                    Height = GetInt("Height", 1024),
                    Steps = GetInt("Steps", 20),
                    GuidanceScale = GetDbl("GuidanceScale", 7.5),
                    Seed = item.TryGetProperty("Seed", out var sv) && sv.ValueKind != JsonValueKind.Null
                                        ? sv.GetInt32() : null
                };

                if (isPublic)
                {
                    bool success = await _coinService.AddCoinsAsync(
                        userId, 2, "Imported public template", TransactionType.Import);
                    if (success) template.CoinAwarded = 2;
                }

                _db.UserPromptTemplates.Add(template);
            }

            await _db.SaveChangesAsync();
            return await GetUserTemplatesAsync(userId, 1, 20, null, null, null, null);
        }

        // ─────────────────────────────────────────────────────────────
        //  HELPER: Entity → TemplateDto
        // ─────────────────────────────────────────────────────────────
        private static TemplateDto MapToDto(UserPromptTemplate t, string userName) => new()
        {
            Id = t.Id,
            Title = t.Title,
            Prompt = t.Prompt,
            Category = t.Category,
            Style = t.Style,
            ThumbnailUrl = t.ThumbnailUrl,
            IsPublic = t.IsPublic,
            IsSystem = t.IsSystem,
            UserId = t.UserId,
            UserName = userName,
            CreatedAt = t.CreatedAt,
            CoinAwarded = t.CoinAwarded,
            FluxModel = t.FluxModel,
            NegativePrompt = t.NegativePrompt,
            Width = t.Width,
            Height = t.Height,
            Steps = t.Steps,
            GuidanceScale = t.GuidanceScale,
            Seed = t.Seed
        };
    }
}