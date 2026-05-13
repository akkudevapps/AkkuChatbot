// WorkspaceController.cs
using System.IO.Compression;
using AkkuChatbot.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using AkkuChatbot.Models;
using System.Security.Claims;

namespace AkkuChatbot.Controllers
{
    [Authorize]
    public class WorkspaceController : Controller
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IWebHostEnvironment _env;

        public WorkspaceController(UserManager<ApplicationUser> userManager, IWebHostEnvironment env)
        {
            _userManager = userManager;
            _env = env;
        }

        // ── BROWSE / LIST ────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> Browse(string? subPath)
        {
            var user = await _userManager.GetUserAsync(User);
            if (string.IsNullOrEmpty(user?.WorkspacePath))
                return Json(new { error = "Workspace path not configured." });

            string basePath = user.WorkspacePath;
            string targetPath = string.IsNullOrEmpty(subPath)
                ? basePath
                : Path.GetFullPath(Path.Combine(basePath, subPath));

            if (!targetPath.StartsWith(basePath))
                return Json(new { error = "Access denied." });

            if (!Directory.Exists(targetPath))
                return Json(new { error = "Directory not found." });

            var dirs = Directory.EnumerateDirectories(targetPath)
                .Select(d => new
                {
                    name = Path.GetFileName(d),
                    type = "folder",
                    size = 0L,      // folders don't have size
                    ext = ""        // no extension
                });

            var files = Directory.EnumerateFiles(targetPath)
                .Select(f => new
                {
                    name = Path.GetFileName(f),
                    type = "file",
                    size = new FileInfo(f).Length,
                    ext = Path.GetExtension(f).ToLowerInvariant()
                });

            return Json(new
            {
                currentPath = targetPath.Replace(basePath, "").TrimStart(Path.DirectorySeparatorChar),
                parentPath = Path.GetDirectoryName(targetPath)?.Replace(basePath, "").TrimStart(Path.DirectorySeparatorChar),
                items = dirs.Concat(files)  // now same anonymous type
            });
        }

        // ── READ FILE CONTENT ────────────────────────────
        [HttpGet]
        public async Task<IActionResult> Read(string filePath)
        {
            var user = await _userManager.GetUserAsync(User);
            if (string.IsNullOrEmpty(user?.WorkspacePath))
                return Json(new { error = "Workspace path not configured." });

            string basePath = user.WorkspacePath;
            string fullPath = Path.GetFullPath(Path.Combine(basePath, filePath));
            if (!fullPath.StartsWith(basePath))
                return Json(new { error = "Access denied." });

            if (!System.IO.File.Exists(fullPath))
                return Json(new { error = "File not found." });

            string content = await System.IO.File.ReadAllTextAsync(fullPath);
            return Json(new { content, fileName = Path.GetFileName(fullPath) });
        }

        // ── EXTRACT ZIP ──────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> ExtractZip(string zipPath)
        {
            var user = await _userManager.GetUserAsync(User);
            if (string.IsNullOrEmpty(user?.WorkspacePath))
                return Json(new { error = "Workspace path not configured." });

            string basePath = user.WorkspacePath;
            string fullZipPath = Path.GetFullPath(Path.Combine(basePath, zipPath));
            if (!fullZipPath.StartsWith(basePath) || !fullZipPath.EndsWith(".zip"))
                return Json(new { error = "Invalid zip file." });

            string extractDir = Path.Combine(Path.GetDirectoryName(fullZipPath)!,
                Path.GetFileNameWithoutExtension(fullZipPath) + "_extracted");

            if (Directory.Exists(extractDir))
                Directory.Delete(extractDir, true);
            Directory.CreateDirectory(extractDir);

            await Task.Run(() => ZipFile.ExtractToDirectory(fullZipPath, extractDir));

            var files = Directory.GetFiles(extractDir, "*", SearchOption.AllDirectories)
                .Select(f => f.Replace(extractDir, "").TrimStart(Path.DirectorySeparatorChar));
            return Json(new { success = true, extractPath = extractDir.Replace(basePath, ""), files });
        }

        // ── SAVE WORKSPACE PATH ──────────────────────────
        [HttpPost]
        public async Task<IActionResult> SetPath([FromBody] WorkspacePathRequest req)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();
            user.WorkspacePath = req.Path?.Trim();
            await _userManager.UpdateAsync(user);
            return Json(new { success = true });
        }

        public record WorkspacePathRequest(string? Path);
    }
}