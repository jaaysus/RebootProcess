using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DynamicWi.Migrations
{
    /// <inheritdoc />
    public partial class ExcelProcessfix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "Length",
                table: "ProcessExcelData",
                type: "int",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "Length",
                table: "ProcessExcelData",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
        }
    }
}
