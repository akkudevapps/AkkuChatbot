using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AkkuChatbot.Migrations
{
    /// <inheritdoc />
    public partial class FixSeedDates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -101,
                columns: new[] { "CreatedAt", "Prompt" },
                values: new object[] { new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Create a cinematic movie poster for: [film title]. Genre: [action/drama/horror/sci‑fi]. Include dramatic lighting, a central hero/villain figure, and a tagline at the bottom. Ultra‑detailed, 4K, film grain." });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -5,
                column: "CreatedAt",
                value: new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.InsertData(
                table: "UserPromptTemplates",
                columns: new[] { "Id", "Category", "CoinAwarded", "CreatedAt", "IsPublic", "IsSystem", "Prompt", "Style", "ThumbnailUrl", "Title", "UpdatedAt", "UserId" },
                values: new object[,]
                {
                    { -120, "Tamil", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "தற்போதைய [topic] பற்றிய செய்தித் தலைப்பை எழுதுக. பத்திரிகை பாணியில், சுருக்கமாக, கவனத்தை ஈர்க்கும் வண்ணம். துணைத்தலைப்பும் சேர்க்கவும்.", "News", "https://picsum.photos/120/80?random=120", "Tamil News Headline", null, "system" },
                    { -119, "Tamil", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "சிறந்த தமிழ் மேற்கோளை உருவாக்குக: [topic] (e.g., விடாமுயற்சி, கல்வி, நம்பிக்கை). மேற்கோள் 15‑25 வார்த்தைகளில் இருக்க வேண்டும். பாரம்பரிய தமிழ் இலக்கிய பாணியில் அமைய வேண்டும்.", "Quote", "https://picsum.photos/120/80?random=119", "Tamil Motivational Quote", null, "system" },
                    { -118, "Translate", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "Extract key terms from the following document and create a glossary with definitions. Sort alphabetically. Each entry: term – definition (one sentence).", "Technical Writing", "https://picsum.photos/120/80?random=118", "Glossary Creator", null, "system" },
                    { -117, "Translate", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "Rewrite the following formal paragraph into a casual, conversational style suitable for a text message or WhatsApp chat. Use short sentences, contractions, and emojis where appropriate.", "Casual", "https://picsum.photos/120/80?random=117", "Formal to Casual Rewriter", null, "system" },
                    { -116, "Translate", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "Translate the following text into Hinglish (Hindi written in Latin script). Keep the informal, friendly tone as if messaging a friend.", "Hinglish", "https://picsum.photos/120/80?random=116", "English → Hinglish Translation", null, "system" },
                    { -115, "Analysis", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "List 10 essential steps to clean a messy dataset before analysis. Include handling missing values, removing duplicates, standardizing formats, outlier detection, and data type conversion.", "Data Science", "https://picsum.photos/120/80?random=115", "Data Cleaning Checklist", null, "system" },
                    { -114, "Analysis", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "Perform a SWOT analysis for [competitor name] in the [industry] sector. Include specific examples and strategic recommendations based on the analysis.", "Strategy", "https://picsum.photos/120/80?random=114", "SWOT Competitor Analysis", null, "system" },
                    { -113, "Analysis", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "Explain how to calculate Return on Investment (ROI) for [project/software]. Provide formula, example with numbers, and interpretation of results. Use a table for comparison.", "Business", "https://picsum.photos/120/80?random=113", "ROI Calculator Explanation", null, "system" },
                    { -112, "Writing", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "Create a LinkedIn carousel post (6 slides) about: [topic]. Each slide has a heading, short bullet points, and an engaging question. Ending with a call‑to‑action.", "Social Media", "https://picsum.photos/120/80?random=112", "LinkedIn Carousel Post", null, "system" },
                    { -111, "Writing", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "Write a step‑by‑step guide on: [topic]. Include numbered steps, warnings, tool/materials list, and a troubleshooting section. Clear and beginner‑friendly.", "Tutorial", "https://picsum.photos/120/80?random=111", "How‑To Guide", null, "system" },
                    { -110, "Writing", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "Write a detailed product review for: [product name]. Rating: 4.5/5. Include pros, cons, technical specifications, and a personal usage story. Be honest and helpful.", "Review", "https://picsum.photos/120/80?random=110", "Product Review (Amazon style)", null, "system" },
                    { -109, "Writing", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "Write a persuasive sales email for: [product/service]. Target audience: [description]. Highlight benefits, include urgency (limited time offer), and end with a clear call‑to‑action. Professional but friendly tone.", "Sales", "https://picsum.photos/120/80?random=109", "Persuasive Sales Email", null, "system" },
                    { -108, "Code", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "Generate OpenAPI (Swagger) documentation for the following API endpoints. Include request/response schemas, example values, error codes, and authentication method.", "API", "https://picsum.photos/120/80?random=108", "REST API Documentation", null, "system" },
                    { -107, "Code", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "Debug this Python code. Identify syntax errors, logical mistakes, and edge cases. Provide fixed code with comments explaining each correction.", "Python", "https://picsum.photos/120/80?random=107", "Python Debugger Assistant", null, "system" },
                    { -106, "Code", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "Optimize the following SQL query. Add proper indexes, rewrite inefficient joins, use CTEs where beneficial, and explain performance gains.", "SQL", "https://picsum.photos/120/80?random=106", "SQL Query Optimizer", null, "system" },
                    { -105, "Digital Art", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "Ink sketch of: [subject]. Black ink on off‑white paper, cross‑hatching, expressive lines, no color, high contrast, artistic, fine art style.", "Sketch", "https://picsum.photos/120/80?random=105", "Monochrome Ink Sketch", null, "system" },
                    { -104, "Photography", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "Photorealistic product packaging mockup for: [product name]. Box on a white background, studio lighting, 8K, with brand logo, ingredients list, and barcode. Marketing‑ready.", "Product", "https://picsum.photos/120/80?random=104", "Product Packaging Mockup", null, "system" },
                    { -103, "Photography", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "Vintage travel poster for: [destination]. Style: 1920s Art Deco. Colors: muted retro palette. Text: '[Destination] – Book your journey today'. Paper texture, distressed edges, nostalgic feel.", "Vintage", "https://picsum.photos/120/80?random=103", "Vintage Travel Poster", null, "system" },
                    { -102, "Digital Art", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, true, "Fantasy character portrait of: [character name]. Race: [elf/dwarf/orc/human]. Class: [mage/warrior/rogue]. Magical glowing eyes, intricate armor, mystical background, highly detailed digital painting.", "Fantasy", "https://picsum.photos/120/80?random=102", "Fantasy Character Portrait", null, "system" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -120);

            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -119);

            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -118);

            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -117);

            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -116);

            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -115);

            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -114);

            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -113);

            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -112);

            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -111);

            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -110);

            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -109);

            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -108);

            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -107);

            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -106);

            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -105);

            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -104);

            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -103);

            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -102);

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -101,
                columns: new[] { "CreatedAt", "Prompt" },
                values: new object[] { new DateTime(2026, 4, 30, 15, 57, 40, 919, DateTimeKind.Utc).AddTicks(2852), "Create a cinematic movie poster..." });

            migrationBuilder.UpdateData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -5,
                column: "CreatedAt",
                value: new DateTime(2026, 4, 30, 15, 57, 40, 919, DateTimeKind.Utc).AddTicks(2863));
        }
    }
}
