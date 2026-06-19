using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DynamicWi.Migrations
{
    /// <inheritdoc />
    public partial class EditHarnessProject : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProjectID",
                table: "HarnessProjects");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProjectID",
                table: "HarnessProjects",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
