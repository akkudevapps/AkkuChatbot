using AkkuChatbot.Models;

namespace AkkuChatbot.Services
{
    public interface IChatService
    {
        Task<ChatMessage?> SendMessageAsync(string userId, string message, string model);
        Task<List<ChatMessage>> GetUserHistoryAsync(string userId, int count = 20);
    }
}