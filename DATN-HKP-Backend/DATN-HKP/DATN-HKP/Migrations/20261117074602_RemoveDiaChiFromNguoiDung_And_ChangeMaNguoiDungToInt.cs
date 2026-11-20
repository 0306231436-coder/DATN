using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DATN_HKP.Migrations
{
    /// <inheritdoc />
    public partial class RemoveDiaChiFromNguoiDung_And_ChangeMaNguoiDungToInt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DiaChi",
                table: "NguoiDungs");

            migrationBuilder.AlterColumn<string>(
                name: "TenNguoiNhan",
                table: "DiaChiNguoiDungs",
                type: "varchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "SoDienThoai",
                table: "DiaChiNguoiDungs",
                type: "varchar(10)",
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<int>(
                name: "MaNguoiDung",
                table: "DiaChiNguoiDungs",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "DiaChiChiTiet",
                table: "DiaChiNguoiDungs",
                type: "varchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_DiaChiNguoiDungs_MaNguoiDung",
                table: "DiaChiNguoiDungs",
                column: "MaNguoiDung");

            migrationBuilder.AddForeignKey(
                name: "FK_DiaChiNguoiDungs_NguoiDungs_MaNguoiDung",
                table: "DiaChiNguoiDungs",
                column: "MaNguoiDung",
                principalTable: "NguoiDungs",
                principalColumn: "MaNguoiDung",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DiaChiNguoiDungs_NguoiDungs_MaNguoiDung",
                table: "DiaChiNguoiDungs");

            migrationBuilder.DropIndex(
                name: "IX_DiaChiNguoiDungs_MaNguoiDung",
                table: "DiaChiNguoiDungs");

            migrationBuilder.AddColumn<string>(
                name: "DiaChi",
                table: "NguoiDungs",
                type: "varchar(255)",
                maxLength: 255,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "TenNguoiNhan",
                table: "DiaChiNguoiDungs",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(100)",
                oldMaxLength: 100)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "SoDienThoai",
                table: "DiaChiNguoiDungs",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(10)",
                oldMaxLength: 10)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "MaNguoiDung",
                table: "DiaChiNguoiDungs",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "DiaChiChiTiet",
                table: "DiaChiNguoiDungs",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(500)",
                oldMaxLength: 500)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }
    }
}
