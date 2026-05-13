namespace AkkuChatbot.Models
{
    public class SessionGroupMember
    {
        public int Id { get; set; }

        public int GroupId { get; set; }
        public SessionGroup? Group { get; set; }

        public int SessionId { get; set; }
        public ChatSession? Session { get; set; }

        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }
}