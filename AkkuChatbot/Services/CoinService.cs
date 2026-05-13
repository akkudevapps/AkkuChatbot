using AkkuChatbot.Data;
using AkkuChatbot.Models;
using Microsoft.EntityFrameworkCore;

namespace AkkuChatbot.Services
{
    public class CoinService : ICoinService
    {
        private readonly ApplicationDbContext _db;

        public CoinService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<bool> AddCoinsAsync(string userId, int amount, string description, TransactionType type)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return false;

            var currentBalance = await GetBalanceAsync(userId);
            var newBalance = currentBalance + amount;

            var transaction = new CoinTransaction
            {
                UserId = userId,
                Amount = amount,
                Type = type,          // ✅ now matches enum directly
                Description = description,
                BalanceAfter = newBalance,
                CreatedAt = DateTime.UtcNow
            };

            _db.CoinTransactions.Add(transaction);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeductCoinsAsync(string userId, int amount, string description)
        {
            var currentBalance = await GetBalanceAsync(userId);
            if (currentBalance < amount) return false;

            var newBalance = currentBalance - amount;

            var transaction = new CoinTransaction
            {
                UserId = userId,
                Amount = -amount,
                Type = TransactionType.Debit,
                Description = description,
                BalanceAfter = newBalance,
                CreatedAt = DateTime.UtcNow
            };

            _db.CoinTransactions.Add(transaction);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetBalanceAsync(string userId)
        {
            var lastTx = await _db.CoinTransactions
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();
            return lastTx?.BalanceAfter ?? 0;
        }

        public async Task<List<CoinTransaction>> GetTransactionHistoryAsync(string userId)
        {
            return await _db.CoinTransactions
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }
    }
}