using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AkkuChatbot.Migrations
{
    /// <inheritdoc />
    public partial class AddIncludeInContext : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IncludeInContext",
                table: "ChatMessages",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IncludeInContext",
                table: "ChatMessages");
        }
    }
}
