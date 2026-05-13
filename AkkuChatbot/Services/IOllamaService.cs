namespace AkkuChatbot.Services
{
    public interface IOllamaService
    {
        /// <summary>
        /// Send a prompt to Ollama.
        /// Pass imageBase64s for vision models.
        /// Pass systemPrompt to inject per-model formatting rules.
        /// </summary>
        Task<string> GetResponseAsync(
            string prompt,
            string model,
            List<string>? imageBase64s = null,
            OllamaOptions? options = null,
            string? systemPrompt = null);        // ← NEW

        /// <summary>Get list of models installed in Ollama.</summary>
        Task<List<string>> GetAvailableModelsAsync();

        /// <summary>Streaming token-by-token response (SignalR / SSE).</summary>
        IAsyncEnumerable<string> GetStreamingResponseAsync(
            string prompt,
            string model,
            CancellationToken cancellationToken = default);
    }
}