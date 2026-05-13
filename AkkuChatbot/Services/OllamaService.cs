using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AkkuChatbot.Services
{
    // ── Per-request parameter overrides ──────────────────────────────────────────
    public class OllamaOptions
    {
        public float Temperature { get; set; } = 0.7f;
        public float TopP { get; set; } = 0.9f;
        public int NumPredict { get; set; } = 4096;
        public float RepeatPenalty { get; set; } = 1.1f;
    }

    // ── Ollama /api/generate response shape ───────────────────────────────────────
    internal class OllamaGenerateResponse
    {
        [JsonPropertyName("response")] public string Response { get; set; } = string.Empty;
        [JsonPropertyName("done")] public bool Done { get; set; }
        [JsonPropertyName("error")] public string? Error { get; set; }
    }

    // ── Ollama /api/tags response shape ───────────────────────────────────────────
    internal class OllamaTagsResponse
    {
        [JsonPropertyName("models")] public List<OllamaModelEntry> Models { get; set; } = new();
    }
    internal class OllamaModelEntry
    {
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    }

    // ── Service ───────────────────────────────────────────────────────────────────
    public class OllamaService : IOllamaService
    {
        private readonly HttpClient _http;
        private readonly ILogger<OllamaService> _log;
        private readonly SemaphoreSlim _throttle;

        private static readonly JsonSerializerOptions _jsonOpts = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        public OllamaService(IConfiguration config, ILogger<OllamaService> logger)
        {
            _log = logger;
            var baseUrl = config["Ollama:BaseUrl"] ?? "http://localhost:11434";
            _http = new HttpClient
            {
                BaseAddress = new Uri(baseUrl),
                Timeout = TimeSpan.FromMinutes(10)
            };
            _throttle = new SemaphoreSlim(4, 4);
        }

        // ── PRIMARY call (used by ChatController) ─────────────────────────────────
        public async Task<string> GetResponseAsync(
            string prompt,
            string model,
            List<string>? imageBase64s = null,
            OllamaOptions? options = null,
            string? systemPrompt = null)        // ← NEW parameter
        {
            options ??= new OllamaOptions();
            await _throttle.WaitAsync();
            try
            {
                var payload = new Dictionary<string, object>
                {
                    ["model"] = model,
                    ["prompt"] = prompt,
                    ["stream"] = false,
                    ["options"] = new
                    {
                        temperature = options.Temperature,
                        top_p = options.TopP,
                        num_predict = options.NumPredict,
                        repeat_penalty = options.RepeatPenalty
                    }
                };

                // ── Inject system prompt if provided ──────────────────────────────
                // Ollama /api/generate supports a top-level "system" field.
                // This sets the model's personality/formatting rules per-request.
                if (!string.IsNullOrWhiteSpace(systemPrompt))
                    payload["system"] = systemPrompt;

                if (imageBase64s?.Count > 0)
                    payload["images"] = imageBase64s;

                var body = JsonSerializer.Serialize(payload, _jsonOpts);
                var content = new StringContent(body, Encoding.UTF8, "application/json");

                _log.LogInformation("Ollama model={Model} images={N} hasSystem={HasSys}",
                    model, imageBase64s?.Count ?? 0, !string.IsNullOrEmpty(systemPrompt));

                var resp = await _http.PostAsync("/api/generate", content);
                if (!resp.IsSuccessStatusCode)
                {
                    var err = await resp.Content.ReadAsStringAsync();
                    _log.LogError("Ollama {Status}: {Err}", resp.StatusCode, err);
                    return $"[Error {(int)resp.StatusCode}] {err}";
                }

                var result = await resp.Content.ReadFromJsonAsync<OllamaGenerateResponse>();
                if (!string.IsNullOrEmpty(result?.Error))
                    return $"[Model error] {result.Error}";

                return result?.Response ?? "[Empty response]";
            }
            catch (TaskCanceledException)
            {
                return "[Timeout] Model took too long. Try a shorter prompt or a faster model.";
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "OllamaService exception");
                return $"[Service error] {ex.Message}";
            }
            finally { _throttle.Release(); }
        }

        // ── List installed Ollama models (/api/tags) ──────────────────────────────
        public async Task<List<string>> GetAvailableModelsAsync()
        {
            try
            {
                var data = await _http.GetFromJsonAsync<OllamaTagsResponse>("/api/tags");
                return data?.Models.Select(m => m.Name).ToList() ?? new();
            }
            catch (Exception ex)
            {
                _log.LogWarning(ex, "Could not fetch Ollama model list");
                return new();
            }
        }

        // ── Streaming (token-by-token) — SignalR / SSE ────────────────────────────
        public async IAsyncEnumerable<string> GetStreamingResponseAsync(
            string prompt,
            string model,
            [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            var payload = new { model, prompt, stream = true };
            var body = JsonSerializer.Serialize(payload, _jsonOpts);
            var content = new StringContent(body, Encoding.UTF8, "application/json");

            string? startError = null;
            HttpResponseMessage? resp = null;
            try
            {
                resp = await _http.PostAsync("/api/generate", content, cancellationToken);
                resp.EnsureSuccessStatusCode();
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "Streaming request failed");
                startError = $"[Stream error] {ex.Message}";
            }

            if (startError != null)
            {
                yield return startError;
                yield break;
            }

            using var stream = await resp!.Content.ReadAsStreamAsync(cancellationToken);
            using var reader = new StreamReader(stream);

            while (!reader.EndOfStream && !cancellationToken.IsCancellationRequested)
            {
                var line = await reader.ReadLineAsync();
                if (string.IsNullOrWhiteSpace(line)) continue;
                OllamaGenerateResponse? chunk = null;
                try { chunk = JsonSerializer.Deserialize<OllamaGenerateResponse>(line, _jsonOpts); }
                catch { continue; }
                if (chunk?.Response != null) yield return chunk.Response;
                if (chunk?.Done == true) break;
            }
        }
    }
}