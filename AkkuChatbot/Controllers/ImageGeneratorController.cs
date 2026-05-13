using AkkuChatbot.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AkkuChatbot.Models;

namespace AkkuChatbot.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class ImageGeneratorController : ControllerBase
    {
        private readonly IImageGeneratorService _generator;
        private readonly ICoinService _coinService;
        private readonly ILogger<ImageGeneratorController> _logger;

        public ImageGeneratorController(
            IImageGeneratorService generator,
            ICoinService coinService,
            ILogger<ImageGeneratorController> logger)
        {
            _generator = generator;
            _coinService = coinService;
            _logger = logger;
        }

        [HttpPost("Generate")]
        public async Task<IActionResult> Generate([FromBody] GenerateRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Prompt))
                    return BadRequest(new { success = false, error = "Prompt is required." });

                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // ✅ Check balance & deduct 1 coin
                int balanceBefore = await _coinService.GetBalanceAsync(userId);
                if (balanceBefore < 1)
                    return Ok(new { success = false, error = "Insufficient coins. You need at least 1 coin to generate an image." });

                bool deducted = await _coinService.DeductCoinsAsync(userId, 1, "Image generation");
                if (!deducted)
                    return Ok(new { success = false, error = "Failed to deduct coins." });

                var svcReq = new ImageGeneratorRequest
                {
                    Prompt = request.Prompt,
                    Model = request.Model ?? "flux",
                    Width = request.Width > 0 ? request.Width : 1024,
                    Height = request.Height > 0 ? request.Height : 1024,
                    Seed = request.Seed,
                    NegativePrompt = request.NegativePrompt
                };

                var result = await _generator.GenerateAsync(svcReq);
                if (!result.Success)
                {
                    // Refund coin if generation failed
                    await _coinService.AddCoinsAsync(userId, 1, "Refund for failed image generation", TransactionType.Refund);
                    return Ok(new { success = false, error = result.Error });
                }

                int newBalance = await _coinService.GetBalanceAsync(userId);
                return Ok(new
                {
                    success = true,
                    url = result.Url,
                    newBalance = newBalance
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Generate endpoint error");
                return StatusCode(500, new { success = false, error = "Internal server error" });
            }
        }

        public class GenerateRequest
        {
            public string Prompt { get; set; } = "";
            public string Model { get; set; } = "flux";
            public int Width { get; set; } = 1024;
            public int Height { get; set; } = 1024;
            public int? Seed { get; set; }
            public string? NegativePrompt { get; set; }
            public int Steps { get; set; } = 20;   // 🆕
            public double GuidanceScale { get; set; } = 7.5; // 🆕
        }
    }
}