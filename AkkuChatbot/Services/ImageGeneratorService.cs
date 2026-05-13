// Path: Services/ImageGeneratorService.cs
using System.Text.Json;

namespace AkkuChatbot.Services
{
    public class ImageGeneratorService : IImageGeneratorService
    {
        private readonly IHttpClientFactory _httpFactory;
        private readonly ILogger<ImageGeneratorService> _logger;
        private readonly IWebHostEnvironment _env;

        // Valid Pollinations model identifiers
        private static readonly HashSet<string> _validModels = new(StringComparer.OrdinalIgnoreCase)
        {
            "flux", "turbo", "flux-realism", "flux-anime",
            "flux-3d", "flux-cablyai", "any-dark"
        };

        public ImageGeneratorService(IHttpClientFactory httpFactory, ILogger<ImageGeneratorService> logger, IWebHostEnvironment env)
        {
            _httpFactory = httpFactory;
            _logger = logger;
            _env = env;
        }

        public async Task<ImageGenResult> GenerateAsync(ImageGeneratorRequest req)
        {
            try
            {
                // Validate required fields
                if (string.IsNullOrWhiteSpace(req.Prompt))
                    return new ImageGenResult { Success = false, Error = "Prompt is required." };

                // Use model as-is or fallback to flux
                string model = string.IsNullOrWhiteSpace(req.Model) ? "flux" : req.Model.Trim().ToLower();
                if (!_validModels.Contains(model))
                    _logger.LogWarning("Unknown model '{Model}' – sending anyway, Pollinations may accept it.", model);

                int width = Math.Clamp(req.Width, 256, 2048);
                int height = Math.Clamp(req.Height, 256, 2048);
                int seed = req.Seed ?? Random.Shared.Next(1, 9_999_999);

                // Build Pollinations URL
                string encodedPrompt = Uri.EscapeDataString(req.Prompt);
                string url = $"https://image.pollinations.ai/prompt/{encodedPrompt}?model={model}&width={width}&height={height}&seed={seed}&nologo=true&enhance=false";
                if (!string.IsNullOrWhiteSpace(req.NegativePrompt))
                    url += $"&negative={Uri.EscapeDataString(req.NegativePrompt)}";

                _logger.LogInformation("Pollinations request: {Url}", url);

                var http = _httpFactory.CreateClient();
                http.Timeout = TimeSpan.FromSeconds(90);
                var imageBytes = await http.GetByteArrayAsync(url);

                if (imageBytes == null || imageBytes.Length == 0)
                    return new ImageGenResult { Success = false, Error = "Empty response from Pollinations." };

                // Save image to a persistent URL (optional)
                string relativeUrl = await SaveImageToFile(imageBytes);
                return new ImageGenResult
                {
                    Success = true,
                    ImageBytes = imageBytes,
                    Url = relativeUrl
                };
            }
            catch (TaskCanceledException)
            {
                return new ImageGenResult { Success = false, Error = "Request timed out. Try a simpler prompt or smaller size." };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Image generation error");
                return new ImageGenResult { Success = false, Error = ex.Message };
            }
        }

        private async Task<string> SaveImageToFile(byte[] imageBytes)
        {
            // Create a unique filename and store in wwwroot/uploads/temp/
            string fileName = $"img_{DateTime.Now:yyyyMMddHHmmss}_{Guid.NewGuid():N}.png";
            string folder = Path.Combine(_env.WebRootPath, "uploads", "temp");
            Directory.CreateDirectory(folder);
            string fullPath = Path.Combine(folder, fileName);
            await File.WriteAllBytesAsync(fullPath, imageBytes);
            return $"/uploads/temp/{fileName}";
        }
    }
}