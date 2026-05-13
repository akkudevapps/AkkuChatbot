// Services/IPromptTemplateService.cs
using AkkuChatbot.Models;
using AkkuChatbot.Models.Dtos;

namespace AkkuChatbot.Services
{
    public interface IPromptTemplateService
    {
        Task<PagedTemplatesResponse> GetUserTemplatesAsync(
            string userId, int page, int pageSize,
            string? search, string? category, string? style, string? sort);

        Task<PagedTemplatesResponse> GetPublicTemplatesAsync(
            int page, int pageSize,
            string? search, string? category, string? style, string? sort);

        Task<TemplateDto?> GetTemplateByIdAsync(int id);

        Task<TemplateDto> CreateTemplateAsync(
            string userId, string title, string prompt,
            string category, string style, string? thumbnailUrl, bool isPublic,
            string fluxModel = "flux", string? negativePrompt = null,
            int width = 1024, int height = 1024,
            int steps = 20, double guidanceScale = 7.5, int? seed = null);

        Task<bool> DeleteTemplateAsync(int id, string currentUserId, bool isAdmin);

        Task<bool> UpdateTemplateAsync(
            int id, string title, string prompt,
            string category, string style, string? thumbnailUrl, bool isPublic,
            string fluxModel = "flux", string? negativePrompt = null,
            int width = 1024, int height = 1024,
            int steps = 20, double guidanceScale = 7.5, int? seed = null);

        Task<byte[]> ExportTemplatesAsync(IEnumerable<int> ids);

        Task<PagedTemplatesResponse> ImportTemplatesAsync(string userId, byte[] fileData);
    }

    public class PagedTemplatesResponse
    {
        public List<TemplateDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    }
}