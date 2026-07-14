using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DynamicWi.Migrations
{
    /// <inheritdoc />
    public partial class FixEpnForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Epns_EpnPhotos_PhotoId",
                table: "Epns");

            migrationBuilder.DropIndex(
                name: "IX_Epns_PhotoId",
                table: "Epns");

            migrationBuilder.DropColumn(
                name: "PhotoId",
                table: "Epns");

            migrationBuilder.AddColumn<string>(
                name: "EpnCode",
                table: "EpnPhotos",
                type: "nvarchar(450)",
                nullable: true);

            // Populate EpnCode from existing FilePath data
            migrationBuilder.Sql(
                "UPDATE EpnPhotos SET EpnCode = CASE " +
                "WHEN CHARINDEX('/', FilePath) > 0 " +
                "THEN SUBSTRING(FilePath, CHARINDEX('/', FilePath) + 1, LEN(FilePath) - CHARINDEX('/', FilePath)) " +
                "ELSE FilePath END " +
                "WHERE EpnCode IS NULL");

            // Remove file extensions from EpnCode
            migrationBuilder.Sql(
                "UPDATE EpnPhotos SET EpnCode = REVERSE(SUBSTRING(REVERSE(EpnCode), CHARINDEX('.', REVERSE(EpnCode)) + 1, LEN(EpnCode))) " +
                "WHERE EpnCode LIKE '%.%'");

            // Make EpnCode NOT NULL after populating
            migrationBuilder.AlterColumn<string>(
                name: "EpnCode",
                table: "EpnPhotos",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddUniqueConstraint(
                name: "AK_EpnPhotos_EpnCode",
                table: "EpnPhotos",
                column: "EpnCode");

            migrationBuilder.CreateIndex(
                name: "IX_EpnPhotos_EpnCode",
                table: "EpnPhotos",
                column: "EpnCode",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Epns_EpnPhotos_EpnCode",
                table: "Epns",
                column: "EpnCode",
                principalTable: "EpnPhotos",
                principalColumn: "EpnCode",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Epns_EpnPhotos_EpnCode",
                table: "Epns");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_EpnPhotos_EpnCode",
                table: "EpnPhotos");

            migrationBuilder.DropIndex(
                name: "IX_EpnPhotos_EpnCode",
                table: "EpnPhotos");

            migrationBuilder.DropColumn(
                name: "EpnCode",
                table: "EpnPhotos");

            migrationBuilder.AddColumn<int>(
                name: "PhotoId",
                table: "Epns",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Epns_PhotoId",
                table: "Epns",
                column: "PhotoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Epns_EpnPhotos_PhotoId",
                table: "Epns",
                column: "PhotoId",
                principalTable: "EpnPhotos",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
