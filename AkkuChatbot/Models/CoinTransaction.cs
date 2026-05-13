namespace AkkuChatbot.Models
{
    // Single enum definition – placed OUTSIDE the class
    public enum TransactionType
    {
        ChatMessage = 1,
        ImageGeneration = 2,
        Bonus = 3,
        AdminAdjustment = 4,
        TemplateCreation = 5,
        TemplateDeletion = 6,
        Import = 7,
        Debit = 8,
        AdminCredit = 9,
        Refund = 10
    }

    public class CoinTransaction
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public int Amount { get; set; }
        public TransactionType Type { get; set; }  // uses the enum above
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int BalanceAfter { get; set; }
        public ApplicationUser User { get; set; } = null!;
    }
}