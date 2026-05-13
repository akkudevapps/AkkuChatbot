// Controllers/PromptTemplateController.cs
using AkkuChatbot.Models.Dtos;
using AkkuChatbot.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class PromptTemplateController : ControllerBase
{
    private readonly IPromptTemplateService _templateService;
    private readonly ICoinService _coinService;
    private readonly IWebHostEnvironment _env;

    public PromptTemplateController(
        IPromptTemplateService templateService,
        ICoinService coinService,
        IWebHostEnvironment env)
    {
        _templateService = templateService;
        _coinService = coinService;
        _env = env;
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private string GetUserName() => User.Identity?.Name ?? GetUserId();
    private bool IsAdmin() => User.IsInRole("Admin");

    // ── Public templates (gallery) ─────────────────────────────────
    [HttpGet("public")]
    public async Task<IActionResult> GetPublicTemplates(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 24,
        [FromQuery] string? search = null, [FromQuery] string? category = null,
        [FromQuery] string? style = null, [FromQuery] string? sort = null)
    {
        var result = await _templateService.GetPublicTemplatesAsync(
            page, pageSize, search, category, style, sort);
        return Ok(result);
    }

    // ── My templates ───────────────────────────────────────────────
    [HttpGet("mine")]
    public async Task<IActionResult> GetMyTemplates(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 24,
        [FromQuery] string? search = null, [FromQuery] string? category = null,
        [FromQuery] string? style = null, [FromQuery] string? sort = null)
    {
        var result = await _templateService.GetUserTemplatesAsync(
            GetUserId(), page, pageSize, search, category, style, sort);
        return Ok(result);
    }

    // ── Create ─────────────────────────────────────────────────────
    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] CreateTemplateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Prompt))
            return BadRequest("Title and prompt required");

        var template = await _templateService.CreateTemplateAsync(
            GetUserId(),
            dto.Title, dto.Prompt, dto.Category, dto.Style, dto.ThumbnailUrl, dto.IsPublic,
            // 🆕 Image settings
            dto.FluxModel, dto.NegativePrompt,
            dto.Width, dto.Height, dto.Steps, dto.GuidanceScale, dto.Seed);

        return Ok(template);
    }

    // ── Delete ─────────────────────────────────────────────────────
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _templateService.DeleteTemplateAsync(id, GetUserId(), IsAdmin());
        if (!ok) return NotFound();
        return Ok();
    }

    // ── Export → .apt ──────────────────────────────────────────────
    [HttpGet("export")]
    public async Task<IActionResult> Export([FromQuery] string ids)
    {
        var idList = ids.Split(',').Select(int.Parse);
        var data = await _templateService.ExportTemplatesAsync(idList);
        return File(data, "application/json", "akku_templates.apt");
    }

    // ── Import ← .apt ──────────────────────────────────────────────
    [HttpPost("import")]
    public async Task<IActionResult> Import(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("No file uploaded");
        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);
        var result = await _templateService.ImportTemplatesAsync(GetUserId(), ms.ToArray());
        return Ok(result);
    }

    // ── Coin balance ───────────────────────────────────────────────
    [HttpGet("balance")]
    public async Task<IActionResult> GetBalance()
        => Ok(new { balance = await _coinService.GetBalanceAsync(GetUserId()) });

    // ── Thumbnail upload ───────────────────────────────────────────
    [HttpPost("upload-thumbnail")]
    public async Task<IActionResult> UploadThumbnail(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("No file uploaded");

        string fileName = $"thumb_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        string folder = Path.Combine(_env.WebRootPath, "uploads", "temp");
        Directory.CreateDirectory(folder);

        using var stream = new FileStream(Path.Combine(folder, fileName), FileMode.Create);
        await file.CopyToAsync(stream);

        return Ok(new { url = $"/uploads/temp/{fileName}" });
    }
}