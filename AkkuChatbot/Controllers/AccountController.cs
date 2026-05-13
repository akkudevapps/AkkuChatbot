// Controllers/AccountController.cs
using AkkuChatbot.Models;
using AkkuChatbot.Models.ViewModels;
using AkkuChatbot.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace AkkuChatbot.Controllers
{
    public class AccountController : Controller
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _config;
        private readonly ICoinService _coinService;

        public AccountController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IConfiguration config,
            ICoinService coinService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _config = config;
            _coinService = coinService;
        }

        // ── REGISTER ──────────────────────────────────────
        [HttpGet]
        public IActionResult Register() => View();

        [HttpPost]
        public async Task<IActionResult> Register(RegisterViewModel model)
        {
            if (!ModelState.IsValid) return View(model);

            int bonus = _config.GetValue<int>("CoinSettings:NewUserBonus", 100);

            var user = new ApplicationUser
            {
                UserName = model.Email,
                Email = model.Email,
                FullName = model.FullName,
                CoinBalance = bonus,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, "User");

                // ✅ Fix: Create initial CoinTransaction so GetBalanceAsync() is accurate
                await _coinService.AddCoinsAsync(
                    user.Id, bonus,
                    "Welcome bonus 🎉",
                    TransactionType.Bonus);

                await _signInManager.SignInAsync(user, isPersistent: false);
                TempData["Success"] = $"Welcome {user.FullName}! You received {bonus} free coins 🎉";
                return RedirectToAction("Index", "Chat");
            }

            foreach (var error in result.Errors)
                ModelState.AddModelError("", error.Description);

            return View(model);
        }

        // ── LOGIN ─────────────────────────────────────────
        [HttpGet]
        public IActionResult Login(string? returnUrl = null)
        {
            ViewData["ReturnUrl"] = returnUrl;
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null)
        {
            if (!ModelState.IsValid) return View(model);

            var result = await _signInManager.PasswordSignInAsync(
                model.Email, model.Password,
                model.RememberMe, lockoutOnFailure: false);

            if (result.Succeeded)
            {
                TempData["Success"] = "Welcome back! 👋";
                return RedirectToLocal(returnUrl);
            }

            ModelState.AddModelError("", "Invalid login attempt.");
            return View(model);
        }

        // ── GOOGLE LOGIN ──────────────────────────────────
        [HttpGet]
        public IActionResult GoogleLogin()
        {
            var redirectUrl = Url.Action("GoogleCallback", "Account");
            var properties = _signInManager
                .ConfigureExternalAuthenticationProperties("Google", redirectUrl);
            return Challenge(properties, "Google");
        }

        [HttpGet]
        public async Task<IActionResult> GoogleCallback()
        {
            var info = await _signInManager.GetExternalLoginInfoAsync();
            if (info == null) return RedirectToAction("Login");

            var signInResult = await _signInManager
                .ExternalLoginSignInAsync(info.LoginProvider, info.ProviderKey, false);

            if (signInResult.Succeeded)
                return RedirectToAction("Index", "Chat");

            var email = info.Principal.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "";
            var name = info.Principal.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "";
            var picture = info.Principal.FindFirst("picture")?.Value ?? "";
            int bonus = _config.GetValue<int>("CoinSettings:NewUserBonus", 100);

            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FullName = name,
                ProfilePicture = picture,
                CoinBalance = bonus,
                EmailConfirmed = true
            };

            var createResult = await _userManager.CreateAsync(user);
            if (createResult.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, "User");
                await _userManager.AddLoginAsync(user, info);

                // ✅ Fix: initial coin transaction for Google users too
                await _coinService.AddCoinsAsync(
                    user.Id, bonus,
                    "Welcome bonus 🎉",
                    TransactionType.Bonus);

                await _signInManager.SignInAsync(user, isPersistent: false);
                TempData["Success"] = $"Welcome {user.FullName}! {bonus} free coins added 🎉";
                return RedirectToAction("Index", "Chat");
            }

            return RedirectToAction("Login");
        }

        // ── LOGOUT ───────────────────────────────────────
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return RedirectToAction("Index", "Home");
        }

        private IActionResult RedirectToLocal(string? returnUrl)
        {
            if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                return Redirect(returnUrl);
            return RedirectToAction("Index", "Chat");
        }
    }
}