using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AkkuChatbot.Migrations
{
    /// <inheritdoc />
    public partial class AddMoreSystemTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "UserPromptTemplates",
                columns: new[] { "Id", "Category", "CoinAwarded", "CreatedAt", "IsPublic", "IsSystem", "Prompt", "Style", "ThumbnailUrl", "Title", "UpdatedAt", "UserId" },
                values: new object[,]
                {
                    { -101, "Cinematic", 0, new DateTime(2026, 4, 30, 15, 57, 40, 919, DateTimeKind.Utc).AddTicks(2852), true, true, "Create a cinematic movie poster...", "Movie Poster", "https://picsum.photos/120/80?random=101", "Cinematic Movie Poster", null, "system" },
                    { -5, "image", 0, new DateTime(2026, 4, 30, 15, 57, 40, 919, DateTimeKind.Utc).AddTicks(2863), true, true, "Generate a photorealistic image of: [describe subject here]. Use natural lighting, high detail, 4K quality.", "Photorealistic", "https://picsum.photos/120/80?random=5", "🖼️ Photorealistic Image", null, "system" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -101);

            migrationBuilder.DeleteData(
                table: "UserPromptTemplates",
                keyColumn: "Id",
                keyValue: -5);
        }
    }
}
