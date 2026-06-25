using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DynamicWi.Migrations
{
    /// <inheritdoc />
    public partial class cleanup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Connectors");

            migrationBuilder.DropTable(
                name: "HarnessProjects");

            migrationBuilder.DropTable(
                name: "ProcessExcelData");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Connectors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Connectors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HarnessProjects",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModelName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModelYear = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HarnessProjects", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProcessExcelData",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AddedItems = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    C1 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    C2 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    C3 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Cav1 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Cav2 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Component = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Core = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Csa = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    DescriptionExtra = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Length = table.Column<int>(type: "int", nullable: true),
                    Module = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Node1 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Node2 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    SortieComponent = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SpLoc = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Station = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    WireName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessExcelData", x => x.Id);
                });
        }
    }
}
