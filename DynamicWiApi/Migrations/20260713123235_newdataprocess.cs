using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DynamicWi.Migrations
{
    /// <inheritdoc />
    public partial class newdataprocess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WireDatas");

            migrationBuilder.CreateTable(
                name: "Nodes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EpnId = table.Column<int>(type: "int", nullable: false),
                    Station = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Nodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Nodes_Epns_EpnId",
                        column: x => x.EpnId,
                        principalTable: "Epns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Wires",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WireNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Csa = table.Column<double>(type: "float", nullable: false),
                    Length = table.Column<double>(type: "float", nullable: false),
                    Core = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    ColorC1 = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    ColorC2 = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Module = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SpliceCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Wires", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WireEnds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WireId = table.Column<int>(type: "int", nullable: false),
                    NodeId = table.Column<int>(type: "int", nullable: false),
                    Cavity = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Location = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Station = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WireEnds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WireEnds_Nodes_NodeId",
                        column: x => x.NodeId,
                        principalTable: "Nodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WireEnds_Wires_WireId",
                        column: x => x.WireId,
                        principalTable: "Wires",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Nodes_EpnId",
                table: "Nodes",
                column: "EpnId");

            migrationBuilder.CreateIndex(
                name: "IX_Nodes_Name",
                table: "Nodes",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WireEnds_NodeId_Cavity",
                table: "WireEnds",
                columns: new[] { "NodeId", "Cavity" });

            migrationBuilder.CreateIndex(
                name: "IX_WireEnds_WireId",
                table: "WireEnds",
                column: "WireId");

            migrationBuilder.CreateIndex(
                name: "IX_Wires_SpliceCode",
                table: "Wires",
                column: "SpliceCode");

            migrationBuilder.CreateIndex(
                name: "IX_Wires_WireNumber",
                table: "Wires",
                column: "WireNumber");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WireEnds");

            migrationBuilder.DropTable(
                name: "Nodes");

            migrationBuilder.DropTable(
                name: "Wires");

            migrationBuilder.CreateTable(
                name: "WireDatas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    C1 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    C2 = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Cavity = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Core = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Csa = table.Column<double>(type: "float", nullable: false),
                    Epn = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Length = table.Column<double>(type: "float", nullable: false),
                    Loc = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Module = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Node = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Splice = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Station = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Twist = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    WireNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WireDatas", x => x.Id);
                });
        }
    }
}
