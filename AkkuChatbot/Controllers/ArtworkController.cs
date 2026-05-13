using AkkuChatbot.Data;
using AkkuChatbot.Models;
using AkkuChatbot.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AkkuChatbot.Controllers
{
    [Authorize]
    [Route("[controller]")]
    public class ArtworkController : Controller
    {
        private readonly ApplicationDbContext _db;
        private readonly IStorageQuotaService _quota;
        private readonly IWebHostEnvironment _env;

        public ArtworkController(ApplicationDbContext db, IStorageQuotaService quota, IWebHostEnvironment env)
        {
            _db = db;
            _quota = quota;
            _env = env;
        }

        // ── POST /Artwork/Save ───────────────────────────────────────
        [HttpPost("Save")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Save([FromBody] ArtworkSaveModel model)
        {
            var userId = GetUserId();

            if (string.IsNullOrWhiteSpace(model.CanvasJson))
                return Json(new { success = false, error = "Canvas data is required." });

            if (string.IsNullOrWhiteSpace(model.ThumbnailBase64))
                return Json(new { success = false, error = "Thumbnail is required." });

            // ── Quota check ──────────────────────────────────────────
            long jsonSize = System.Text.Encoding.UTF8.GetByteCount(model.CanvasJson);
            long thumbSize = model.ThumbnailBase64.Length * 3 / 4; // rough base64 → bytes
            long total = jsonSize + thumbSize + 4096;           // + margin
            if (!_quota.CanUserUpload(userId, total))
                return Json(new { success = false, error = "Storage quota exceeded (100 MB). Delete some artworks first." });

            // ── Create or update ─────────────────────────────────────
            Artwork artwork;
            if (model.ArtworkId.HasValue)
            {
                artwork = await _db.Artworks.FindAsync(model.ArtworkId.Value);
                if (artwork == null || artwork.UserId != userId)
                    return Json(new { success = false, error = "Artwork not found." });

                artwork.Title = model.Title?.Trim() ?? artwork.Title;
                artwork.CanvasJson = model.CanvasJson;
                artwork.UpdatedAt = DateTime.UtcNow;

                // Delete old thumbnail file so we don't accumulate stale PNGs
                DeleteThumbFile(artwork.ThumbnailPath);
            }
            else
            {
                artwork = new Artwork
                {
                    UserId = userId,
                    Title = model.Title?.Trim() ?? "Untitled",
                    CanvasJson = model.CanvasJson,
                };
                _db.Artworks.Add(artwork);
            }

            // ── Save thumbnail PNG ────────────────────────────────────
            //   ✅ FIX: always build path with /uploads/{userId}/artworks/
            string folder = Path.Combine(_env.WebRootPath, "uploads", userId, "artworks");
            Directory.CreateDirectory(folder);

            string thumbName = $"thumb_{Guid.NewGuid():N}.png";
            string thumbPath = Path.Combine(folder, thumbName);

            // Strip data URI prefix if present
            var base64Data = model.ThumbnailBase64;
            var commaIdx = base64Data.IndexOf(',');
            if (commaIdx >= 0) base64Data = base64Data[(commaIdx + 1)..];

            try
            {
                var bytes = Convert.FromBase64String(base64Data);
                await System.IO.File.WriteAllBytesAsync(thumbPath, bytes);
            }
            catch (FormatException)
            {
                return Json(new { success = false, error = "Invalid thumbnail data." });
            }

            // ✅ FIX: store the full web-relative path (starts with /)
            artwork.ThumbnailPath = $"/uploads/{userId}/artworks/{thumbName}";

            await _db.SaveChangesAsync();
            return Json(new { success = true, id = artwork.Id, thumbnailPath = artwork.ThumbnailPath });
        }

        // ── GET /Artwork/List ────────────────────────────────────────
        [HttpGet("List")]
        public async Task<IActionResult> List()
        {
            var userId = GetUserId();
            var list = await _db.Artworks
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.UpdatedAt)
                .Select(a => new { a.Id, a.Title, a.ThumbnailPath, a.UpdatedAt })
                .ToListAsync();
            return Json(list);
        }

        // ── GET /Artwork/Load/{id} ────────────────────────────────────
        [HttpGet("Load/{id}")]
        public async Task<IActionResult> Load(int id)
        {
            var artwork = await _db.Artworks.FindAsync(id);
            if (artwork == null || artwork.UserId != GetUserId())
                return NotFound();

            return Json(new { title = artwork.Title, canvasJson = artwork.CanvasJson });
        }

        // ── DELETE /Artwork/Delete/{id} ──────────────────────────────
        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var artwork = await _db.Artworks.FindAsync(id);
            if (artwork == null || artwork.UserId != GetUserId())
                return NotFound();

            DeleteThumbFile(artwork.ThumbnailPath);
            _db.Artworks.Remove(artwork);
            await _db.SaveChangesAsync();
            return Ok();
        }

        // ── Helpers ──────────────────────────────────────────────────
        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        private void DeleteThumbFile(string? webPath)
        {
            if (string.IsNullOrEmpty(webPath)) return;
            try
            {
                // webPath is like /uploads/{userId}/artworks/thumb_xxx.png
                var fullPath = Path.Combine(_env.WebRootPath, webPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(fullPath))
                    System.IO.File.Delete(fullPath);
            }
            catch (Exception ex)
            {
                // Non-fatal: log but don't fail the request
                Console.WriteLine($"[ArtworkController] Could not delete thumbnail '{webPath}': {ex.Message}");
            }
        }
    }

    public class ArtworkSaveModel
    {
        public int? ArtworkId { get; set; }
        public string Title { get; set; } = "Untitled";
        public string CanvasJson { get; set; } = "";
        public string ThumbnailBase64 { get; set; } = "";
    }
}