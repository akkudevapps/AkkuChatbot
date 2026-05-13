using System.ComponentModel.DataAnnotations;

namespace AkkuChatbot.Models
{
    public class SessionGroup
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Name { get; set; } = "";

        [MaxLength(50)]
        public string? Icon { get; set; }

        public string UserId { get; set; } = "";
        public ApplicationUser? User { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<SessionGroupMember> Members { get; set; } = new List<SessionGroupMember>();
    }
}