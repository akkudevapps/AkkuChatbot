using AkkuChatbot.Data;
using AkkuChatbot.Models;
using Microsoft.EntityFrameworkCore;

namespace AkkuChatbot.Services
{
    public class ChatService : IChatService
    {
        private readonly ApplicationDbContext _context;
        private readonly IOllamaService _ollamaService;
        private readonly ICoinService _coinService;

        public ChatService(ApplicationDbContext context,
                           IOllamaService ollamaService,
                           ICoinService coinService)
        {
            _context = context;
            _ollamaService = ollamaService;
            _coinService = coinService;
        }

        public async Task<ChatMessage?> SendMessageAsync(string userId, string message, string model)
        {
            // Coin check
            var canDeduct = await _coinService.DeductCoinsAsync(userId, 1, $"Chat: {message[..Math.Min(30, message.Length)]}...");
            if (!canDeduct) return null; // Insufficient coins

            // Ollama call
            var botResponse = await _ollamaService.GetResponseAsync(message, model);

            // Save to DB
            var chatMessage = new ChatMessage
            {
                UserId = userId,
                UserMessage = message,
                BotResponse = botResponse,
                CoinsUsed = 1,
                ModelUsed = model,
                CreatedAt = DateTime.UtcNow
            };

            _context.ChatMessages.Add(chatMessage);
            await _context.SaveChangesAsync();

            return chatMessage;
        }

        public async Task<List<ChatMessage>> GetUserHistoryAsync(string userId, int count = 20)
        {
            return await _context.ChatMessages
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.CreatedAt)
                .Take(count)
                .ToListAsync();
        }
    }
}