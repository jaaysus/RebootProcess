using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DynamicWi.Migrations
{
    /// <inheritdoc />
    public partial class ExcelProcess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProcessExcelData",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    DescriptionExtra = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    SortieComponent = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Component = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AddedItems = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Core = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SpLoc = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Csa = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Length = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    WireName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    C1 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    C2 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    C3 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Node1 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Cav1 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Node2 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Cav2 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Module = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Station = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessExcelData", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProcessExcelData");
        }
    }
}
