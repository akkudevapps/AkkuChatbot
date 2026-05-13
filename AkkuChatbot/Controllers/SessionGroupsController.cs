using AkkuChatbot.Data;
using AkkuChatbot.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AkkuChatbot.Controllers
{
    [Authorize]
    [Route("[controller]")]
    public class SessionGroupsController : Controller
    {
        private readonly ApplicationDbContext _db;

        public SessionGroupsController(ApplicationDbContext db)
        {
            _db = db;
        }

        // ─── 1. List all groups (sidebar)
        [HttpGet("Index")]
        public async Task<IActionResult> Index()
        {
            var userId = GetUserId();
            var groups = await _db.SessionGroups
                .Where(g => g.UserId == userId)
                .Select(g => new
                {
                    g.Id,
                    g.Name,
                    g.Icon,
                    MemberCount = g.Members.Count
                })
                .ToListAsync();
            return Json(groups);
        }

        // ─── 2. Create new group
        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] GroupCreateRequest req)
        {
            var userId = GetUserId();
            var group = new SessionGroup
            {
                UserId = userId,
                Name = req.Name,
                Icon = req.Icon ?? "📁"
            };
            _db.SessionGroups.Add(group);
            await _db.SaveChangesAsync();
            return Json(new { id = group.Id, name = group.Name, icon = group.Icon });
        }

        // ─── 3. Rename group
        [HttpPost("Rename")]
        public async Task<IActionResult> Rename([FromBody] GroupRenameRequest req)
        {
            var group = await _db.SessionGroups.FirstOrDefaultAsync(g => g.Id == req.GroupId && g.UserId == GetUserId());
            if (group == null) return NotFound();

            group.Name = req.Name ?? group.Name;
            await _db.SaveChangesAsync();
            return Json(new { success = true });
        }

        // ─── 4. Delete group (sessions untouched)
        [HttpPost("Delete")]
        public async Task<IActionResult> Delete([FromBody] GroupDeleteRequest req)
        {
            var group = await _db.SessionGroups.FirstOrDefaultAsync(g => g.Id == req.GroupId && g.UserId == GetUserId());
            if (group == null) return NotFound();

            _db.SessionGroups.Remove(group);
            await _db.SaveChangesAsync();
            return Json(new { success = true });
        }

        // ─── 5. Add session to group
        [HttpPost("AddSession")]
        public async Task<IActionResult> AddSession([FromBody] GroupMemberRequest req)
        {
            var userId = GetUserId();
            var group = await _db.SessionGroups.FirstOrDefaultAsync(g => g.Id == req.GroupId && g.UserId == userId);
            var session = await _db.ChatSessions.FirstOrDefaultAsync(s => s.Id == req.SessionId && s.UserId == userId);
            if (group == null || session == null) return BadRequest("Group or session not found.");

            // Changed: GroupId / SessionId (adjust if your model uses different names)
            if (!await _db.SessionGroupMembers.AnyAsync(m => m.GroupId == req.GroupId && m.SessionId == req.SessionId))
            {
                _db.SessionGroupMembers.Add(new SessionGroupMember
                {
                    GroupId = req.GroupId,
                    SessionId = req.SessionId
                });
                await _db.SaveChangesAsync();
            }
            return Json(new { success = true });
        }

        // ─── 6. Remove session from group
        [HttpPost("RemoveSession")]
        public async Task<IActionResult> RemoveSession([FromBody] GroupMemberRequest req)
        {
            var userId = GetUserId();
            var member = await _db.SessionGroupMembers
                .Include(m => m.Group)        // changed: Group instead of SessionGroup
                .FirstOrDefaultAsync(m => m.GroupId == req.GroupId && m.SessionId == req.SessionId && m.Group.UserId == userId);
            if (member == null) return NotFound();

            _db.SessionGroupMembers.Remove(member);
            await _db.SaveChangesAsync();
            return Json(new { success = true });
        }

        // ─── 7. Get sessions of a group
        [HttpGet("GetSessions")]
        public async Task<IActionResult> GetSessions(int groupId)
        {
            var userId = GetUserId();
            var group = await _db.SessionGroups.FirstOrDefaultAsync(g => g.Id == groupId && g.UserId == userId);
            if (group == null) return NotFound();

            var sessions = await _db.SessionGroupMembers
                .Where(m => m.GroupId == groupId)                   // changed: GroupId
                .Include(m => m.Session)                            // navigation to ChatSession (check name)
                .Select(m => new
                {
                    m.Session.Id,
                    m.Session.Name,
                    m.Session.UpdatedAt
                })
                .ToListAsync();
            return Json(sessions);
        }

        // ─── 8. Search within a group (title + message content)
        [HttpGet("Search")]
        public async Task<IActionResult> Search(int groupId, string? query)
        {
            var userId = GetUserId();
            var group = await _db.SessionGroups.FirstOrDefaultAsync(g => g.Id == groupId && g.UserId == userId);
            if (group == null) return NotFound();

            var sessionsInGroup = await _db.SessionGroupMembers
                .Where(m => m.GroupId == groupId)                   // changed: GroupId
                .Include(m => m.Session)                            // changed: Session (check name)
                .ToListAsync();

            if (string.IsNullOrWhiteSpace(query))
            {
                var result = sessionsInGroup.Select(m => new
                {
                    m.Session.Id,
                    m.Session.Name,
                    Snippet = "",
                    CreatedAt = m.Session.UpdatedAt
                }).ToList();
                return Json(result);
            }

            var sessionIds = sessionsInGroup.Select(s => s.SessionId).ToList();   // SessionId
            var messages = await _db.ChatMessages
                .Where(m => sessionIds.Contains(m.SessionId) && (m.UserMessage.Contains(query) || m.BotResponse.Contains(query)))
                .GroupBy(m => m.SessionId)
                .Select(g => new { SessionId = g.Key, Latest = g.OrderByDescending(x => x.CreatedAt).FirstOrDefault()! })
                .ToListAsync();

            var searchResults = sessionsInGroup
                .Select(s =>
                {
                    var match = messages.FirstOrDefault(x => x.SessionId == s.SessionId);
                    return new
                    {
                        s.Session.Id,
                        s.Session.Name,
                        Snippet = match != null
                            ? Truncate(match.Latest.UserMessage.Contains(query) ? match.Latest.UserMessage : match.Latest.BotResponse, 100)
                            : "",
                        CreatedAt = match?.Latest.CreatedAt ?? s.Session.UpdatedAt
                    };
                })
                .Where(r => r.Snippet != "" || r.Name.Contains(query, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(r => r.CreatedAt)
                .ToList();

            return Json(searchResults);
        }

        // ── helpers ─────────────────────────────────────
        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        private static string Truncate(string text, int maxLen) =>
            text.Length <= maxLen ? text : text[..maxLen] + "…";

        // ── request DTOs ─────────────────────────────────
        public record GroupCreateRequest(string Name, string? Icon);
        public record GroupRenameRequest(int GroupId, string? Name);
        public record GroupDeleteRequest(int GroupId);
        public record GroupMemberRequest(int GroupId, int SessionId);
    }
}