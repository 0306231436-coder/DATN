using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DATN_HKP.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "QrThanhToan",
                table: "ThongTinCuaHangs",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "SoTaiKhoan",
                table: "ThongTinCuaHangs",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "TenChuTaiKhoan",
                table: "ThongTinCuaHangs",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "TenNganHang",
                table: "ThongTinCuaHangs",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "HinhAnhThanhToan",
                table: "DonHangs",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "LyDoTuChoiThanhToan",
                table: "DonHangs",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayThongBaoThanhToan",
                table: "DonHangs",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayXacNhanThanhToan",
                table: "DonHangs",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NguoiXacNhanThanhToan",
                table: "DonHangs",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "TrangThaiThanhToan",
                table: "DonHangs",
                type: "longtext",
                defaultValue: "Chưa thanh toán",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "LogThanhToans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MaDonHang = table.Column<int>(type: "int", nullable: false),
                    HanhDong = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NguoiThucHien = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LyDo = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ThoiDiem = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogThanhToans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LogThanhToans_DonHangs_MaDonHang",
                        column: x => x.MaDonHang,
                        principalTable: "DonHangs",
                        principalColumn: "MaDonHang",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_LogThanhToans_MaDonHang",
                table: "LogThanhToans",
                column: "MaDonHang");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LogThanhToans");

            migrationBuilder.DropColumn(
                name: "QrThanhToan",
                table: "ThongTinCuaHangs");

            migrationBuilder.DropColumn(
                name: "SoTaiKhoan",
                table: "ThongTinCuaHangs");

            migrationBuilder.DropColumn(
                name: "TenChuTaiKhoan",
                table: "ThongTinCuaHangs");

            migrationBuilder.DropColumn(
                name: "TenNganHang",
                table: "ThongTinCuaHangs");

            migrationBuilder.DropColumn(
                name: "HinhAnhThanhToan",
                table: "DonHangs");

            migrationBuilder.DropColumn(
                name: "LyDoTuChoiThanhToan",
                table: "DonHangs");

            migrationBuilder.DropColumn(
                name: "NgayThongBaoThanhToan",
                table: "DonHangs");

            migrationBuilder.DropColumn(
                name: "NgayXacNhanThanhToan",
                table: "DonHangs");

            migrationBuilder.DropColumn(
                name: "NguoiXacNhanThanhToan",
                table: "DonHangs");

            migrationBuilder.DropColumn(
                name: "TrangThaiThanhToan",
                table: "DonHangs");
        }
    }
}
