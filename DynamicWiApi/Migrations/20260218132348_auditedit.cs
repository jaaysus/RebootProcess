using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DynamicWi.Migrations
{
    /// <inheritdoc />
    public partial class AuditEdit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Badge",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Badge",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
