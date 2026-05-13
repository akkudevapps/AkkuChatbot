using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AkkuChatbot.Migrations
{
    /// <inheritdoc />
    public partial class MatchExistingDb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatMessages_AspNetUsers_UserId",
                table: "ChatMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_ChatMessages_ChatSessions_SessionId",
                table: "ChatMessages");

            migrationBuilder.AddColumn<string>(
                name: "FluxModel",
                table: "UserPromptTemplates",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "GuidanceScale",
                table: "UserPromptTemplates",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "Height",
                table: "UserPromptTemplates",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "NegativePrompt",
                table: "UserPromptTemplates",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Seed",
                table: "UserPromptTemplates",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Steps",
                table: "UserPromptTemplates",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Width",
                table: "UserPromptTemplates",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -120,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Seed", "Steps", "Width" },
                values: new object[] { "flux", 7.5, 1024, null, null, 20, 1024 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -119,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Prompt", "Seed", "Steps", "Width" },
                values: new object[] { "flux", 7.5, 1024, null, "சிறந்த தமிழ் மேற்கோளை உருவாக்குக: [topic]. மேற்கோள் 15-25 வார்த்தைகளில் இருக்க வேண்டும். பாரம்பரிய தமிழ் இலக்கிய பாணியில் அமைய வேண்டும்.", null, 20, 1024 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -118,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Prompt", "Seed", "Steps", "Width" },
                values: new object[] { "flux", 7.5, 1024, null, "Extract key terms from the following document and create a glossary. Sort alphabetically. Each entry: term - definition (one sentence).", null, 20, 1024 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -117,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Prompt", "Seed", "Steps", "Width" },
                values: new object[] { "flux", 7.5, 1024, null, "Rewrite the following formal paragraph into casual, conversational style for WhatsApp. Use short sentences, contractions, and emojis.", null, 20, 1024 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -116,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Seed", "Steps", "Title", "Width" },
                values: new object[] { "flux", 7.5, 1024, null, null, 20, "English to Hinglish Translation", 1024 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -115,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Prompt", "Seed", "Steps", "Width" },
                values: new object[] { "flux", 7.5, 1024, null, "List 10 essential steps to clean a messy dataset. Include handling missing values, removing duplicates, standardizing formats, outlier detection.", null, 20, 1024 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -114,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Prompt", "Seed", "Steps", "Width" },
                values: new object[] { "flux", 7.5, 1024, null, "Perform a SWOT analysis for [competitor name] in the [industry] sector. Include specific examples and strategic recommendations.", null, 20, 1024 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -113,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Prompt", "Seed", "Steps", "Width" },
                values: new object[] { "flux", 7.5, 1024, null, "Explain how to calculate Return on Investment (ROI) for [project/software]. Provide formula, example with numbers, and interpretation of results.", null, 20, 1024 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -112,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Prompt", "Seed", "Steps", "Width" },
                values: new object[] { "flux", 7.5, 1024, null, "Create a LinkedIn carousel post (6 slides) about: [topic]. Each slide has a heading, short bullet points, and an engaging question. End with a call-to-action.", null, 20, 1024 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -111,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Prompt", "Seed", "Steps", "Title", "Width" },
                values: new object[] { "flux", 7.5, 1024, null, "Write a step-by-step guide on: [topic]. Include numbered steps, warnings, tool/materials list, and a troubleshooting section. Clear and beginner-friendly.", null, 20, "How-To Guide", 1024 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -110,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Prompt", "Seed", "Steps", "Title", "Width" },
                values: new object[] { "flux", 7.5, 1024, null, "Write a detailed product review for: [product name]. Rating: 4.5/5. Include pros, cons, technical specifications, and a personal usage story.", null, 20, "Product Review Amazon Style", 1024 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -109,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Prompt", "Seed", "Steps", "Width" },
                values: new object[] { "flux", 7.5, 1024, null, "Write a persuasive sales email for: [product/service]. Target audience: [description]. Highlight benefits, include urgency and end with a clear call-to-action.", null, 20, 1024 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -108,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Seed", "Steps", "Width" },
                values: new object[] { "flux", 7.5, 1024, null, null, 20, 1024 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -107,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Seed", "Steps", "Width" },
                values: new object[] { "flux", 7.5, 1024, null, null, 20, 1024 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -106,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Seed", "Steps", "Width" },
                values: new object[] { "flux", 7.5, 1024, null, null, 20, 1024 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -105,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Prompt", "Seed", "Steps", "Width" },
                values: new object[] { "any-dark", 6.0, 1024, "color, photograph, digital", "Ink sketch of: [subject]. Black ink on off-white paper, cross-hatching, expressive lines, no color, high contrast, artistic, fine art style.", null, 20, 1024 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -104,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Prompt", "Seed", "Steps", "Width" },
                values: new object[] { "flux-realism", 7.5, 1024, "blurry, watermark, distorted", "Photorealistic product packaging mockup for: [product name]. Box on a white background, studio lighting, 8K, with brand logo, ingredients list, and barcode. Marketing-ready.", null, 28, 1024 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -103,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Prompt", "Seed", "Steps", "Width" },
                values: new object[] { "flux", 7.0, 1024, "modern, digital, sharp", "Vintage travel poster for: [destination]. Style: 1920s Art Deco. Colors: muted retro palette. Paper texture, distressed edges, nostalgic feel.", null, 25, 768 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -102,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Seed", "Steps", "Width" },
                values: new object[] { "flux-anime", 8.0, 1152, "deformed, ugly, bad anatomy", null, 30, 896 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -101,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Prompt", "Seed", "Steps", "Width" },
                values: new object[] { "flux-realism", 7.5, 1536, "blurry, low quality, text errors", "Create a cinematic movie poster for: [film title]. Genre: [action/drama/horror/sci-fi]. Include dramatic lighting, a central hero/villain figure, and a tagline at the bottom. Ultra-detailed, 4K, film grain.", null, 30, 1024 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -5,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Seed", "Steps", "Title", "Width" },
                values: new object[] { "flux-realism", 7.5, 1024, "cartoon, anime, painting", null, 28, "Photorealistic Image", 1024 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -2,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Seed", "Steps", "Title", "Width" },
                values: new object[] { "flux-anime", 8.0, 1024, "blurry, low quality", null, 30, "Digital Concept Art", 1024 });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -1,
                columns: new[] { "FluxModel", "GuidanceScale", "Height", "NegativePrompt", "Seed", "Steps", "Title", "Width" },
                values: new object[] { "flux-realism", 7.5, 1024, "blurry, dark, shadow", null, 25, "Photorealistic Product", 1024 });

            migrationBuilder.AddForeignKey(
                name: "FK_ChatMessages_AspNetUsers_UserId",
                table: "ChatMessages",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatMessages_ChatSessions_SessionId",
                table: "ChatMessages",
                column: "SessionId",
                principalTable: "ChatSessions",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatMessages_AspNetUsers_UserId",
                table: "ChatMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_ChatMessages_ChatSessions_SessionId",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "FluxModel",
                table: "UserPromptTemplates");

            migrationBuilder.DropColumn(
                name: "GuidanceScale",
                table: "UserPromptTemplates");

            migrationBuilder.DropColumn(
                name: "Height",
                table: "UserPromptTemplates");

            migrationBuilder.DropColumn(
                name: "NegativePrompt",
                table: "UserPromptTemplates");

            migrationBuilder.DropColumn(
                name: "Seed",
                table: "UserPromptTemplates");

            migrationBuilder.DropColumn(
                name: "Steps",
                table: "UserPromptTemplates");

            migrationBuilder.DropColumn(
                name: "Width",
                table: "UserPromptTemplates");

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -119,
                column: "Prompt",
                value: "சிறந்த தமிழ் மேற்கோளை உருவாக்குக: [topic] (e.g., விடாமுயற்சி, கல்வி, நம்பிக்கை). மேற்கோள் 15‑25 வார்த்தைகளில் இருக்க வேண்டும். பாரம்பரிய தமிழ் இலக்கிய பாணியில் அமைய வேண்டும்.");

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -118,
                column: "Prompt",
                value: "Extract key terms from the following document and create a glossary with definitions. Sort alphabetically. Each entry: term – definition (one sentence).");

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -117,
                column: "Prompt",
                value: "Rewrite the following formal paragraph into a casual, conversational style suitable for a text message or WhatsApp chat. Use short sentences, contractions, and emojis where appropriate.");

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -116,
                column: "Title",
                value: "English → Hinglish Translation");

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -115,
                column: "Prompt",
                value: "List 10 essential steps to clean a messy dataset before analysis. Include handling missing values, removing duplicates, standardizing formats, outlier detection, and data type conversion.");

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -114,
                column: "Prompt",
                value: "Perform a SWOT analysis for [competitor name] in the [industry] sector. Include specific examples and strategic recommendations based on the analysis.");

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -113,
                column: "Prompt",
                value: "Explain how to calculate Return on Investment (ROI) for [project/software]. Provide formula, example with numbers, and interpretation of results. Use a table for comparison.");

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -112,
                column: "Prompt",
                value: "Create a LinkedIn carousel post (6 slides) about: [topic]. Each slide has a heading, short bullet points, and an engaging question. Ending with a call‑to‑action.");

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -111,
                columns: new[] { "Prompt", "Title" },
                values: new object[] { "Write a step‑by‑step guide on: [topic]. Include numbered steps, warnings, tool/materials list, and a troubleshooting section. Clear and beginner‑friendly.", "How‑To Guide" });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -110,
                columns: new[] { "Prompt", "Title" },
                values: new object[] { "Write a detailed product review for: [product name]. Rating: 4.5/5. Include pros, cons, technical specifications, and a personal usage story. Be honest and helpful.", "Product Review (Amazon style)" });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -109,
                column: "Prompt",
                value: "Write a persuasive sales email for: [product/service]. Target audience: [description]. Highlight benefits, include urgency (limited time offer), and end with a clear call‑to‑action. Professional but friendly tone.");

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -105,
                column: "Prompt",
                value: "Ink sketch of: [subject]. Black ink on off‑white paper, cross‑hatching, expressive lines, no color, high contrast, artistic, fine art style.");

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -104,
                column: "Prompt",
                value: "Photorealistic product packaging mockup for: [product name]. Box on a white background, studio lighting, 8K, with brand logo, ingredients list, and barcode. Marketing‑ready.");

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -103,
                column: "Prompt",
                value: "Vintage travel poster for: [destination]. Style: 1920s Art Deco. Colors: muted retro palette. Text: '[Destination] – Book your journey today'. Paper texture, distressed edges, nostalgic feel.");

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -101,
                column: "Prompt",
                value: "Create a cinematic movie poster for: [film title]. Genre: [action/drama/horror/sci‑fi]. Include dramatic lighting, a central hero/villain figure, and a tagline at the bottom. Ultra‑detailed, 4K, film grain.");

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -5,
                column: "Title",
                value: "🖼️ Photorealistic Image");

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -2,
                column: "Title",
                value: "🎨 Digital Concept Art");

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -1,
                column: "Title",
                value: "📷 Photorealistic Product");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatMessages_AspNetUsers_UserId",
                table: "ChatMessages",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ChatMessages_ChatSessions_SessionId",
                table: "ChatMessages",
                column: "SessionId",
                principalTable: "ChatSessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
