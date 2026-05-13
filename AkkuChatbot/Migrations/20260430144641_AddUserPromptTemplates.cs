using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AkkuChatbot.Migrations
{
    /// <inheritdoc />
    public partial class AddUserPromptTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            //migrationBuilder.CreateTable(
            //    name: "Artworks",
            //    columns: table => new
            //    {
            //        Id = table.Column<int>(type: "int", nullable: false)
            //            .Annotation("SqlServer:Identity", "1, 1"),
            //        UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
            //        Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
            //        CanvasJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
            //        ThumbnailPath = table.Column<string>(type: "nvarchar(max)", nullable: false),
            //        CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
            //        UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            //    },
            //    constraints: table =>
            //    {
            //        table.PrimaryKey("PK_Artworks", x => x.Id);
            //        table.ForeignKey(
            //            name: "FK_Artworks_AspNetUsers_UserId",
            //            column: x => x.UserId,
            //            principalTable: "AspNetUsers",
            //            principalColumn: "Id",
            //            onDelete: ReferentialAction.Cascade);
            //    });

            migrationBuilder.CreateTable(
                name: "UserPromptTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Prompt = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Style = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ThumbnailUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsSystem = table.Column<bool>(type: "bit", nullable: false),
                    IsPublic = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CoinAwarded = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPromptTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserPromptTemplates_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "UserPromptTemplates",
                columns: new[] { "Id", "Category", "CoinAwarded", "CreatedAt", "IsPublic", "IsSystem", "Prompt", "Style", "ThumbnailUrl", "Title", "UpdatedAt", "UserId" },
                values: new object[,]
                {
                    { -2, "Digital Art", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, true, "Digital concept art of [subject], vibrant colors, ArtStation trending, highly detailed", "Concept", "https://picsum.photos/120/80?random=2", "🎨 Digital Concept Art", null, "system" },
                    { -1, "Photography", 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), true, true, "Professional product photography of [subject], white background, studio lighting, 8K", "Studio", "https://picsum.photos/120/80?random=1", "📷 Photorealistic Product", null, "system" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Artworks_UserId",
                table: "Artworks",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserPromptTemplates_UserId",
                table: "UserPromptTemplates",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Artworks");

            migrationBuilder.DropTable(
                name: "UserPromptTemplates");
        }
    }
}
