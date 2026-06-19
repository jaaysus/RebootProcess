using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DynamicWi.Migrations
{
    /// <inheritdoc />
    public partial class QrAuthOperator : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Badge",
                table: "Operators",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "Password",
                table: "Operators",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<byte[]>(
                name: "QrCodeImage",
                table: "Operators",
                type: "varbinary(max)",
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.CreateIndex(
                name: "IX_Operators_Badge",
                table: "Operators",
                column: "Badge",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Operators_Badge",
                table: "Operators");

            migrationBuilder.DropColumn(
                name: "Password",
                table: "Operators");

            migrationBuilder.DropColumn(
                name: "QrCodeImage",
                table: "Operators");

            migrationBuilder.AlterColumn<string>(
                name: "Badge",
                table: "Operators",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");
        }
    }
}
