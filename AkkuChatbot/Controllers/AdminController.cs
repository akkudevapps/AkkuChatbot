using AkkuChatbot.Data;
using AkkuChatbot.Models;
using AkkuChatbot.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AkkuChatbot.Controllers
{
    [Authorize(Roles = "Admin")]
    
    public class AdminController : Controller
    {
        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ICoinService _coinService;
        private readonly IWebHostEnvironment _env;

        public AdminController(
            ApplicationDbContext db,
            UserManager<ApplicationUser> userManager,
            ICoinService coinService,
            IWebHostEnvironment env)
        {
            _db = db;
            _userManager = userManager;
            _coinService = coinService;
            _env = env;
        }

        // ── DASHBOARD ─────────────────────────────────────
        public async Task<IActionResult> Index()
        {
            var users = await _userManager.Users.ToListAsync();
            var totalMessages = await _db.ChatMessages.CountAsync();
            var totalSessions = await _db.ChatSessions.CountAsync();
            var totalCoinsSpent = await _db.CoinTransactions
                .Where(t => t.Amount < 0).SumAsync(t => t.Amount);
            var totalCoinsAwarded = await _db.CoinTransactions
                .Where(t => t.Amount > 0).SumAsync(t => t.Amount);

            // Storage
            long totalBytes = 0;
            var uploadsRoot = Path.Combine(_env.WebRootPath, "uploads");
            if (Directory.Exists(uploadsRoot))
                totalBytes = new DirectoryInfo(uploadsRoot)
                    .GetFiles("*", SearchOption.AllDirectories).Sum(f => f.Length);

            // Recent activity
            var recentMessages = await _db.ChatMessages
                .Include(m => m.User)
                .OrderByDescending(m => m.CreatedAt)
                .Take(10)
                .ToListAsync();

            ViewBag.TotalUsers = users.Count;
            ViewBag.ActiveUsers = users.Count(u => u.IsActive);
            ViewBag.TotalMessages = totalMessages;
            ViewBag.TotalSessions = totalSessions;
            ViewBag.TotalCoinsSpent = Math.Abs(totalCoinsSpent);
            ViewBag.TotalCoinsAwarded = totalCoinsAwarded;
            ViewBag.TotalStorageMB = Math.Round(totalBytes / 1024.0 / 1024.0, 1);
            ViewBag.RecentMessages = recentMessages;

            return View();
        }

        // ═══════════════════════════════════════════════════════════════════════
        //  ADD THIS ACTION to AdminController.cs  (inside the class body)
        //  Place it alongside the existing DeleteSession action.
        // ═══════════════════════════════════════════════════════════════════════

        // ── BULK ARCHIVE SESSIONS ─────────────────────────────────────────────
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> BulkDeleteSessions([FromBody] BulkSessionRequest req)
        {
            if (req?.SessionIds == null || req.SessionIds.Count == 0)
                return Json(new { success = false, error = "No sessions selected." });

            // Clamp to a safe maximum per request
            var ids = req.SessionIds.Take(200).ToList();

            var sessions = await _db.ChatSessions
                .Where(s => ids.Contains(s.Id.ToString()) && !s.IsArchived)
                .ToListAsync();

            foreach (var s in sessions)
                s.IsArchived = true;

            await _db.SaveChangesAsync();

            return Json(new { success = true, archived = sessions.Count });
        }

        // ── DTO ────────────────────────────────────────────────────────────────
        public class BulkSessionRequest
        {
            public List<string> SessionIds { get; set; } = new();
        }

        // ── USERS LIST ────────────────────────────────────
        public async Task<IActionResult> Users(string? search)
        {
            var query = _userManager.Users.AsQueryable();
            if (!string.IsNullOrEmpty(search))
                query = query.Where(u =>
                    u.Email!.Contains(search) ||
                    u.FullName.Contains(search));

            var users = await query.OrderByDescending(u => u.RegisteredAt).ToListAsync();

            // Attach roles
            var userRoles = new Dictionary<string, IList<string>>();
            foreach (var u in users)
                userRoles[u.Id] = await _userManager.GetRolesAsync(u);

            // Attach session/message counts
            var sessionCounts = await _db.ChatSessions
                .GroupBy(s => s.UserId)
                .Select(g => new { g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Count);

            var msgCounts = await _db.ChatMessages
                .GroupBy(m => m.UserId)
                .Select(g => new { g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Count);

            ViewBag.UserRoles = userRoles;
            ViewBag.SessionCounts = sessionCounts;
            ViewBag.MsgCounts = msgCounts;
            ViewBag.Search = search;

            return View(users);
        }

        // ── USER DETAIL ───────────────────────────────────
        public async Task<IActionResult> UserDetail(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var roles = await _userManager.GetRolesAsync(user);
            var sessions = await _db.ChatSessions
                .Where(s => s.UserId == id)
                .OrderByDescending(s => s.UpdatedAt)
                .ToListAsync();
            var transactions = await _db.CoinTransactions
                .Where(t => t.UserId == id)
                .OrderByDescending(t => t.CreatedAt)
                .Take(30)
                .ToListAsync();

            // Storage
            var folder = Path.Combine(_env.WebRootPath, "uploads", id);
            long usedBytes = 0;
            List<FileInfo> files = new();
            if (Directory.Exists(folder))
            {
                var di = new DirectoryInfo(folder);
                files = di.GetFiles().ToList();
                usedBytes = files.Sum(f => f.Length);
            }

            ViewBag.Roles = roles;
            ViewBag.Sessions = sessions;
            ViewBag.Transactions = transactions;
            ViewBag.Files = files;
            ViewBag.UsedMB = Math.Round(usedBytes / 1024.0 / 1024.0, 2);
            ViewBag.UserId = id;

            return View(user);
        }

        // ── TOGGLE ACTIVE ─────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> ToggleActive(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();
            user.IsActive = !user.IsActive;
            await _userManager.UpdateAsync(user);
            TempData["Success"] = $"User {(user.IsActive ? "activated" : "deactivated")}.";
            return RedirectToAction("Users");
        }

        // ── ADD COINS ─────────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> AddCoins(string userId, int amount, string reason)
        {
            if (amount <= 0 || amount > 100000)
            {
                TempData["Error"] = "Invalid coin amount (1–100000).";
                return RedirectToAction("UserDetail", new { id = userId });
            }
            await _coinService.AddCoinsAsync(userId, amount,
                $"Admin top-up: {reason}", TransactionType.AdminCredit);
            TempData["Success"] = $"{amount} coins added successfully.";
            return RedirectToAction("UserDetail", new { id = userId });
        }

        // ── DEDUCT COINS ──────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> DeductCoins(string userId, int amount, string reason)
        {
            if (amount <= 0)
            {
                TempData["Error"] = "Invalid amount.";
                return RedirectToAction("UserDetail", new { id = userId });
            }
            await _coinService.DeductCoinsAsync(userId, amount,
                $"Admin deduction: {reason}");
            TempData["Success"] = $"{amount} coins deducted.";
            return RedirectToAction("UserDetail", new { id = userId });
        }

        // ── SET ROLE ──────────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> SetRole(string userId, string role)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();
            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, role);
            TempData["Success"] = $"Role set to {role}.";
            return RedirectToAction("UserDetail", new { id = userId });
        }

        // ── SESSIONS (all) ────────────────────────────────
        public async Task<IActionResult> Sessions(string? search, int page = 1)
        {
            const int pageSize = 20;
            var query = _db.ChatSessions
                .Include(s => s.User)
                .Where(s => !s.IsArchived)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
                query = query.Where(s =>
                    s.Name.Contains(search) ||
                    s.User.Email!.Contains(search));

            var total = await query.CountAsync();
            var sessions = await query
                .OrderByDescending(s => s.UpdatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            ViewBag.Total = total;
            ViewBag.Page = page;
            ViewBag.PageSize = pageSize;
            ViewBag.Search = search;
            return View(sessions);
        }

        // ── SESSION DETAIL ────────────────────────────────
        public async Task<IActionResult> SessionDetail(int id)
        {
            var session = await _db.ChatSessions
                .Include(s => s.User)
                .Include(s => s.Messages)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (session == null) return NotFound();
            return View(session);
        }

        // ── SAVE SESSION NOTE ─────────────────────────────
        [HttpPost]
        public async Task<IActionResult> SaveNote(int sessionId, string note)
        {
            var session = await _db.ChatSessions.FindAsync(sessionId);
            if (session == null) return NotFound();
            session.ShortNote = note;
            await _db.SaveChangesAsync();
            TempData["Success"] = "Note saved.";
            return RedirectToAction("SessionDetail", new { id = sessionId });
        }

        // ── DELETE SESSION ────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> DeleteSession(int sessionId)
        {
            var session = await _db.ChatSessions.FindAsync(sessionId);
            if (session != null) { session.IsArchived = true; await _db.SaveChangesAsync(); }
            TempData["Success"] = "Session archived.";
            return RedirectToAction("Sessions");
        }

        // ── COIN TRANSACTIONS (all) ───────────────────────
        public async Task<IActionResult> Transactions(int page = 1)
        {
            const int pageSize = 30;
            var total = await _db.CoinTransactions.CountAsync();
            var items = await _db.CoinTransactions
                .Include(t => t.User)
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
            ViewBag.Total = total;
            ViewBag.Page = page;
            ViewBag.PageSize = pageSize;
            return View(items);
        }

        // ── DELETE USER FILE ──────────────────────────────
        [HttpPost]
        public IActionResult DeleteUserFile(string userId, string fileName)
        {
            var safe = Path.GetFileName(fileName);
            var path = Path.Combine(_env.WebRootPath, "uploads", userId, safe);
            if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
            TempData["Success"] = "File deleted.";
            return RedirectToAction("UserDetail", new { id = userId });
        }

        // ── BULK COINS ────────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> BulkAddCoins(int amount, string reason)
        {
            if (amount <= 0) { TempData["Error"] = "Invalid amount."; return RedirectToAction("Index"); }
            var users = await _userManager.Users.Where(u => u.IsActive).ToListAsync();
            foreach (var u in users)
                await _coinService.AddCoinsAsync(u.Id, amount,
                    $"Bulk admin credit: {reason}", TransactionType.AdminCredit);
            TempData["Success"] = $"{amount} coins added to {users.Count} active users.";
            return RedirectToAction("Index");
        }
    }
}