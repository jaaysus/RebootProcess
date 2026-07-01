using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DynamicWi.Migrations
{
    /// <inheritdoc />
    public partial class AddModuleListEntries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FileContent",
                table: "ModuleLists");

            migrationBuilder.CreateTable(
                name: "ModuleListEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ModuleListId = table.Column<int>(type: "int", nullable: false),
                    Composite = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RowIndex = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    Module = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CPN = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModuleListEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ModuleListEntries_ModuleLists_ModuleListId",
                        column: x => x.ModuleListId,
                        principalTable: "ModuleLists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ModuleListEntries_ModuleListId",
                table: "ModuleListEntries",
                column: "ModuleListId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ModuleListEntries");

            migrationBuilder.AddColumn<string>(
                name: "FileContent",
                table: "ModuleLists",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
