namespace AkkuChatbot.Models
{
    public enum MessageRole { User, Assistant }
    public enum AttachmentType { None, Image, File, Code }

    public class ChatMessage
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public int SessionId { get; set; }                  // ← NEW
        public string UserMessage { get; set; } = string.Empty;
        public string BotResponse { get; set; } = string.Empty;
        public int CoinsUsed { get; set; } = 1;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string ModelUsed { get; set; } = string.Empty;
        public int TokensUsed { get; set; } = 0;            // ← NEW
        public AttachmentType AttachmentKind { get; set; } = AttachmentType.None; // ← NEW
        public string? AttachmentPath { get; set; }         // ← NEW
        public string? AttachmentName { get; set; }         // ← NEW
        public bool IncludeInContext { get; set; } = true;  // Default: include in AI context


        // Navigation
        public ApplicationUser User { get; set; } = null!;
        public ChatSession Session { get; set; } = null!;   // ← NEW
    }
}