// ChatController.cs – FULL CODE with ModelFormattingService integration
using AkkuChatbot.Data;
using AkkuChatbot.Models;
using AkkuChatbot.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace AkkuChatbot.Controllers
{
    [Authorize]
    public class ChatController : Controller
    {
        private readonly ApplicationDbContext _db;
        private readonly IOllamaService _ollama;
        private readonly ICoinService _coinService;
        private readonly IModelCapabilityService _modelService;
        private readonly IModelFormattingService _formatting;   // ← NEW
        private readonly IConfiguration _config;
        private readonly IWebHostEnvironment _env;
        private readonly IPdfExportService _pdfService;
        private readonly IHttpClientFactory _httpFactory;
        private readonly ILogger<ChatController> _log;

        private static readonly HashSet<string> TextExts = new(StringComparer.OrdinalIgnoreCase)
        {
            ".txt", ".md", ".markdown", ".csv", ".json", ".xml", ".yaml", ".yml",
            ".py", ".js", ".ts", ".jsx", ".tsx", ".cs", ".vb", ".java", ".cpp",
            ".c", ".h", ".go", ".rs", ".php", ".rb", ".swift", ".kt",
            ".html", ".htm", ".css", ".scss", ".sql", ".sh", ".bat", ".log",
            ".env", ".ini", ".toml", ".conf", ".config"
        };

        private static readonly HashSet<string> ImageExts = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif"
        };

        private static readonly HashSet<string> BlockedExts = new(StringComparer.OrdinalIgnoreCase)
        {
            ".cshtml", ".razor", ".cs", ".exe", ".dll", ".bat", ".cmd",
            ".ps1", ".vbs", ".js", ".ts"
        };

        public ChatController(
            ApplicationDbContext db,
            IOllamaService ollama,
            ICoinService coinService,
            IModelCapabilityService modelService,
            IModelFormattingService formatting,         // ← NEW
            IConfiguration config,
            IWebHostEnvironment env,
            IPdfExportService pdfService,
            IHttpClientFactory httpFactory,
            ILogger<ChatController> log)
        {
            _db = db;
            _ollama = ollama;
            _coinService = coinService;
            _modelService = modelService;
            _formatting = formatting;                  // ← NEW
            _config = config;
            _env = env;
            _pdfService = pdfService;
            _httpFactory = httpFactory;
            _log = log;
        }

        // ── INDEX ─────────────────────────────────────────────────────────────────
        public async Task<IActionResult> Index(int? sessionId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var models = await _modelService.GetInstalledCloudModelsAsync();
            var sessions = await _db.ChatSessions
                .Where(s => s.UserId == userId && !s.IsArchived)
                .OrderByDescending(s => s.UpdatedAt)
                .ToListAsync();

            ViewBag.Models = _modelService.GetCloudModels()
                                  .Where(m => models.Contains(m.ModelId)).ToList();
            ViewBag.Sessions = sessions;
            ViewBag.Balance = await _coinService.GetBalanceAsync(userId);
            return View();
        }

        // ── NEW SESSION ───────────────────────────────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> NewSession([FromBody] NewSessionRequest req)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var session = new ChatSession
            {
                UserId = userId,
                Name = $"Chat {DateTime.Now:MMM dd HH:mm}",
                ModelUsed = req.ModelId
            };
            _db.ChatSessions.Add(session);
            await _db.SaveChangesAsync();
            return Json(new { sessionId = session.Id, name = session.Name });
        }

        // ── RENAME SESSION ────────────────────────────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> RenameSession([FromBody] RenameRequest req)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var session = await _db.ChatSessions
                .FirstOrDefaultAsync(s => s.Id == req.SessionId && s.UserId == userId);
            if (session == null) return NotFound();
            session.Name = req.Name.Trim();
            await _db.SaveChangesAsync();
            return Json(new { success = true });
        }

        // ── DELETE SESSION ────────────────────────────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> DeleteSession([FromBody] DeleteRequest req)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var session = await _db.ChatSessions
                .FirstOrDefaultAsync(s => s.Id == req.SessionId && s.UserId == userId);
            if (session == null) return NotFound();
            session.IsArchived = true;
            await _db.SaveChangesAsync();
            return Json(new { success = true });
        }

        // ── GET MESSAGES ──────────────────────────────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> GetMessages(int sessionId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var session = await _db.ChatSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);
            if (session == null) return Forbid();

            var messages = await _db.ChatMessages
                .Where(m => m.SessionId == sessionId)
                .OrderBy(m => m.CreatedAt)
                .Select(m => new {
                    m.Id,
                    m.UserMessage,
                    m.BotResponse,
                    m.CreatedAt,
                    m.TokensUsed,
                    m.CoinsUsed,
                    m.ModelUsed,
                    m.AttachmentName,
                    m.IncludeInContext
                })
                .ToListAsync();

            return Json(new
            {
                session = new { session.Id, session.Name, session.ModelUsed },
                messages
            });
        }

        // ══════════════════════════════════════════════════════════════════════════
        //  SEND MESSAGE
        // ══════════════════════════════════════════════════════════════════════════
        [HttpPost]
        public async Task<IActionResult> Send([FromForm] SendMessageRequest req)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            int costPerMsg = _config.GetValue<int>("CoinSettings:CostPerMessage", 1);

            var balance = await _coinService.GetBalanceAsync(userId);
            if (balance < costPerMsg)
                return Json(new { success = false, error = "Insufficient coins! Please top up." });

            var session = await _db.ChatSessions
                .FirstOrDefaultAsync(s => s.Id == req.SessionId && s.UserId == userId);
            if (session == null)
                return Json(new { success = false, error = "Invalid session." });

            string modelToUse = !string.IsNullOrEmpty(req.ModelId) ? req.ModelId : session.ModelUsed;
            if (!string.IsNullOrEmpty(req.ModelId)) session.ModelUsed = req.ModelId;

            // ── Resolve formatting profile for this model ─────────────────────────
            var formatProfile = _formatting.GetProfile(modelToUse);
            var profileLabel = formatProfile.ToString().ToLower(); // "coder","reasoning",etc.

            var uploadDir = Path.Combine(_env.WebRootPath, "uploads", userId);
            Directory.CreateDirectory(uploadDir);

            var textParts = new List<string>();
            var imageBase64s = new List<string>();
            string? attachName = null;

            foreach (var file in req.Attachments)
            {
                if (file.Length == 0) continue;
                if (file.Length > 10 * 1024 * 1024)
                {
                    textParts.Add($"[File '{file.FileName}' skipped – exceeds 10 MB limit]");
                    continue;
                }

                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (BlockedExts.Contains(ext))
                    return Json(new { success = false, error = $"File type '{ext}' is not allowed for security reasons." });

                attachName ??= file.FileName;

                var safeName = Path.GetFileName(file.FileName);
                var diskPath = Path.Combine(uploadDir, safeName);
                await using (var fs = System.IO.File.Create(diskPath))
                    await file.CopyToAsync(fs);

                if (ImageExts.Contains(ext))
                {
                    var bytes = await System.IO.File.ReadAllBytesAsync(diskPath);
                    imageBase64s.Add(Convert.ToBase64String(bytes));
                }
                else if (TextExts.Contains(ext))
                {
                    var raw = await System.IO.File.ReadAllTextAsync(diskPath);
                    if (raw.Length > 80_000) raw = raw[..80_000] + "\n[…content truncated to 80 KB…]";
                    textParts.Add($"📄 File: **{file.FileName}**\n```{ext.TrimStart('.')}\n{raw}\n```");
                }
                else
                {
                    textParts.Add($"[Attached file: {file.FileName} — binary format, content not extracted]");
                }
            }

            var processedUrls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            if (!string.IsNullOrWhiteSpace(req.FilePaths))
            {
                try
                {
                    var paths = JsonSerializer.Deserialize<List<string>>(req.FilePaths) ?? new();
                    foreach (var raw in paths)
                    {
                        var path = raw.Trim();
                        if (string.IsNullOrEmpty(path)) continue;

                        if (IsUrl(path))
                        {
                            processedUrls.Add(path);
                            var html = await FetchUrlAsync(path);
                            textParts.Add(html != null
                                ? $"🌐 URL: {path}\n\n{html}"
                                : $"[URL fetch failed: {path}]");
                        }
                        else if (System.IO.File.Exists(path))
                        {
                            var content = await System.IO.File.ReadAllTextAsync(path);
                            if (content.Length > 80_000) content = content[..80_000] + "\n[…truncated…]";
                            textParts.Add($"📁 Local file: **{Path.GetFileName(path)}**\n```\n{content}\n```");
                        }
                        else
                        {
                            textParts.Add($"[Path not found: {path}]");
                        }
                    }
                }
                catch (Exception ex)
                {
                    _log.LogWarning(ex, "FilePaths parse/fetch error");
                }
            }

            var inlineUrls = ExtractUrls(req.Message ?? "");
            foreach (var url in inlineUrls.Take(3))
            {
                if (processedUrls.Contains(url)) continue;
                processedUrls.Add(url);
                var html = await FetchUrlAsync(url);
                if (html != null)
                    textParts.Add($"🌐 Referenced URL ({url}):\n\n{html}");
            }

            // ── Build system prompt from ModelFormattingService ───────────────────
            // This merges the per-model formatting rules with any user-defined
            // system prompt from the Parameters panel in the UI.
            string resolvedSystemPrompt = _formatting.GetSystemPrompt(modelToUse, req.SystemPrompt);

            // ── Build final prompt ────────────────────────────────────────────────
            var finalPrompt = await BuildPrompt(
                req.SessionId, req.Message ?? "", modelToUse,
                req.ContextDepth, resolvedSystemPrompt,   // ← pass resolved prompt
                textParts, imageBase64s);

            var ollamaOpts = new OllamaOptions
            {
                Temperature = req.Temperature ?? 0.7f,
                TopP = req.TopP ?? 0.9f,
                NumPredict = req.MaxTokens ?? 4096,
                RepeatPenalty = req.RepeatPenalty ?? 1.1f
            };

            // ── Call Ollama with system prompt ────────────────────────────────────
            var rawResponse = await _ollama.GetResponseAsync(
                finalPrompt,
                modelToUse,
                imageBase64s.Count > 0 ? imageBase64s : null,
                ollamaOpts,
                resolvedSystemPrompt);                    // ← NEW param

            // ── Post-process: clean filler / strip think blocks if wrong profile ──
            var botResponse = _formatting.CleanResponse(rawResponse, modelToUse);

            // ── Image action detection (unchanged) ────────────────────────────────
            var imageAction = TryParseImageAction(botResponse);
            if (imageAction != null)
            {
                var imgUrl = BuildPollinationsUrl(imageAction.Prompt, imageAction.Width, imageAction.Height);
                botResponse = $"🎨 **படம் உருவாக்கப்படுகிறது...**\n\n*Prompt: {imageAction.Prompt}*\n\n![Generated Image]({imgUrl})\n\n[⬇ Download]({imgUrl})  [🔗 Open Full Size]({imgUrl})";
            }

            var tokensUsed = (finalPrompt.Length + botResponse.Length) / 4;

            await _coinService.DeductCoinsAsync(userId, costPerMsg, $"Chat: {session.Name}");

            var chatMsg = new ChatMessage
            {
                UserId = userId,
                SessionId = req.SessionId,
                UserMessage = req.Message ?? "",
                BotResponse = botResponse,
                CoinsUsed = costPerMsg,
                ModelUsed = modelToUse,
                TokensUsed = tokensUsed,
                AttachmentName = attachName ?? (processedUrls.Any()
                    ? string.Join(", ", processedUrls.Take(2)) : null),
                IncludeInContext = true
            };
            _db.ChatMessages.Add(chatMsg);

            session.TotalMessages += 1;
            session.TotalTokensUsed += tokensUsed;
            session.TotalCoinsUsed += costPerMsg;
            session.UpdatedAt = DateTime.UtcNow;

            if (session.TotalMessages == 1)
                session.Name = req.Message?.Length > 45
                    ? req.Message[..45] + "…"
                    : req.Message ?? session.Name;

            await _db.SaveChangesAsync();
            var newBalance = await _coinService.GetBalanceAsync(userId);

            return Json(new
            {
                success = true,
                response = botResponse,
                profile = profileLabel,               // ← NEW: tells frontend which profile to use
                tokensUsed,
                newBalance,
                sessionName = session.Name,
                messageId = chatMsg.Id,
                modelUsed = modelToUse
            });
        }

        // ══════════════════════════════════════════════════════════════════════════
        //  BuildPrompt  — system prompt now injected by caller (not built here)
        // ══════════════════════════════════════════════════════════════════════════
        private async Task<string> BuildPrompt(
            int sessionId, string message, string modelId,
            int? contextDepth, string? systemPrompt,
            List<string> textParts, List<string>? imageBase64s)
        {
            int depth = contextDepth ?? _config.GetValue("CoinSettings:DefaultContextDepth", 10);
            var history = await _db.ChatMessages
                .Where(m => m.SessionId == sessionId && m.IncludeInContext)
                .OrderByDescending(m => m.CreatedAt)
                .Take(depth)
                .ToListAsync();

            var sb = new StringBuilder();

            // System prompt goes at the very top of the prompt string.
            // It is ALSO passed separately as the Ollama "system" field,
            // but including it here ensures models that ignore the system field
            // still receive the instructions.
            if (!string.IsNullOrWhiteSpace(systemPrompt))
                sb.AppendLine($"[System]: {systemPrompt}\n");

            foreach (var h in history.OrderBy(h => h.CreatedAt))
            {
                sb.AppendLine($"User: {h.UserMessage}");
                sb.AppendLine($"Assistant: {h.BotResponse}");
                sb.AppendLine();
            }

            if (textParts.Count > 0)
            {
                sb.AppendLine("--- BEGIN ATTACHED CONTEXT ---");
                foreach (var part in textParts) sb.AppendLine(part);
                sb.AppendLine("--- END ATTACHED CONTEXT ---\n");
            }

            sb.AppendLine($"User: {message}");
            sb.AppendLine("Assistant:");
            return sb.ToString();
        }

        // ══════════════════════════════════════════════════════════════════════════
        //  SSE STREAMING (fallback)
        // ══════════════════════════════════════════════════════════════════════════
        [HttpGet]
        public async Task<IActionResult> SendStream(int sessionId, string modelId, string? message)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var session = await _db.ChatSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);
            if (session == null) return Forbid();

            Response.Headers.Add("Content-Type", "text/event-stream");
            Response.Headers.Add("Cache-Control", "no-cache");
            Response.Headers.Add("Connection", "keep-alive");

            var sw = new StreamWriter(Response.Body, Encoding.UTF8) { AutoFlush = true };

            try
            {
                var sysPrompt = _formatting.GetSystemPrompt(modelId);
                var textParts = new List<string>();
                var finalPrompt = await BuildPrompt(sessionId, message ?? "", modelId, null,
                    sysPrompt, textParts, null);

                var botResponse = await _ollama.GetResponseAsync(finalPrompt, modelId, null,
                    new OllamaOptions(), sysPrompt);

                foreach (var chunk in botResponse.Split(' '))
                {
                    await sw.WriteAsync($"data: {chunk} \n\n");
                    await Task.Delay(20);
                }
                await sw.WriteAsync("data: [DONE]\n\n");
            }
            catch (Exception ex)
            {
                await sw.WriteAsync($"data: [ERROR] {ex.Message}\n\n");
            }
            finally
            {
                await sw.DisposeAsync();
            }

            return new EmptyResult();
        }

        // ── GET OLLAMA MODELS ─────────────────────────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> GetOllamaModels()
        {
            var installed = await _modelService.GetInstalledCloudModelsAsync();
            var list = installed.Select(id =>
            {
                var cap = _modelService.GetModel(id);
                return new { id, name = cap?.DisplayName ?? id };
            });
            return Json(list);
        }

        // ── TOGGLE CONTEXT ────────────────────────────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> ToggleContext([FromBody] ToggleContextRequest req)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var message = await _db.ChatMessages
                .FirstOrDefaultAsync(m => m.Id == req.MessageId && m.UserId == userId);
            if (message == null) return Json(new { success = false });
            message.IncludeInContext = req.Include;
            await _db.SaveChangesAsync();
            return Json(new { success = true });
        }

        // ── MODEL INFO ────────────────────────────────────────────────────────────
        [HttpGet]
        public IActionResult ModelInfo(string modelId)
        {
            var cap = _modelService.GetModel(modelId);
            if (cap == null) return NotFound();
            return Json(cap);
        }

        // ── EXPORT PDF ────────────────────────────────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> ExportPdf(int sessionId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var pdfBytes = await _pdfService.ExportSessionAsync(sessionId, userId);
            return File(pdfBytes, "application/pdf");
        }

        // ══════════════════════════════════════════════════════════════════════════
        //  PRIVATE HELPERS
        // ══════════════════════════════════════════════════════════════════════════

        private static ImageActionResult? TryParseImageAction(string response)
        {
            if (string.IsNullOrWhiteSpace(response)) return null;
            try
            {
                var jsonBlock = ExtractJsonBlock(response);
                if (jsonBlock == null) return null;

                using var doc = JsonDocument.Parse(jsonBlock);
                var root = doc.RootElement;

                if (!root.TryGetProperty("action", out var actionEl)) return null;
                var action = actionEl.GetString() ?? "";

                bool isImageAction =
                    action.Contains("image", StringComparison.OrdinalIgnoreCase) ||
                    action.Contains("dalle", StringComparison.OrdinalIgnoreCase) ||
                    action.Contains("draw", StringComparison.OrdinalIgnoreCase) ||
                    action.Contains("paint", StringComparison.OrdinalIgnoreCase) ||
                    action.Contains("generate", StringComparison.OrdinalIgnoreCase) ||
                    action.Contains("create", StringComparison.OrdinalIgnoreCase);

                if (!isImageAction) return null;

                string prompt = "";
                int width = 512, height = 512;

                if (root.TryGetProperty("action_input", out var inputEl))
                {
                    if (inputEl.ValueKind == JsonValueKind.String)
                    {
                        try
                        {
                            var innerStr = inputEl.GetString()!;
                            using var inner = JsonDocument.Parse(innerStr);
                            var ir = inner.RootElement;

                            if (ir.TryGetProperty("prompt", out var p)) prompt = p.GetString() ?? "";
                            if (ir.TryGetProperty("size", out var sz))
                            {
                                var parts = sz.GetString()?.Split('x');
                                if (parts?.Length == 2)
                                {
                                    int.TryParse(parts[0], out width);
                                    int.TryParse(parts[1], out height);
                                }
                            }
                            if (ir.TryGetProperty("aspect_ratio", out var ar))
                            {
                                (width, height) = ar.GetString() switch
                                {
                                    "16:9" => (912, 512),
                                    "9:16" => (512, 912),
                                    "4:3" => (768, 576),
                                    "3:4" => (576, 768),
                                    "1:1" => (512, 512),
                                    _ => (512, 512)
                                };
                            }
                        }
                        catch { prompt = inputEl.GetString() ?? ""; }
                    }
                    else if (inputEl.ValueKind == JsonValueKind.Object)
                    {
                        if (inputEl.TryGetProperty("prompt", out var p)) prompt = p.GetString() ?? "";
                    }
                }

                if (string.IsNullOrEmpty(prompt) && root.TryGetProperty("prompt", out var rp))
                    prompt = rp.GetString() ?? "";

                return string.IsNullOrEmpty(prompt) ? null : new ImageActionResult(prompt.Trim(), width, height);
            }
            catch { return null; }
        }

        private static string? ExtractJsonBlock(string text)
        {
            int start = text.IndexOf('{');
            if (start < 0) return null;
            int depth = 0; bool inString = false, escape = false;
            for (int i = start; i < text.Length; i++)
            {
                char c = text[i];
                if (escape) { escape = false; continue; }
                if (c == '\\' && inString) { escape = true; continue; }
                if (c == '"') { inString = !inString; continue; }
                if (!inString)
                {
                    if (c == '{') depth++;
                    else if (c == '}') { depth--; if (depth == 0) return text[start..(i + 1)]; }
                }
            }
            return null;
        }

        private static string BuildPollinationsUrl(string prompt, int width = 512, int height = 512)
        {
            var encoded = Uri.EscapeDataString(prompt);
            var seed = Random.Shared.Next(1, 999999);
            return $"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}&seed={seed}&nologo=true&enhance=true&model=flux";
        }

        private record ImageActionResult(string Prompt, int Width, int Height);

        private async Task<string?> FetchUrlAsync(string url)
        {
            try
            {
                var client = _httpFactory.CreateClient("WebFetcher");
                client.Timeout = TimeSpan.FromSeconds(15);

                var resp = await client.GetAsync(url);
                if (!resp.IsSuccessStatusCode)
                {
                    _log.LogWarning("URL fetch {Url} returned {Status}", url, resp.StatusCode);
                    return null;
                }

                var contentType = resp.Content.Headers.ContentType?.MediaType ?? "";
                if (!contentType.Contains("text") && !contentType.Contains("json"))
                    return $"[Binary content at {url} — not readable as text]";

                var raw = await resp.Content.ReadAsStringAsync();
                var text = StripHtml(raw);
                text = Regex.Replace(text, @"\n{3,}", "\n\n");
                text = Regex.Replace(text, @"[ \t]{2,}", " ");
                text = text.Trim();

                if (text.Length > 40_000)
                    text = text[..40_000] + "\n[…content truncated to 40 000 chars…]";

                return text;
            }
            catch (Exception ex)
            {
                _log.LogWarning(ex, "URL fetch failed: {Url}", url);
                return null;
            }
        }

        private static string StripHtml(string html)
        {
            html = Regex.Replace(html, @"<(script|style)[^>]*>[\s\S]*?</(script|style)>",
                                  string.Empty, RegexOptions.IgnoreCase);
            html = Regex.Replace(html, @"<[^>]+>", " ");
            return html
                .Replace("&nbsp;", " ").Replace("&amp;", "&")
                .Replace("&lt;", "<").Replace("&gt;", ">")
                .Replace("&quot;", "\"").Replace("&#39;", "'")
                .Replace("&mdash;", "—").Replace("&ndash;", "–");
        }

        private static IEnumerable<string> ExtractUrls(string text)
        {
            if (string.IsNullOrEmpty(text)) return Enumerable.Empty<string>();
            return Regex.Matches(text, @"https?://[^\s\]""'<>]+", RegexOptions.IgnoreCase)
                        .Select(m => m.Value.TrimEnd('.', ',', ')', ']'))
                        .Distinct();
        }

        private static bool IsUrl(string s) =>
            s.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            s.StartsWith("https://", StringComparison.OrdinalIgnoreCase);

        // ── Request DTOs ──────────────────────────────────────────────────────────
        public record NewSessionRequest(string ModelId);
        public record RenameRequest(int SessionId, string Name);
        public record DeleteRequest(int SessionId);
        public record ToggleContextRequest(int MessageId, bool Include);

        public class SendMessageRequest
        {
            public int SessionId { get; set; }
            public string? Message { get; set; }
            public string? ModelId { get; set; }
            public string? FilePaths { get; set; }
            public string? SystemPrompt { get; set; }
            public float? Temperature { get; set; }
            public float? TopP { get; set; }
            public int? MaxTokens { get; set; }
            public int? ContextDepth { get; set; }
            public float? RepeatPenalty { get; set; }
            public List<IFormFile> Attachments { get; set; } = new();
        }
    }
}