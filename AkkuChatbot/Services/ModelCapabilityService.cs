namespace AkkuChatbot.Services
{
    public class ModelCapability
    {
        public string ModelId { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Provider { get; set; } = string.Empty;
        public string Icon { get; set; } = "🤖";

        // Capabilities
        public bool SupportsVision { get; set; } = false;
        public bool SupportsWebSearch { get; set; } = false;
        public bool SupportsTools { get; set; } = false;
        public bool SupportsFileUpload { get; set; } = false;
        public bool SupportsCodeExecution { get; set; } = false;
        public bool SupportsReasoning { get; set; } = false;

        // Parameters
        public int ContextWindow { get; set; } = 4096;
        public int DefaultMaxTokens { get; set; } = 2048;
        public float DefaultTemperature { get; set; } = 0.7f;
        public float DefaultTopP { get; set; } = 0.9f;
        public float DefaultFrequencyPenalty { get; set; } = 0.0f;
        public float DefaultPresencePenalty { get; set; } = 0.0f;

        // Parameter ranges
        public float MinTemperature { get; set; } = 0.0f;
        public float MaxTemperature { get; set; } = 2.0f;
        public float MinTopP { get; set; } = 0.0f;
        public float MaxTopP { get; set; } = 1.0f;

        public string BestFor { get; set; } = string.Empty;
        public string[] Tags { get; set; } = Array.Empty<string>();
    }

    public interface IModelCapabilityService
    {
        List<ModelCapability> GetCloudModels();
        ModelCapability? GetModel(string modelId);
        Task<List<string>> GetInstalledCloudModelsAsync();
        void UpdateModelParameters(string modelId, ModelParameters parameters);
        ModelParameters? GetModelParameters(string modelId);
    }

    public class ModelParameters
    {
        public float Temperature { get; set; }
        public float TopP { get; set; }
        public int MaxTokens { get; set; }
        public float FrequencyPenalty { get; set; }
        public float PresencePenalty { get; set; }
        public string? SystemPrompt { get; set; }
        public int ContextDepth { get; set; } = 10;
    }

    public class ModelCapabilityService : IModelCapabilityService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;
        private static readonly Dictionary<string, ModelCapability> _capabilities;
        private static readonly Dictionary<string, ModelParameters> _customParameters = new();

        static ModelCapabilityService()
        {
            _capabilities = new Dictionary<string, ModelCapability>
            {
                // ═══════════════════════════════════════════════════
                // CLOUD MODELS (Your installed models)
                // ═══════════════════════════════════════════════════

                ["nemotron-3-super:cloud"] = new ModelCapability
                {
                    ModelId = "nemotron-3-super:cloud",
                    DisplayName = "Nemotron 3 Super",
                    Description = "NVIDIA's largest and most capable model for reasoning and coding",
                    Provider = "NVIDIA",
                    Icon = "🟢",
                    SupportsVision = false,
                    SupportsWebSearch = true,
                    SupportsTools = true,
                    SupportsCodeExecution = true,
                    SupportsReasoning = true,
                    ContextWindow = 128000,
                    DefaultMaxTokens = 4096,
                    DefaultTemperature = 0.6f,
                    DefaultTopP = 0.95f,
                    BestFor = "Advanced reasoning, Coding, Math, Complex tasks",
                    Tags = new[] { "nvidia", "large", "reasoning", "coding" }
                },

                ["qwen3.5:397b-cloud"] = new ModelCapability
                {
                    ModelId = "qwen3.5:397b-cloud",
                    DisplayName = "Qwen 3.5 (397B)",
                    Description = "Alibaba's largest Qwen model - highest capability",
                    Provider = "Alibaba",
                    Icon = "🔥",
                    SupportsVision = false,
                    SupportsWebSearch = false,
                    SupportsTools = true,
                    SupportsCodeExecution = true,
                    ContextWindow = 32768,
                    DefaultMaxTokens = 4096,
                    DefaultTemperature = 0.7f,
                    BestFor = "Complex reasoning, Analysis, High-quality output",
                    Tags = new[] { "large", "reasoning", "quality" }
                },

                ["qwen3.5:cloud"] = new ModelCapability
                {
                    ModelId = "qwen3.5:cloud",
                    DisplayName = "Qwen 3.5",
                    Description = "Fast general purpose model from Alibaba",
                    Provider = "Alibaba",
                    Icon = "⚡",
                    SupportsVision = false,
                    SupportsWebSearch = false,
                    SupportsTools = true,
                    ContextWindow = 32768,
                    DefaultMaxTokens = 2048,
                    DefaultTemperature = 0.7f,
                    BestFor = "General chat, Q&A, Summarization",
                    Tags = new[] { "general", "fast" }
                },

                ["qwen3-coder-next:cloud"] = new ModelCapability
                {
                    ModelId = "qwen3-coder-next:cloud",
                    DisplayName = "Qwen3 Coder Next",
                    Description = "Next-gen coding specialist with agentic workflows",
                    Provider = "Alibaba",
                    Icon = "💻",
                    SupportsVision = false,
                    SupportsWebSearch = false,
                    SupportsTools = true,
                    SupportsCodeExecution = true,
                    ContextWindow = 32768,
                    DefaultMaxTokens = 4096,
                    DefaultTemperature = 0.2f,
                    DefaultTopP = 0.95f,
                    BestFor = "Code generation, Debugging, Programming",
                    Tags = new[] { "coding", "tools", "agentic" }
                },

                ["kimi-k2-thinking:cloud"] = new ModelCapability
                {
                    ModelId = "kimi-k2-thinking:cloud",
                    DisplayName = "Kimi K2 Thinking",
                    Description = "Reasoning model with extended thinking capabilities",
                    Provider = "Moonshot AI",
                    Icon = "🧠",
                    SupportsVision = false,
                    SupportsWebSearch = true,
                    SupportsTools = true,
                    SupportsReasoning = true,
                    ContextWindow = 256000,
                    DefaultMaxTokens = 4096,
                    DefaultTemperature = 0.6f,
                    BestFor = "Deep reasoning, Research, Analysis, Math",
                    Tags = new[] { "thinking", "reasoning", "long-context" }
                },

                ["kimi-k2.5:cloud"] = new ModelCapability
                {
                    ModelId = "kimi-k2.5:cloud",
                    DisplayName = "Kimi K2.5",
                    Description = "Ultra-long context with web browsing",
                    Provider = "Moonshot AI",
                    Icon = "🌙",
                    SupportsVision = false,
                    SupportsWebSearch = true,
                    SupportsTools = true,
                    ContextWindow = 200000,
                    DefaultMaxTokens = 4096,
                    DefaultTemperature = 0.7f,
                    BestFor = "Long documents, Research, Web browsing",
                    Tags = new[] { "long-context", "web", "research" }
                },

                ["glm-5.1:cloud"] = new ModelCapability
                {
                    ModelId = "glm-5.1:cloud",
                    DisplayName = "GLM 5.1",
                    Description = "Advanced GLM with vision and web access",
                    Provider = "Zhipu AI",
                    Icon = "🧠",
                    SupportsVision = true,
                    SupportsWebSearch = true,
                    SupportsTools = true,
                    SupportsFileUpload = true,
                    SupportsReasoning = true,
                    ContextWindow = 128000,
                    DefaultMaxTokens = 4096,
                    DefaultTemperature = 0.7f,
                    BestFor = "General chat, Vision, Web research",
                    Tags = new[] { "vision", "web", "tools" }
                },

                ["glm-ocr:latest"] = new ModelCapability
                {
                    ModelId = "glm-ocr:latest",
                    DisplayName = "GLM OCR",
                    Description = "Specialized OCR for text extraction",
                    Provider = "Zhipu AI",
                    Icon = "📷",
                    SupportsVision = true,
                    SupportsWebSearch = false,
                    SupportsFileUpload = true,
                    ContextWindow = 8192,
                    DefaultMaxTokens = 2048,
                    DefaultTemperature = 0.5f,
                    BestFor = "Image text extraction, OCR",
                    Tags = new[] { "ocr", "vision", "image" }
                },

                ["gemma4:31b-cloud"] = new ModelCapability
                {
                    ModelId = "gemma4:31b-cloud",
                    DisplayName = "Gemma 4 (31B)",
                    Description = "Google's Gemma with multilingual support",
                    Provider = "Google",
                    Icon = "💎",
                    SupportsVision = false,
                    SupportsWebSearch = false,
                    SupportsTools = false,
                    ContextWindow = 8192,
                    DefaultMaxTokens = 2048,
                    DefaultTemperature = 0.7f,
                    BestFor = "Multilingual chat, Creative writing",
                    Tags = new[] { "multilingual", "google", "creative" }
                },

                ["minimax-m2.7:cloud"] = new ModelCapability
                {
                    ModelId = "minimax-m2.7:cloud",
                    DisplayName = "MiniMax M2.7",
                    Description = "Multimodal model with vision",
                    Provider = "MiniMax",
                    Icon = "🎨",
                    SupportsVision = true,
                    SupportsWebSearch = false,
                    SupportsTools = false,
                    SupportsFileUpload = true,
                    ContextWindow = 40960,
                    DefaultMaxTokens = 4096,
                    DefaultTemperature = 0.8f,
                    BestFor = "Multimodal, Vision + Text, Creative",
                    Tags = new[] { "vision", "multimodal", "creative" }
                },

                // ═══════════════════════════════════════════════════
                // ✅ ADDITIONAL POPULAR OLLAMA MODELS
                // ═══════════════════════════════════════════════════

                // Llama 3.3
                ["llama3.3:latest"] = new ModelCapability
                {
                    ModelId = "llama3.3:latest",
                    DisplayName = "Llama 3.3 (70B)",
                    Description = "Meta's latest Llama with improved reasoning",
                    Provider = "Meta",
                    Icon = "🦙",
                    SupportsVision = false,
                    SupportsWebSearch = false,
                    SupportsTools = true,
                    ContextWindow = 128000,
                    DefaultMaxTokens = 4096,
                    DefaultTemperature = 0.7f,
                    BestFor = "General purpose, Reasoning, Coding",
                    Tags = new[] { "meta", "llama", "general", "reasoning" }
                },

                // DeepSeek models
                ["deepseek-r1:latest"] = new ModelCapability
                {
                    ModelId = "deepseek-r1:latest",
                    DisplayName = "DeepSeek R1",
                    Description = "Advanced reasoning model with chain-of-thought",
                    Provider = "DeepSeek",
                    Icon = "🤔",
                    SupportsVision = false,
                    SupportsWebSearch = false,
                    SupportsTools = true,
                    SupportsReasoning = true,
                    ContextWindow = 64000,
                    DefaultMaxTokens = 8192,
                    DefaultTemperature = 0.6f,
                    BestFor = "Complex reasoning, Math, Logic puzzles",
                    Tags = new[] { "reasoning", "thinking", "math" }
                },

                ["deepseek-coder-v2:latest"] = new ModelCapability
                {
                    ModelId = "deepseek-coder-v2:latest",
                    DisplayName = "DeepSeek Coder V2",
                    Description = "Specialized coding model",
                    Provider = "DeepSeek",
                    Icon = "👨‍💻",
                    SupportsVision = false,
                    SupportsWebSearch = false,
                    SupportsTools = true,
                    SupportsCodeExecution = true,
                    ContextWindow = 128000,
                    DefaultMaxTokens = 4096,
                    DefaultTemperature = 0.2f,
                    BestFor = "Code generation, Debugging, Code review",
                    Tags = new[] { "coding", "programming", "developer" }
                },

                // Mistral models
                ["mistral:latest"] = new ModelCapability
                {
                    ModelId = "mistral:latest",
                    DisplayName = "Mistral (7B)",
                    Description = "Fast and efficient general purpose model",
                    Provider = "Mistral AI",
                    Icon = "🌊",
                    SupportsVision = false,
                    SupportsWebSearch = false,
                    SupportsTools = false,
                    ContextWindow = 32000,
                    DefaultMaxTokens = 2048,
                    DefaultTemperature = 0.7f,
                    BestFor = "Quick responses, Chat, Light coding",
                    Tags = new[] { "fast", "efficient", "general" }
                },

                ["mixtral:latest"] = new ModelCapability
                {
                    ModelId = "mixtral:latest",
                    DisplayName = "Mixtral 8x7B",
                    Description = "Mixture-of-experts model for high quality",
                    Provider = "Mistral AI",
                    Icon = "🎯",
                    SupportsVision = false,
                    SupportsWebSearch = false,
                    SupportsTools = true,
                    ContextWindow = 32000,
                    DefaultMaxTokens = 4096,
                    DefaultTemperature = 0.7f,
                    BestFor = "Complex tasks, Analysis, Reasoning",
                    Tags = new[] { "moe", "quality", "reasoning" }
                },

                // Phi models
                ["phi4:latest"] = new ModelCapability
                {
                    ModelId = "phi4:latest",
                    DisplayName = "Phi-4 (14B)",
                    Description = "Microsoft's compact but powerful model",
                    Provider = "Microsoft",
                    Icon = "🔬",
                    SupportsVision = false,
                    SupportsWebSearch = false,
                    SupportsTools = true,
                    ContextWindow = 16000,
                    DefaultMaxTokens = 2048,
                    DefaultTemperature = 0.7f,
                    BestFor = "Reasoning, Math, Science, Coding",
                    Tags = new[] { "microsoft", "compact", "efficient" }
                },

                // Command R+
                ["command-r-plus:latest"] = new ModelCapability
                {
                    ModelId = "command-r-plus:latest",
                    DisplayName = "Command R+",
                    Description = "Cohere's advanced RAG-optimized model",
                    Provider = "Cohere",
                    Icon = "📚",
                    SupportsVision = false,
                    SupportsWebSearch = true,
                    SupportsTools = true,
                    ContextWindow = 128000,
                    DefaultMaxTokens = 4096,
                    DefaultTemperature = 0.7f,
                    BestFor = "RAG, Document analysis, Research",
                    Tags = new[] { "rag", "research", "documents" }
                },

                // Codestral
                ["codestral:latest"] = new ModelCapability
                {
                    ModelId = "codestral:latest",
                    DisplayName = "Codestral",
                    Description = "Mistral's specialized coding model",
                    Provider = "Mistral AI",
                    Icon = "⌨️",
                    SupportsVision = false,
                    SupportsWebSearch = false,
                    SupportsTools = true,
                    SupportsCodeExecution = true,
                    ContextWindow = 32000,
                    DefaultMaxTokens = 4096,
                    DefaultTemperature = 0.3f,
                    BestFor = "Code completion, Code generation",
                    Tags = new[] { "coding", "autocomplete", "ide" }
                },

                // Llama 3.2 Vision
                ["llama3.2-vision:latest"] = new ModelCapability
                {
                    ModelId = "llama3.2-vision:latest",
                    DisplayName = "Llama 3.2 Vision",
                    Description = "Meta's multimodal Llama with vision",
                    Provider = "Meta",
                    Icon = "👁️",
                    SupportsVision = true,
                    SupportsWebSearch = false,
                    SupportsTools = true,
                    SupportsFileUpload = true,
                    ContextWindow = 128000,
                    DefaultMaxTokens = 2048,
                    DefaultTemperature = 0.7f,
                    BestFor = "Image understanding, Visual Q&A",
                    Tags = new[] { "vision", "multimodal", "meta" }
                },

                // Granite Code
                ["granite3.1-dense:latest"] = new ModelCapability
                {
                    ModelId = "granite3.1-dense:latest",
                    DisplayName = "Granite 3.1 Dense",
                    Description = "IBM's code generation model",
                    Provider = "IBM",
                    Icon = "⚙️",
                    SupportsVision = false,
                    SupportsWebSearch = false,
                    SupportsTools = true,
                    SupportsCodeExecution = true,
                    ContextWindow = 128000,
                    DefaultMaxTokens = 4096,
                    DefaultTemperature = 0.3f,
                    BestFor = "Enterprise code generation",
                    Tags = new[] { "ibm", "coding", "enterprise" }
                },

                // Aya (Multilingual)
                ["aya:latest"] = new ModelCapability
                {
                    ModelId = "aya:latest",
                    DisplayName = "Aya (35B)",
                    Description = "Multilingual model supporting 100+ languages",
                    Provider = "Cohere",
                    Icon = "🌍",
                    SupportsVision = false,
                    SupportsWebSearch = false,
                    SupportsTools = false,
                    ContextWindow = 8192,
                    DefaultMaxTokens = 2048,
                    DefaultTemperature = 0.7f,
                    BestFor = "Multilingual chat, Translation",
                    Tags = new[] { "multilingual", "translation", "global" }
                },

                // Hermes models
                ["hermes3:latest"] = new ModelCapability
                {
                    ModelId = "hermes3:latest",
                    DisplayName = "Hermes 3",
                    Description = "Function calling and tool use specialist",
                    Provider = "Nous Research",
                    Icon = "🛠️",
                    SupportsVision = false,
                    SupportsWebSearch = false,
                    SupportsTools = true,
                    SupportsCodeExecution = true,
                    ContextWindow = 128000,
                    DefaultMaxTokens = 4096,
                    DefaultTemperature = 0.7f,
                    BestFor = "Function calling, Tool use, Agents",
                    Tags = new[] { "tools", "functions", "agents" }
                },
            };
        }

        public ModelCapabilityService(IConfiguration config)
        {
            _config = config;
            var baseUrl = config["Ollama:BaseUrl"] ?? "http://127.0.0.1:11434";
            _httpClient = new HttpClient { BaseAddress = new Uri(baseUrl) };
        }

        public List<ModelCapability> GetCloudModels()
        {
            return _capabilities.Values.ToList();
        }

        public ModelCapability? GetModel(string modelId)
        {
            return _capabilities.TryGetValue(modelId, out var cap) ? cap : null;
        }

        public async Task<List<string>> GetInstalledCloudModelsAsync()
        {
            try
            {
                var response = await _httpClient.GetStringAsync("/api/tags");
                var json = System.Text.Json.JsonDocument.Parse(response);
                var models = json.RootElement.GetProperty("models");

                var installedIds = new List<string>();
                foreach (var model in models.EnumerateArray())
                {
                    var name = model.GetProperty("name").GetString() ?? "";
                    installedIds.Add(name);
                }
                return installedIds;
            }
            catch
            {
                return _capabilities.Keys.ToList();
            }
        }

        public void UpdateModelParameters(string modelId, ModelParameters parameters)
        {
            _customParameters[modelId] = parameters;
        }

        public ModelParameters? GetModelParameters(string modelId)
        {
            if (_customParameters.TryGetValue(modelId, out var param))
                return param;

            var cap = GetModel(modelId);
            if (cap == null) return null;

            return new ModelParameters
            {
                Temperature = cap.DefaultTemperature,
                TopP = cap.DefaultTopP,
                MaxTokens = cap.DefaultMaxTokens,
                FrequencyPenalty = cap.DefaultFrequencyPenalty,
                PresencePenalty = cap.DefaultPresencePenalty,
                ContextDepth = 10
            };
        }
    }
}