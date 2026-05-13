using AkkuChatbot.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AkkuChatbot.Controllers
{
    [Authorize]
    public class CoinController : Controller
    {
        private readonly ICoinService _coinService;

        public CoinController(ICoinService coinService)
        {
            _coinService = coinService;
        }

        [HttpGet]
        public async Task<IActionResult> Balance()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var balance = await _coinService.GetBalanceAsync(userId);
            return Json(new { balance });
        }

        [HttpGet]
        public async Task<IActionResult> History()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var history = await _coinService.GetTransactionHistoryAsync(userId);
            return View(history);
        }
       
        

    }
}