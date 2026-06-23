using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DynamicWi.Migrations
{
    /// <inheritdoc />
    public partial class AddWireDataAndEpnInfo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EpnInfos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Epn = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    CavityCount = table.Column<int>(type: "int", nullable: false),
                    HousingColor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Photo = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ImageWidth = table.Column<int>(type: "int", nullable: false),
                    ImageHeight = table.Column<int>(type: "int", nullable: false),
                    CoordinatesJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NeedsCoordination = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EpnInfos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WireDatas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WireNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Csa = table.Column<double>(type: "float", nullable: false),
                    Length = table.Column<double>(type: "float", nullable: false),
                    C1 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    C2 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Loc = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Node = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Epn = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    TotalCav = table.Column<int>(type: "int", nullable: false),
                    Cavity = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Module = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Station = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WireDatas", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EpnInfos");

            migrationBuilder.DropTable(
                name: "WireDatas");
        }
    }
}
