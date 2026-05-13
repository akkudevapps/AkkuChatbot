using AkkuChatbot.Data;
using AkkuChatbot.Models;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace AkkuChatbot.Services
{
    public interface IPdfExportService
    {
        Task<byte[]> ExportSessionAsync(int sessionId, string userId);
    }

    public class PdfExportService : IPdfExportService
    {
        private readonly ApplicationDbContext _db;

        public PdfExportService(ApplicationDbContext db)
        {
            _db = db;
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task<byte[]> ExportSessionAsync(int sessionId, string userId)
        {
            var session = await _db.ChatSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId)
                ?? throw new Exception("Session not found");

            var messages = await _db.ChatMessages
                .Where(m => m.SessionId == sessionId)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();

            var user = await _db.Users.FindAsync(userId);

            return Document.Create(doc =>
            {
                doc.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Arial"));

                    // ── HEADER ────────────────────────────────────
                    page.Header().Column(col =>
                    {
                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(inner =>
                            {
                                inner.Item().Text("🤖 AkkuChatbot")
                                    .FontSize(18).Bold().FontColor("#2f81f7");
                                inner.Item().Text($"Session: {session.Name}")
                                    .FontSize(12).FontColor("#8b949e");
                                inner.Item().Text($"Model: {session.ModelUsed}  |  Messages: {messages.Count}  |  Tokens: {session.TotalTokensUsed}")
                                    .FontSize(10).FontColor("#8b949e");
                            });
                            row.ConstantItem(120).AlignRight().Column(inner =>
                            {
                                inner.Item().Text($"User: {user?.FullName ?? user?.Email}")
                                    .FontSize(10).FontColor("#8b949e");
                                inner.Item().Text($"Date: {session.CreatedAt:dd MMM yyyy}")
                                    .FontSize(10).FontColor("#8b949e");
                            });
                        });
                        col.Item().PaddingTop(6).LineHorizontal(0.5f).LineColor("#30363d");
                    });

                    // ── CONTENT ───────────────────────────────────
                    page.Content().PaddingVertical(12).Column(col =>
                    {
                        foreach (var msg in messages)
                        {
                            // User message
                            col.Item().PaddingBottom(6).Column(inner =>
                            {
                                inner.Item().Row(r =>
                                {
                                    r.ConstantItem(50).Text("You")
                                        .FontSize(10).Bold().FontColor("#2f81f7");
                                    r.RelativeItem().Text(msg.CreatedAt.ToString("HH:mm"))
                                        .FontSize(9).FontColor("#8b949e");
                                });
                                inner.Item()
                                    .Background("#1f2d45")
                                    .Padding(8)
                                    .CornerRadius(6)
                                    .Text(msg.UserMessage)
                                    .FontColor("#e6edf3").FontSize(10.5f);
                            });

                            // Bot response
                            col.Item().PaddingBottom(14).Column(inner =>
                            {
                                inner.Item().Row(r =>
                                {
                                    r.ConstantItem(50).Text("Bot")
                                        .FontSize(10).Bold().FontColor("#3fb950");
                                    r.RelativeItem().Text($"{msg.TokensUsed} tokens")
                                        .FontSize(9).FontColor("#8b949e");
                                });
                                inner.Item()
                                    .Background("#161b22")
                                    .Padding(8)
                                    .CornerRadius(6)
                                    .Text(msg.BotResponse)
                                    .FontColor("#e6edf3").FontSize(10.5f);
                            });
                        }
                    });

                    // ── FOOTER (watermark) ────────────────────────
                    page.Footer().AlignCenter().Column(col =>
                    {
                        col.Item().LineHorizontal(0.5f).LineColor("#30363d");
                        col.Item().PaddingTop(6).Row(row =>
                        {
                            row.RelativeItem().Text("akkuapps.in — AkkuChatbot")
                                .FontSize(9).FontColor("#8b949e").Italic();
                            row.RelativeItem().AlignRight()
                                .Text(x =>
                                {
                                    x.Span("Page ").FontSize(9).FontColor("#8b949e");
                                    x.CurrentPageNumber().FontSize(9).FontColor("#8b949e");
                                    x.Span(" / ").FontSize(9).FontColor("#8b949e");
                                    x.TotalPages().FontSize(9).FontColor("#8b949e");
                                });
                        });
                    });
                });
            }).GeneratePdf();
        }
    }
}