using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DynamicWi.Migrations
{
    /// <inheritdoc />
    public partial class AddEpnTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EpnInfos");

            migrationBuilder.CreateTable(
                name: "EpnPhotos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PhotoWidth = table.Column<int>(type: "int", nullable: false),
                    PhotoHeight = table.Column<int>(type: "int", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EpnPhotos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Epns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EpnCode = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CavityCount = table.Column<int>(type: "int", nullable: false),
                    PhotoId = table.Column<int>(type: "int", nullable: true),
                    NeedsCoordination = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Epns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Epns_EpnPhotos_PhotoId",
                        column: x => x.PhotoId,
                        principalTable: "EpnPhotos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "EpnCavities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EpnId = table.Column<int>(type: "int", nullable: false),
                    CavityNumber = table.Column<int>(type: "int", nullable: false),
                    X = table.Column<int>(type: "int", nullable: false),
                    Y = table.Column<int>(type: "int", nullable: false),
                    Size = table.Column<int>(type: "int", nullable: false),
                    Shape = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EpnCavities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EpnCavities_Epns_EpnId",
                        column: x => x.EpnId,
                        principalTable: "Epns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EpnCavities_EpnId",
                table: "EpnCavities",
                column: "EpnId");

            migrationBuilder.CreateIndex(
                name: "IX_Epns_EpnCode",
                table: "Epns",
                column: "EpnCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Epns_PhotoId",
                table: "Epns",
                column: "PhotoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EpnCavities");

            migrationBuilder.DropTable(
                name: "Epns");

            migrationBuilder.DropTable(
                name: "EpnPhotos");

            migrationBuilder.CreateTable(
                name: "EpnInfos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CavityCount = table.Column<int>(type: "int", nullable: false),
                    CoordinatesJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Epn = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    ImageHeight = table.Column<int>(type: "int", nullable: false),
                    ImageWidth = table.Column<int>(type: "int", nullable: false),
                    NeedsCoordination = table.Column<bool>(type: "bit", nullable: false),
                    Photo = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EpnInfos", x => x.Id);
                });
        }
    }
}
