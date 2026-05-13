using AkkuChatbot.Models;

namespace AkkuChatbot.Services
{
    public interface ICoinService
    {
        Task<bool> DeductCoinsAsync(string userId, int amount, string description);
        Task<bool> AddCoinsAsync(string userId, int amount, string description, TransactionType type);
        Task<int> GetBalanceAsync(string userId);
        Task<List<CoinTransaction>> GetTransactionHistoryAsync(string userId);
    }
}