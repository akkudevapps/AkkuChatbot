namespace AkkuChatbot.Models
{
    public class ChatSession
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Name { get; set; } = "New Chat";
        public string ModelUsed { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsArchived { get; set; } = false;
        public string? ShortNote { get; set; }         // Admin use
        public int TotalMessages { get; set; } = 0;
        public int TotalTokensUsed { get; set; } = 0;
        public int TotalCoinsUsed { get; set; } = 0;

        // Navigation
        public ApplicationUser User { get; set; } = null!;
        public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }
}