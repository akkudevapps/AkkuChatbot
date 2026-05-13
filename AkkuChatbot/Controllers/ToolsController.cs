using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AkkuChatbot.Services;

namespace AkkuChatbot.Controllers
{
    [Authorize]
    public class ToolsController : Controller
    {
        private readonly INativeOcrService _ocrService;   // ← வித்தியாசம்
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<ToolsController> _logger;



        public ToolsController(INativeOcrService ocrService, IWebHostEnvironment env, ILogger<ToolsController> logger)
        {
            _ocrService = ocrService;
            _env = env;
            _logger = logger;
        }

        [HttpGet]
        public IActionResult ImageToText() => View();

        /// <summary>AJAX endpoint for the new UI – extracts text</summary>
        [HttpPost]
        public async Task<IActionResult> ExtractText(IFormFile image, string lang = "eng+tam+hin", int psm = 6, bool useEasyOcr = false)
        {
            if (image == null)
                return Json(new { success = false, error = "No image" });

            try
            {
                using var ms = new MemoryStream();
                await image.CopyToAsync(ms);
                var bytes = ms.ToArray();
                string text = await _ocrService.ExtractTextAsync(bytes, lang);
                return Json(new { success = true, text });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "OCR ExtractText error");
                return Json(new { success = false, error = ex.Message });
            }
        }

        /// <summary>AJAX endpoint for table extraction</summary>
        [HttpPost]
        public async Task<IActionResult> ExtractTable(IFormFile image, string lang = "eng+tam+hin")
        {
            if (image == null)
                return Json(new { success = false, error = "No image" });

            try
            {
                using var ms = new MemoryStream();
                await image.CopyToAsync(ms);
                var bytes = ms.ToArray();
                var table = await _ocrService.ExtractTableAsync(bytes, lang);
                return Json(new { success = true, data = table });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "OCR ExtractTable error");
                return Json(new { success = false, error = ex.Message });
            }
        }

        // Add this action to the existing ToolsController
        [HttpGet]
        public IActionResult PromptTemplates()
        {
            return View();
        }

        // Optional: direct form submit support (if you still want it)
        [HttpPost]
        public async Task<IActionResult> ImageToText(IFormFile image, string lang = "eng+tam+hin")
        {
            if (image == null || image.Length == 0)
            {
                TempData["Error"] = "Please select an image file.";
                return View();
            }

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp" };
            var ext = Path.GetExtension(image.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(ext))
            {
                TempData["Error"] = "Invalid file type. Allowed: JPG, PNG, GIF, BMP, TIFF, WEBP";
                return View();
            }

            if (image.Length > 10 * 1024 * 1024)
            {
                TempData["Error"] = "File too large. Maximum size is 10MB.";
                return View();
            }

            try
            {
                using var ms = new MemoryStream();
                await image.CopyToAsync(ms);
                var bytes = ms.ToArray();
                string text = await _ocrService.ExtractTextAsync(bytes, lang);
                ViewBag.ExtractedText = text;
                ViewBag.Success = true;
                TempData["Success"] = "Text extracted successfully!";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "OCR processing error");
                TempData["Error"] = "Failed to process image. Please try again.";
                ViewBag.Success = false;
            }

            return View();
        }

        public IActionResult ImageEditor() => View();              // → ImageEditor.cshtml
        public IActionResult ImageEditorV2() => View("editor-v2");   // → editor-v2.cshtml ✅
        //public IActionResult PromptTemplates() => View();
        public IActionResult VoiceToText() => View();
        //public IActionResult ImageToText() => View();
    }
}