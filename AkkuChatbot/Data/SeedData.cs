using AkkuChatbot.Models;
using Microsoft.AspNetCore.Identity;

namespace AkkuChatbot.Data
{
    public static class SeedData
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            // ✅ Wrap entire seed in try-catch
            // DB table இல்லாமல் crash ஆனால் app start ஆகும்
            try
            {
                var roleManager = serviceProvider
                    .GetRequiredService<RoleManager<IdentityRole>>();
                var userManager = serviceProvider
                    .GetRequiredService<UserManager<ApplicationUser>>();
                var logger = serviceProvider
                    .GetRequiredService<ILogger<Program>>();

                // ── Roles ──────────────────────────────────
                foreach (var role in new[] { "Admin", "User" })
                {
                    if (!await roleManager.RoleExistsAsync(role))
                        await roleManager.CreateAsync(new IdentityRole(role));
                }

                // ── Admin user ─────────────────────────────
                const string adminEmail = "admin@akkuchatbot.com";
                const string adminPassword = "Admin@123";

                var admin = await userManager.FindByEmailAsync(adminEmail);

                if (admin == null)
                {
                    admin = new ApplicationUser
                    {
                        UserName = adminEmail,
                        Email = adminEmail,
                        FullName = "Super Admin",
                        CoinBalance = 99999,
                        EmailConfirmed = true,
                        IsActive = true
                    };
                    var result = await userManager.CreateAsync(admin, adminPassword);
                    if (result.Succeeded)
                    {
                        await userManager.AddToRoleAsync(admin, "Admin");
                        logger.LogInformation("✅ Admin user created");
                    }
                    else
                    {
                        logger.LogWarning("⚠️ Admin create failed: {Errors}",
                            string.Join(", ", result.Errors.Select(e => e.Description)));
                    }
                }
                else
                {
                    // Force reset password every startup
                    var token = await userManager.GeneratePasswordResetTokenAsync(admin);
                    await userManager.ResetPasswordAsync(admin, token, adminPassword);

                    if (!await userManager.IsInRoleAsync(admin, "Admin"))
                        await userManager.AddToRoleAsync(admin, "Admin");

                    admin.EmailConfirmed = true;
                    admin.IsActive = true;
                    await userManager.UpdateAsync(admin);

                    logger.LogInformation("✅ Admin user verified");
                }
            }
            catch (Exception ex)
            {
                // ✅ Crash இல்லை — warning மட்டும்
                // App continue ஆகும், DB fix செய்த பிறகு restart போதும்
                var logger = serviceProvider
                    .GetService<ILogger<Program>>();
                logger?.LogWarning(ex,
                    "⚠️ SeedData failed — run SQL fix and restart. Error: {Message}",
                    ex.Message);
            }
        }
    }
}