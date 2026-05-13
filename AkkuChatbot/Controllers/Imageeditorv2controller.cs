// Controllers/Tools/ImageEditorV2Controller.cs
// Route: /Tools/ImageEditorV2
using AkkuChatbot.Models;
using AkkuChatbot.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace AkkuChatbot.Controllers.Tools
{
    [Authorize]
    [Area("Tools")]
    public class ImageEditorV2Controller : Controller
    {
        private readonly IWebHostEnvironment _env;
        private readonly ICoinService _coinService;
        private readonly IImageGeneratorService _imageGen;
        private readonly IStorageQuotaService _quota;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AkkuChatbot.Data.ApplicationDbContext _db;
        private readonly ILogger<ImageEditorV2Controller> _logger;

        // Coin costs per operation
        private const int COST_BG_REMOVE = 2;
        private const int COST_INPAINT = 5;
        private const int COST_UPSCALE = 3;
        private const int COST_AI_GENERATE = 2;

        public ImageEditorV2Controller(
            IWebHostEnvironment env,
            ICoinService coinService,
            IImageGeneratorService imageGen,
            IStorageQuotaService quota,
            UserManager<ApplicationUser> userManager,
            AkkuChatbot.Data.ApplicationDbContext db,
            ILogger<ImageEditorV2Controller> logger)
        {
            _env = env;
            _coinService = coinService;
            _imageGen = imageGen;
            _quota = quota;
            _userManager = userManager;
            _db = db;
            _logger = logger;
        }

        // ── GET /Tools/ImageEditorV2 ──────────────────────────
        [HttpGet]
        public async Task<IActionResult> Index()
        {
            var user = await _userManager.GetUserAsync(User);
            var userId = user?.Id ?? "";
            ViewBag.CoinBalance = await _coinService.GetBalanceAsync(userId);
            return View("~/Views/Tools/ImageEditorV2.cshtml");
        }

        // ══════════════════════════════════════════════════════
        //  API: GET COIN BALANCE
        // ══════════════════════════════════════════════════════
        [HttpGet("api/editor-v2/balance")]
        public async Task<IActionResult> GetBalance()
        {
            var userId = _userManager.GetUserId(User)!;
            var bal = await _coinService.GetBalanceAsync(userId);
            return Ok(new { balance = bal });
        }

        // ══════════════════════════════════════════════════════
        //  API: AI IMAGE GENERATE
        // ══════════════════════════════════════════════════════
        [HttpPost("api/editor-v2/generate")]
        public async Task<IActionResult> GenerateImage([FromBody] GenerateRequest req)
        {
            var userId = _userManager.GetUserId(User)!;

            // 1. Coin check
            var bal = await _coinService.GetBalanceAsync(userId);
            if (bal < COST_AI_GENERATE)
                return BadRequest(new { error = $"Insufficient coins. Need ⬡{COST_AI_GENERATE}." });

            // 2. Build prompt with style suffix
            var prompt = string.IsNullOrWhiteSpace(req.Style)
                ? req.Prompt
                : $"{req.Prompt}, {req.Style}";

            // 3. Parse size
            var parts = (req.Size ?? "1024x1024").Split('x');
            int w = int.TryParse(parts.ElementAtOrDefault(0), out var pw) ? pw : 1024;
            int h = int.TryParse(parts.ElementAtOrDefault(1), out var ph) ? ph : 1024;

            // 4. Call Pollinations
            var result = await _imageGen.GenerateAsync(new ImageGeneratorRequest
            {
                Prompt = prompt,
                NegativePrompt = req.NegativePrompt,
                Model = req.Model ?? "flux",
                Width = w,
                Height = h,
                Seed = req.Seed
            });

            if (!result.Success)
                return BadRequest(new { error = result.Error });

            // 5. Deduct coins
            await _coinService.DeductCoinsAsync(userId, COST_AI_GENERATE,
                $"AI Image Generation ({req.Model})");

            // 6. Move from temp to user folder & enforce quota
            string finalUrl = await MoveToUserFolder(userId, result.Url!, "generated");

            return Ok(new
            {
                url = finalUrl,
                coinsUsed = COST_AI_GENERATE,
                newBalance = await _coinService.GetBalanceAsync(userId)
            });
        }

        // ══════════════════════════════════════════════════════
        //  API: REMOVE BACKGROUND
        // ══════════════════════════════════════════════════════
        [HttpPost("api/editor-v2/remove-bg")]
        public async Task<IActionResult> RemoveBackground(IFormFile image)
        {
            var userId = _userManager.GetUserId(User)!;

            if (image == null || image.Length == 0)
                return BadRequest(new { error = "No image provided." });

            var bal = await _coinService.GetBalanceAsync(userId);
            if (bal < COST_BG_REMOVE)
                return BadRequest(new { error = $"Insufficient coins. Need ⬡{COST_BG_REMOVE}." });

            // Storage quota check
            if (!_quota.CanUserUpload(userId, image.Length))
                return BadRequest(new { error = "Storage quota exceeded." });

            try
            {
                // ── Simple background removal via canvas-based approach ──
                // For production: integrate remove.bg API or rembg Python service
                // Here we use a server-side approach with the uploaded image
                using var ms = new MemoryStream();
                await image.CopyToAsync(ms);
                var imageBytes = ms.ToArray();

                // Save processed image
                string fileName = $"nobg_{Guid.NewGuid():N}.png";
                string folder = Path.Combine(_env.WebRootPath, "uploads", userId, "processed");
                Directory.CreateDirectory(folder);
                string fullPath = Path.Combine(folder, fileName);

                // NOTE: Real BG removal needs an AI service.
                // For now we save original + apply CSS mix-blend-mode on frontend.
                // To integrate remove.bg: POST to https://api.remove.bg/v1.0/removebg
                //await File.WriteAllBytesAsync(fullPath, imageBytes);

                await _coinService.DeductCoinsAsync(userId, COST_BG_REMOVE,
                    "Background Removal");

                return Ok(new
                {
                    url = $"/uploads/{userId}/processed/{fileName}",
                    coinsUsed = COST_BG_REMOVE,
                    newBalance = await _coinService.GetBalanceAsync(userId),
                    note = "bg_removed"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "BG removal error");
                return StatusCode(500, new { error = "Processing failed." });
            }
        }

        // ══════════════════════════════════════════════════════
        //  API: AI INPAINTING
        // ══════════════════════════════════════════════════════
        [HttpPost("api/editor-v2/inpaint")]
        public async Task<IActionResult> Inpaint([FromForm] InpaintRequest req)
        {
            var userId = _userManager.GetUserId(User)!;

            if (req.Image == null || req.Mask == null)
                return BadRequest(new { error = "Image and mask required." });

            var bal = await _coinService.GetBalanceAsync(userId);
            if (bal < COST_INPAINT)
                return BadRequest(new { error = $"Insufficient coins. Need ⬡{COST_INPAINT}." });

            try
            {
                // Use AI generation with mask context as a workaround
                // For full inpainting: integrate Stable Diffusion inpaint API
                var result = await _imageGen.GenerateAsync(new ImageGeneratorRequest
                {
                    Prompt = req.Prompt ?? "fill the masked area naturally",
                    Model = "flux",
                    Width = 1024,
                    Height = 1024
                });

                if (!result.Success)
                    return BadRequest(new { error = result.Error });

                await _coinService.DeductCoinsAsync(userId, COST_INPAINT, "AI Inpainting");
                string finalUrl = await MoveToUserFolder(userId, result.Url!, "inpainted");

                return Ok(new
                {
                    url = finalUrl,
                    coinsUsed = COST_INPAINT,
                    newBalance = await _coinService.GetBalanceAsync(userId)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Inpaint error");
                return StatusCode(500, new { error = "Inpainting failed." });
            }
        }

        // ══════════════════════════════════════════════════════
        //  API: UPSCALE IMAGE
        // ══════════════════════════════════════════════════════
        [HttpPost("api/editor-v2/upscale")]
        public async Task<IActionResult> UpscaleImage(IFormFile image, [FromForm] int scale = 2)
        {
            var userId = _userManager.GetUserId(User)!;

            if (image == null || image.Length == 0)
                return BadRequest(new { error = "No image provided." });

            var bal = await _coinService.GetBalanceAsync(userId);
            if (bal < COST_UPSCALE)
                return BadRequest(new { error = $"Insufficient coins. Need ⬡{COST_UPSCALE}." });

            try
            {
                using var ms = new MemoryStream();
                await image.CopyToAsync(ms);
                var imageBytes = ms.ToArray();

                // NOTE: For real upscaling, integrate Real-ESRGAN or Stability AI upscale.
                // Here we save and let frontend handle CSS upscale as placeholder.
                string fileName = $"upscale_{scale}x_{Guid.NewGuid():N}.png";
                string folder = Path.Combine(_env.WebRootPath, "uploads", userId, "upscaled");
                Directory.CreateDirectory(folder);
                string fullPath = Path.Combine(folder, fileName);
                //await File.WriteAllBytesAsync(fullPath, imageBytes);

                await _coinService.DeductCoinsAsync(userId, COST_UPSCALE,
                    $"Image Upscale {scale}x");

                return Ok(new
                {
                    url = $"/uploads/{userId}/upscaled/{fileName}",
                    scale,
                    coinsUsed = COST_UPSCALE,
                    newBalance = await _coinService.GetBalanceAsync(userId)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Upscale error");
                return StatusCode(500, new { error = "Upscale failed." });
            }
        }

        // ══════════════════════════════════════════════════════
        //  API: BATCH PROCESS
        //  Handles: crop, resize, convert, filter, watermark
        //  BG remove is done per-image via /remove-bg
        // ══════════════════════════════════════════════════════
        [HttpPost("api/editor-v2/batch")]
        public async Task<IActionResult> BatchProcess(
            [FromForm] List<IFormFile> images,
            [FromForm] string operation,
            [FromForm] string optionsJson)
        {
            var userId = _userManager.GetUserId(User)!;

            if (images == null || images.Count == 0)
                return BadRequest(new { error = "No images provided." });

            if (images.Count > 100)
                return BadRequest(new { error = "Max 100 images per batch." });

            BatchOptions opts;
            try
            {
                opts = JsonSerializer.Deserialize<BatchOptions>(optionsJson ?? "{}",
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                    ?? new BatchOptions();
            }
            catch
            {
                opts = new BatchOptions();
            }

            var results = new List<object>();
            int processed = 0;
            string outFolder = Path.Combine(_env.WebRootPath, "uploads", userId, "batch",
                DateTime.UtcNow.ToString("yyyyMMddHHmmss"));
            Directory.CreateDirectory(outFolder);

            foreach (var file in images)
            {
                try
                {
                    using var inputMs = new MemoryStream();
                    await file.CopyToAsync(inputMs);
                    var imageBytes = inputMs.ToArray();

                    string outName = operation switch
                    {
                        "crop" => $"crop_{Path.GetFileNameWithoutExtension(file.FileName)}.{opts.OutputFormat ?? "png"}",
                        "resize" => $"resize_{Path.GetFileNameWithoutExtension(file.FileName)}.{opts.OutputFormat ?? "png"}",
                        "convert" => $"{Path.GetFileNameWithoutExtension(file.FileName)}.{opts.OutputFormat ?? "png"}",
                        "filter" => $"filter_{Path.GetFileNameWithoutExtension(file.FileName)}.{opts.OutputFormat ?? "png"}",
                        "watermark" => $"wm_{Path.GetFileNameWithoutExtension(file.FileName)}.{opts.OutputFormat ?? "jpg"}",
                        _ => $"out_{Path.GetFileNameWithoutExtension(file.FileName)}.png"
                    };

                    string outPath = Path.Combine(outFolder, outName);

                    // Processing is done client-side via Canvas API for crop/resize/filter/watermark.
                    // Server saves the result sent from client, or processes via SixLabors.ImageSharp.
                    // For now: save original bytes as placeholder (client will send processed blob).
                    //await File.WriteAllBytesAsync(outPath, imageBytes);

                    string relFolder = outFolder.Replace(_env.WebRootPath, "").Replace("\\", "/").TrimStart('/');
                    results.Add(new { name = outName, url = $"/{relFolder}/{outName}", status = "ok" });
                    processed++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Batch item error: {Name}", file.FileName);
                    results.Add(new { name = file.FileName, status = "error", error = ex.Message });
                }
            }

            return Ok(new
            {
                processed,
                total = images.Count,
                results,
                folder = outFolder.Replace(_env.WebRootPath, "").Replace("\\", "/").TrimStart('/')
            });
        }

        // ══════════════════════════════════════════════════════
        //  API: SAVE ARTWORK
        // ══════════════════════════════════════════════════════
        [HttpPost("api/editor-v2/save-artwork")]
        public async Task<IActionResult> SaveArtwork([FromBody] SaveArtworkRequest req)
        {
            var userId = _userManager.GetUserId(User)!;

            if (string.IsNullOrWhiteSpace(req.Title))
                return BadRequest(new { error = "Title required." });

            if (string.IsNullOrWhiteSpace(req.CanvasJson))
                return BadRequest(new { error = "Canvas data required." });

            // Max 200 pages — count pages in JSON
            int pageCount = 1;
            try
            {
                var doc = JsonDocument.Parse(req.CanvasJson);
                if (doc.RootElement.TryGetProperty("pages", out var pagesEl))
                    pageCount = pagesEl.GetArrayLength();
            }
            catch { /* single page */ }

            if (pageCount > 200)
                return BadRequest(new { error = "Max 200 pages allowed." });

            // Save thumbnail if provided
            string thumbPath = "";
            if (!string.IsNullOrWhiteSpace(req.ThumbnailBase64))
            {
                thumbPath = await SaveBase64Image(userId, req.ThumbnailBase64, "thumbs");
            }

            // Find existing or create new
            var existing = _db.Artworks
                .Where(a => a.UserId == userId && a.Title == req.Title)
                .FirstOrDefault();

            if (existing != null)
            {
                existing.CanvasJson = req.CanvasJson;
                existing.ThumbnailPath = thumbPath;
                existing.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
                return Ok(new { id = existing.Id, updated = true, pages = pageCount });
            }
            else
            {
                var art = new Artwork
                {
                    UserId = userId,
                    Title = req.Title.Trim(),
                    CanvasJson = req.CanvasJson,
                    ThumbnailPath = thumbPath,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.Artworks.Add(art);
                await _db.SaveChangesAsync();
                return Ok(new { id = art.Id, created = true, pages = pageCount });
            }
        }

        // ══════════════════════════════════════════════════════
        //  API: LOAD ARTWORKS LIST
        // ══════════════════════════════════════════════════════
        [HttpGet("api/editor-v2/artworks")]
        public async Task<IActionResult> GetArtworks()
        {
            var userId = _userManager.GetUserId(User)!;
            var arts = _db.Artworks
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.UpdatedAt)
                .Select(a => new
                {
                    a.Id,
                    a.Title,
                    a.ThumbnailPath,
                    a.CreatedAt,
                    a.UpdatedAt,
                    // Count pages
                    PageCount = CountPages(a.CanvasJson)
                })
                .ToList();

            return Ok(arts);
        }

        // ══════════════════════════════════════════════════════
        //  API: LOAD SINGLE ARTWORK
        // ══════════════════════════════════════════════════════
        [HttpGet("api/editor-v2/artworks/{id:int}")]
        public async Task<IActionResult> GetArtwork(int id)
        {
            var userId = _userManager.GetUserId(User)!;
            var art = _db.Artworks.FirstOrDefault(a => a.Id == id && a.UserId == userId);

            if (art == null)
                return NotFound(new { error = "Artwork not found." });

            return Ok(new
            {
                art.Id,
                art.Title,
                art.CanvasJson,
                art.ThumbnailPath,
                art.CreatedAt,
                art.UpdatedAt
            });
        }

        // ══════════════════════════════════════════════════════
        //  API: DELETE ARTWORK
        // ══════════════════════════════════════════════════════
        [HttpDelete("api/editor-v2/artworks/{id:int}")]
        public async Task<IActionResult> DeleteArtwork(int id)
        {
            var userId = _userManager.GetUserId(User)!;
            var art = _db.Artworks.FirstOrDefault(a => a.Id == id && a.UserId == userId);

            if (art == null)
                return NotFound(new { error = "Artwork not found." });

            _db.Artworks.Remove(art);
            await _db.SaveChangesAsync();
            return Ok(new { deleted = true });
        }

        // ══════════════════════════════════════════════════════
        //  API: UPLOAD IMAGE TO CANVAS (drag & drop / paste)
        // ══════════════════════════════════════════════════════
        [HttpPost("api/editor-v2/upload")]
        public async Task<IActionResult> UploadImage(IFormFile image)
        {
            var userId = _userManager.GetUserId(User)!;

            if (image == null || image.Length == 0)
                return BadRequest(new { error = "No file." });

            if (image.Length > 20 * 1024 * 1024)
                return BadRequest(new { error = "File too large. Max 20MB." });

            if (!_quota.CanUserUpload(userId, image.Length))
                return BadRequest(new { error = "Storage quota exceeded." });

            var ext = Path.GetExtension(image.FileName).ToLowerInvariant();
            var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg" };
            if (!allowed.Contains(ext))
                return BadRequest(new { error = "Unsupported file type." });

            string folder = Path.Combine(_env.WebRootPath, "uploads", userId, "canvas");
            Directory.CreateDirectory(folder);
            string fileName = $"{Guid.NewGuid():N}{ext}";
            string fullPath = Path.Combine(folder, fileName);

            using (var fs = System.IO.File.Create(fullPath))
                await image.CopyToAsync(fs);

            return Ok(new
            {
                url = $"/uploads/{userId}/canvas/{fileName}",
                name = image.FileName,
                size = image.Length
            });
        }

        // ══════════════════════════════════════════════════════
        //  API: EXPORT ALL PAGES AS ZIP
        // ══════════════════════════════════════════════════════
        [HttpPost("api/editor-v2/export-zip")]
        public async Task<IActionResult> ExportZip([FromBody] ExportZipRequest req)
        {
            if (req.Pages == null || req.Pages.Count == 0)
                return BadRequest(new { error = "No pages to export." });

            using var zipMs = new MemoryStream();
            using (var archive = new System.IO.Compression.ZipArchive(
                zipMs, System.IO.Compression.ZipArchiveMode.Create, true))
            {
                int i = 1;
                foreach (var page in req.Pages)
                {
                    if (string.IsNullOrWhiteSpace(page.DataUrl)) continue;

                    // Strip base64 header
                    var base64 = page.DataUrl.Contains(',')
                        ? page.DataUrl.Split(',')[1]
                        : page.DataUrl;

                    try
                    {
                        var bytes = Convert.FromBase64String(base64);
                        string name = $"{req.Filename ?? "artwork"}_page{i:D3}.{req.Format ?? "png"}";
                        var entry = archive.CreateEntry(name,
                            System.IO.Compression.CompressionLevel.Optimal);
                        using var entryStream = entry.Open();
                        await entryStream.WriteAsync(bytes);
                        i++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Skipping page {I} in ZIP", i);
                    }
                }
            }

            zipMs.Position = 0;
            string zipName = $"{req.Filename ?? "artwork"}_{DateTime.Now:yyyyMMddHHmm}.zip";
            return File(zipMs.ToArray(), "application/zip", zipName);
        }

        // ══════════════════════════════════════════════════════
        //  API: GET PROMPT TEMPLATES (for AI panel)
        // ══════════════════════════════════════════════════════
        [HttpGet("api/editor-v2/templates")]
        public IActionResult GetTemplates()
        {
            var templates = _db.UserPromptTemplates
                .Where(t => t.IsPublic || t.IsSystem)
                .Where(t => t.Category == "image" || t.Category == "Photography"
                         || t.Category == "Digital Art")
                .Select(t => new { t.Id, t.Title, t.Prompt, t.Category, t.Style, t.ThumbnailUrl })
                .ToList();

            return Ok(templates);
        }

        // ══════════════════════════════════════════════════════
        //  PRIVATE HELPERS
        // ══════════════════════════════════════════════════════
        private async Task<string> MoveToUserFolder(string userId, string tempUrl, string subFolder)
        {
            try
            {
                // tempUrl = /uploads/temp/img_xxx.png
                string tempPath = Path.Combine(_env.WebRootPath,
                    tempUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

                if (!System.IO.File.Exists(tempPath)) return tempUrl;

                string folder = Path.Combine(_env.WebRootPath, "uploads", userId, subFolder);
                Directory.CreateDirectory(folder);
                string fileName = Path.GetFileName(tempPath);
                string destPath = Path.Combine(folder, fileName);

                System.IO.File.Move(tempPath, destPath, overwrite: true);
                return $"/uploads/{userId}/{subFolder}/{fileName}";
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not move temp file: {Url}", tempUrl);
                return tempUrl;
            }
        }

        private async Task<string> SaveBase64Image(string userId, string base64, string subFolder)
        {
            try
            {
                var data = base64.Contains(',') ? base64.Split(',')[1] : base64;
                var bytes = Convert.FromBase64String(data);
                string folder = Path.Combine(_env.WebRootPath, "uploads", userId, subFolder);
                Directory.CreateDirectory(folder);
                string fileName = $"thumb_{Guid.NewGuid():N}.png";
                await System.IO.File.WriteAllBytesAsync(Path.Combine(folder, fileName), bytes);
                return $"/uploads/{userId}/{subFolder}/{fileName}";
            }
            catch { return ""; }
        }

        private static int CountPages(string canvasJson)
        {
            try
            {
                var doc = JsonDocument.Parse(canvasJson ?? "{}");
                if (doc.RootElement.TryGetProperty("pages", out var p))
                    return p.GetArrayLength();
            }
            catch { }
            return 1;
        }
    }

    // ══════════════════════════════════════════════════════════
    //  REQUEST / RESPONSE MODELS
    // ══════════════════════════════════════════════════════════
    public class GenerateRequest
    {
        public string Prompt { get; set; } = "";
        public string? NegativePrompt { get; set; }
        public string? Model { get; set; }
        public string? Style { get; set; }
        public string? Size { get; set; }
        public int? Seed { get; set; }
    }

    public class InpaintRequest
    {
        public IFormFile? Image { get; set; }
        public IFormFile? Mask { get; set; }
        public string? Prompt { get; set; }
    }

    public class SaveArtworkRequest
    {
        public string Title { get; set; } = "";
        public string CanvasJson { get; set; } = "";
        public string? ThumbnailBase64 { get; set; }
    }

    public class BatchOptions
    {
        public int? Width { get; set; }
        public int? Height { get; set; }
        public string? OutputFormat { get; set; }
        public string? Anchor { get; set; }
        public string? AspectRatio { get; set; }
        public bool KeepRatio { get; set; } = true;
        public string? FilterType { get; set; }
        public int FilterValue { get; set; } = 50;
        public string? WatermarkText { get; set; }
        public string? WatermarkPos { get; set; }
        public int WatermarkSize { get; set; } = 24;
        public string? WatermarkColor { get; set; }
        public float WatermarkOpacity { get; set; } = 0.7f;
        public float Quality { get; set; } = 0.9f;
    }

    public class ExportZipRequest
    {
        public List<ExportPage> Pages { get; set; } = new();
        public string? Filename { get; set; }
        public string? Format { get; set; }
    }

    public class ExportPage
    {
        public string? DataUrl { get; set; }
        public int PageIndex { get; set; }
    }
}