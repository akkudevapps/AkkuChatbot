using System.Text.RegularExpressions;

namespace AkkuChatbot.Services
{
    /// <summary>
    /// Provides per-model system prompts and response post-processing.
    /// Inject as Singleton — no DB access, pure logic.
    /// </summary>
    public interface IModelFormattingService
    {
        string GetSystemPrompt(string modelId, string? userSystemPrompt = null);
        string CleanResponse(string raw, string modelId);
        ModelFormatProfile GetProfile(string modelId);
    }

    public enum ModelFormatProfile
    {
        Default,
        Coder,
        Reasoning,   // has <think> blocks
        Vision,
        Creative,
        Analyst
    }

    public class ModelFormattingService : IModelFormattingService
    {
        // ── Base instructions every model gets ─────────────────────────────────
        private const string BASE_RULES = """
            Formatting rules:
            - Use proper Markdown: **bold**, *italic*, `inline code`, ```language blocks```.
            - Use bullet lists (-) or numbered lists for multi-step content.
            - Use ### headings only when the response is long (>300 words) and has sections.
            - Do NOT pad responses with unnecessary preamble like "Certainly!", "Of course!", "Sure!".
            - Do NOT repeat the user's question back to them.
            - End responses cleanly — no filler closing lines like "I hope this helps!".
            - For code: always specify the language after the opening ```.
            - For math: use plain text notation, not LaTeX.
            """;

        private const string CODER_RULES = """
            You are a senior software engineer assistant.
            - Always wrap code in ```language blocks with the correct language identifier.
            - Prefer complete, runnable examples over partial snippets.
            - Include brief inline comments for non-obvious lines.
            - When showing diffs/changes, use before/after blocks clearly labelled.
            - For errors: show root cause first, then fix, then explanation.
            - Use Mermaid diagrams (```mermaid) for architecture or flow when helpful.
            """ + BASE_RULES;

        private const string REASONING_RULES = """
            You are a careful analytical assistant.
            - Think step by step before answering complex questions.
            - Structure long answers with clear numbered steps or sections.
            - Show your reasoning process — don't just state conclusions.
            - For comparisons: use a structured table or clearly separated sections.
            """ + BASE_RULES;

        private const string VISION_RULES = """
            You are a visual analysis assistant.
            - Describe images clearly and systematically: overall scene → specific details → text/data found.
            - For OCR tasks: extract text exactly as shown, preserving structure where possible.
            - For diagrams: describe the relationships and flow, not just what you see.
            - Always mention confidence level when uncertain about image content.
            """ + BASE_RULES;

        private const string CREATIVE_RULES = """
            You are a creative writing assistant.
            - Use vivid, engaging language appropriate to the requested style.
            - Structure creative content clearly — paragraphs, dialogue, stanzas as appropriate.
            - Do not break immersion with meta-commentary unless asked for feedback.
            """ + BASE_RULES;

        private const string ANALYST_RULES = """
            You are a data and business analysis assistant.
            - Lead with the key finding or recommendation, then support with evidence.
            - Use tables for comparative data when 3+ items are compared.
            - Use bullet lists for enumerated findings.
            - Quantify wherever possible — avoid vague qualifiers.
            - Use Mermaid (```mermaid) for flowcharts or process diagrams.
            """ + BASE_RULES;

        // ── Model → Profile mapping ─────────────────────────────────────────────
        private static readonly Dictionary<string, ModelFormatProfile> _profileMap = new()
        {
            // Reasoning models
            ["kimi-k2-thinking:cloud"] = ModelFormatProfile.Reasoning,
            ["deepseek-v3.2:cloud"] = ModelFormatProfile.Reasoning,
            ["deepseek-v4-flash:cloud"] = ModelFormatProfile.Reasoning,
            ["nemotron-3-super:cloud"] = ModelFormatProfile.Reasoning,
            ["qwen3.5:397b-cloud"] = ModelFormatProfile.Reasoning,
            ["cogito-2.1:671b-cloud"] = ModelFormatProfile.Reasoning,
            ["kimi-k2:1t-cloud"] = ModelFormatProfile.Reasoning,

            // Coder models
            ["qwen3-coder:480b-cloud"] = ModelFormatProfile.Coder,
            ["qwen3-coder-next:cloud"] = ModelFormatProfile.Coder,
            ["gpt-oss:120b-cloud"] = ModelFormatProfile.Coder,
            ["mistral-large-3:675b-cloud"] = ModelFormatProfile.Coder,

            // Vision models
            ["qwen3-vl:235b-cloud"] = ModelFormatProfile.Vision,
            ["qwen3-vl:235b-instruct-cloud"] = ModelFormatProfile.Vision,
            ["glm-4.7:cloud"] = ModelFormatProfile.Vision,
            ["gemma4:31b-cloud"] = ModelFormatProfile.Vision,

            // Creative / conversational
            ["minimax-m2.7:cloud"] = ModelFormatProfile.Creative,

            // Analyst / general
            ["gemini-3-flash-preview:cloud"] = ModelFormatProfile.Analyst,
            ["qwen3.5:cloud"] = ModelFormatProfile.Analyst,
        };

        // ── Public API ──────────────────────────────────────────────────────────

        public ModelFormatProfile GetProfile(string modelId)
            => _profileMap.TryGetValue(modelId, out var p) ? p : ModelFormatProfile.Default;

        public string GetSystemPrompt(string modelId, string? userSystemPrompt = null)
        {
            var profile = GetProfile(modelId);

            string basePrompt = profile switch
            {
                ModelFormatProfile.Coder => CODER_RULES,
                ModelFormatProfile.Reasoning => REASONING_RULES,
                ModelFormatProfile.Vision => VISION_RULES,
                ModelFormatProfile.Creative => CREATIVE_RULES,
                ModelFormatProfile.Analyst => ANALYST_RULES,
                _ => BASE_RULES
            };

            // User's custom system prompt appended AFTER the base rules
            // (user intent overrides style, but base rules keep formatting consistent)
            if (!string.IsNullOrWhiteSpace(userSystemPrompt))
                return basePrompt + "\n\nAdditional instructions:\n" + userSystemPrompt;

            return basePrompt;
        }

        // ── Response post-processing ────────────────────────────────────────────
        public string CleanResponse(string raw, string modelId)
        {
            if (string.IsNullOrEmpty(raw)) return raw;

            var profile = GetProfile(modelId);
            string result = raw;

            // 1. Strip <think>...</think> blocks from non-reasoning profiles
            //    (some models emit them even when not expected)
            if (profile != ModelFormatProfile.Reasoning)
            {
                result = Regex.Replace(result,
                    @"<think>[\s\S]*?</think>",
                    string.Empty,
                    RegexOptions.IgnoreCase);
            }

            // 2. Remove common filler openers that survive despite the system prompt
            result = StripFillerOpener(result);

            // 3. Normalise excessive blank lines (max 2 consecutive)
            result = Regex.Replace(result, @"\n{3,}", "\n\n");

            // 4. Trim leading/trailing whitespace
            result = result.Trim();

            return result;
        }

        // ── Helpers ─────────────────────────────────────────────────────────────
        private static readonly string[] FillerPrefixes =
        [
            "Certainly! ", "Certainly, ", "Of course! ", "Of course, ",
            "Sure! ", "Sure, ", "Absolutely! ", "Absolutely, ",
            "Great question! ", "Great! ", "Happy to help! ",
            "I'd be happy to help! ", "I'd be happy to ", "I'm happy to help! ",
            "I'll help you ", "Let me help you ", "Let me explain ",
        ];

        private static string StripFillerOpener(string text)
        {
            foreach (var prefix in FillerPrefixes)
            {
                if (text.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                {
                    // Capitalise the first letter of what remains
                    var rest = text[prefix.Length..].TrimStart();
                    if (rest.Length > 0)
                        return char.ToUpper(rest[0]) + rest[1..];
                }
            }
            return text;
        }
    }
}