using AkkuChatbot.Data;
using AkkuChatbot.Hubs;
using AkkuChatbot.Models;
using AkkuChatbot.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Tesseract;

var builder = WebApplication.CreateBuilder(args);

// ══════════════ DATABASE ══════════════
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ══════════════ SERVICES ══════════════
builder.Services.AddSingleton<IModelFormattingService, ModelFormattingService>();
builder.Services.AddScoped<IStorageQuotaService, StorageQuotaService>();
builder.Services.AddScoped<IPromptTemplateService, PromptTemplateService>();

// ══════════════ IDENTITY ══════════════
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.SignIn.RequireConfirmedAccount = false;
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// ══════════════ JSON OPTIONS ══════════════
// ✅ camelCase + ignore cycles — JS-ல் data.items, data.totalPages சரியாக வேலை செய்யும்
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;       // ✅ NEW
        options.JsonSerializerOptions.DefaultIgnoreCondition =
            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull; // ✅ cleaner JSON
    });

// ══════════════ HTTP CLIENTS ══════════════
builder.Services.AddHttpClient();
builder.Services.AddHttpClient("WebFetcher", client =>
{
    client.Timeout = TimeSpan.FromSeconds(20);
    client.DefaultRequestHeaders.Add("User-Agent",
        "Mozilla/5.0 (compatible; AkkuChatbot/1.0)");
});

// ══════════════ IMAGE GENERATOR ══════════════
builder.Services.AddScoped<IImageGeneratorService, ImageGeneratorService>();
builder.Services.AddHttpClient<ImageGeneratorService>(client =>
{
    client.Timeout = TimeSpan.FromMinutes(5);
});

// ══════════════ TESSERACT (fail-safe) ══════════════
builder.Services.AddSingleton<Lazy<TesseractEngine?>>(provider =>
{
    return new Lazy<TesseractEngine?>(() =>
    {
        var env = provider.GetRequiredService<IWebHostEnvironment>();
        var logger = provider.GetRequiredService<ILogger<Program>>();
        string tessDataPath = Path.Combine(env.ContentRootPath, "tessdata");

        try
        {
            if (!Directory.Exists(tessDataPath))
                throw new DirectoryNotFoundException($"tessdata folder not found at: {tessDataPath}");

            string engFile = Path.Combine(tessDataPath, "eng.traineddata");
            if (!File.Exists(engFile))
                throw new FileNotFoundException($"Missing required file: {engFile}");

            var engine = new TesseractEngine(tessDataPath, "eng", EngineMode.Default);
            logger.LogInformation("✅ Tesseract engine initialized successfully.");
            return engine;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "⚠️ Tesseract engine could not be initialised. OCR will be disabled.");
            return null;
        }
    });
});

// ══════════════ AUTHENTICATION ══════════════
builder.Services.AddAuthentication()
    .AddGoogle(options =>
    {
        options.ClientId = builder.Configuration["Authentication:Google:ClientId"]!;
        options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"]!;
    });

// ══════════════ APPLICATION SERVICES ══════════════
builder.Services.AddScoped<ICoinService, CoinService>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddSingleton<IOllamaService, OllamaService>();
builder.Services.AddScoped<IPdfExportService, PdfExportService>();
builder.Services.AddSingleton<IModelCapabilityService, ModelCapabilityService>();
builder.Services.AddScoped<INativeOcrService, NativeOcrService>();

// ✅ Bug 4 Fix (from earlier): Register IHttpContextAccessor
builder.Services.AddHttpContextAccessor();

builder.Services.AddSignalR();
builder.Services.AddControllersWithViews();
builder.Services.AddRazorPages();

// ══════════════ FILE UPLOAD LIMIT ══════════════
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10 MB
});

var app = builder.Build();

// ══════════════ SEED DATA ══════════════
using (var scope = app.Services.CreateScope())
{
    await SeedData.InitializeAsync(scope.ServiceProvider);
}

// ══════════════ MIDDLEWARE PIPELINE ══════════════
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

// ✅ Bug 1 Fix: MapControllers() — API attribute routing [Route("api/...")] வேலை செய்ய
app.MapControllers();

app.MapControllerRoute(
    name: "areas",
    pattern: "{area:exists}/{controller=Home}/{action=Index}/{id?}");

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.MapRazorPages();
app.MapHub<ChatHub>("/chatHub");

app.Run();