using AkkuChatbot.Data;
using AkkuChatbot.Models;
using AkkuChatbot.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AkkuChatbot.Controllers
{
    [Authorize]
    public class DashboardController : Controller
    {
        private readonly ApplicationDbContext _db;
        private readonly ICoinService _coinService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IWebHostEnvironment _env;

        public DashboardController(
            ApplicationDbContext db,
            ICoinService coinService,
            UserManager<ApplicationUser> userManager,
            IWebHostEnvironment env)
        {
            _db = db;
            _coinService = coinService;
            _userManager = userManager;
            _env = env;
        }

        public async Task<IActionResult> Index()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var user = await _userManager.FindByIdAsync(userId);

            // Sessions
            var sessions = await _db.ChatSessions
                .Where(s => s.UserId == userId && !s.IsArchived)
                .OrderByDescending(s => s.UpdatedAt)
                .ToListAsync();

            // Coin transactions
            var transactions = await _coinService.GetTransactionHistoryAsync(userId);

            // Storage
            var userFolder = Path.Combine(_env.WebRootPath, "uploads", userId);
            long usedBytes = 0;
            List<FileInfo> files = new();
            if (Directory.Exists(userFolder))
            {
                var di = new DirectoryInfo(userFolder);
                files = di.GetFiles("*", SearchOption.TopDirectoryOnly).ToList();
                usedBytes = files.Sum(f => f.Length);
            }

            ViewBag.User = user;
            ViewBag.Balance = user?.CoinBalance ?? 0;
            ViewBag.Sessions = sessions;
            ViewBag.Transactions = transactions.Take(20).ToList();
            ViewBag.Files = files;
            ViewBag.UsedMB = Math.Round(usedBytes / 1024.0 / 1024.0, 1);
            ViewBag.LimitMB = 100;
            ViewBag.TotalMessages = sessions.Sum(s => s.TotalMessages);
            ViewBag.TotalTokens = sessions.Sum(s => s.TotalTokensUsed);
            ViewBag.TotalCoinsSpent = sessions.Sum(s => s.TotalCoinsUsed);
            ViewBag.UserId = userId;

            return View();
        }

        [HttpPost]
        public async Task<IActionResult> DeleteFile(string fileName)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var safeFile = Path.GetFileName(fileName);
            var path = Path.Combine(_env.WebRootPath, "uploads", userId, safeFile);
            if (System.IO.File.Exists(path))
                System.IO.File.Delete(path);
            TempData["Success"] = "File deleted.";
            return RedirectToAction("Index");
        }

        [HttpPost]
        public async Task<IActionResult> DeleteSession(int sessionId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var session = await _db.ChatSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);
            if (session != null) { session.IsArchived = true; await _db.SaveChangesAsync(); }
            TempData["Success"] = "Session deleted.";
            return RedirectToAction("Index");
        }
    }
}