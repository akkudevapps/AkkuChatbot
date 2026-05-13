using Microsoft.AspNetCore.Identity;

namespace AkkuChatbot.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string FullName { get; set; } = string.Empty;
        public int CoinBalance { get; set; } = 100;
        public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;
        public string? ProfilePicture { get; set; }
        public string? WorkspacePath { get; set; }   // Local folder path
        public ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
        public ICollection<CoinTransaction> CoinTransactions { get; set; } = new List<CoinTransaction>();
    }
}