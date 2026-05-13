using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace AkkuChatbot.Controllers
{
    public class SoftwareItem
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public string Version { get; set; } = "";
        public string Category { get; set; } = "";
        public string License { get; set; } = "Freeware";
        public string DownloadUrl { get; set; } = "";
        public string Icon { get; set; } = "📦";
        public long FileSizeMB { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int Downloads { get; set; }
    }

    [Authorize]
    public class SoftwareController : Controller
    {
        private readonly IWebHostEnvironment _env;
        private List<SoftwareItem> _catalog = new();

        public SoftwareController(IWebHostEnvironment env)
        {
            _env = env;
            LoadCatalog();
        }

        private void LoadCatalog()
        {
            var path = Path.Combine(_env.WebRootPath, "data", "software-catalog.json");
            if (System.IO.File.Exists(path))
            {
                var json = System.IO.File.ReadAllText(path);
                _catalog = JsonSerializer.Deserialize<List<SoftwareItem>>(json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                    ?? new List<SoftwareItem>();
            }
        }

        public IActionResult Index(string? search, int page = 1)
        {
            const int pageSize = 12;
            var query = _catalog.AsQueryable();

            if (!string.IsNullOrEmpty(search))
                query = query.Where(s => s.Name.Contains(search, StringComparison.OrdinalIgnoreCase));

            var total = query.Count();
            var items = query.OrderByDescending(s => s.UpdatedAt)
                .Skip((page - 1) * pageSize).Take(pageSize).ToList();

            ViewBag.Search = search;
            ViewBag.Total = total;
            ViewBag.Page = page;

            return View(items);
        }

        public IActionResult Details(int id)
        {
            var item = _catalog.FirstOrDefault(s => s.Id == id);
            if (item == null) return NotFound();
            return View(item);
        }
    }
}