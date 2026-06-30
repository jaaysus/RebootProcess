using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DynamicWi.Migrations
{
    /// <inheritdoc />
    public partial class Modules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Composite",
                table: "ModuleLists");

            migrationBuilder.DropColumn(
                name: "LjsOrd",
                table: "ModuleLists");

            migrationBuilder.DropColumn(
                name: "Module",
                table: "ModuleLists");

            migrationBuilder.AddColumn<string>(
                name: "FileContent",
                table: "ModuleLists",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FileName",
                table: "ModuleLists",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UploadDate",
                table: "ModuleLists",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "UploadedBy",
                table: "ModuleLists",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Composites",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompositeName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    CompositeCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Composites", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ModuleLists_UploadedBy",
                table: "ModuleLists",
                column: "UploadedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Composites_CompositeCode",
                table: "Composites",
                column: "CompositeCode",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ModuleLists_Users_UploadedBy",
                table: "ModuleLists",
                column: "UploadedBy",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ModuleLists_Users_UploadedBy",
                table: "ModuleLists");

            migrationBuilder.DropTable(
                name: "Composites");

            migrationBuilder.DropIndex(
                name: "IX_ModuleLists_UploadedBy",
                table: "ModuleLists");

            migrationBuilder.DropColumn(
                name: "FileContent",
                table: "ModuleLists");

            migrationBuilder.DropColumn(
                name: "FileName",
                table: "ModuleLists");

            migrationBuilder.DropColumn(
                name: "UploadDate",
                table: "ModuleLists");

            migrationBuilder.DropColumn(
                name: "UploadedBy",
                table: "ModuleLists");

            migrationBuilder.AddColumn<string>(
                name: "Composite",
                table: "ModuleLists",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "LjsOrd",
                table: "ModuleLists",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Module",
                table: "ModuleLists",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }
    }
}
