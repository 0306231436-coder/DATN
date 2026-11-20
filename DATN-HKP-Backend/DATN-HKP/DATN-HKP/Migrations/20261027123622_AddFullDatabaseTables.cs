using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DATN_HKP.Migrations
{
    /// <inheritdoc />
    public partial class AddFullDatabaseTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaBienThe",
                table: "ChiTietDonHangs",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BienTheSanPhams",
                columns: table => new
                {
                    MaBienThe = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MaSanPham = table.Column<int>(type: "int", nullable: false),
                    TenBienThe = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SKU = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Gia = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    GiaKhuyenMai = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    SoLuongTon = table.Column<int>(type: "int", nullable: false),
                    HinhAnh = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BienTheSanPhams", x => x.MaBienThe);
                    table.ForeignKey(
                        name: "FK_BienTheSanPhams_SanPhams_MaSanPham",
                        column: x => x.MaSanPham,
                        principalTable: "SanPhams",
                        principalColumn: "MaSanPham",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "DiaChiNguoiDungs",
                columns: table => new
                {
                    MaDiaChi = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MaNguoiDung = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TenNguoiNhan = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SoDienThoai = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DiaChiChiTiet = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LaMacDinh = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiaChiNguoiDungs", x => x.MaDiaChi);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "HinhAnhSanPhams",
                columns: table => new
                {
                    MaHinhAnh = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MaSanPham = table.Column<int>(type: "int", nullable: false),
                    DuongDanAnh = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LaAnhChinh = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    ThuTuHienThi = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HinhAnhSanPhams", x => x.MaHinhAnh);
                    table.ForeignKey(
                        name: "FK_HinhAnhSanPhams_SanPhams_MaSanPham",
                        column: x => x.MaSanPham,
                        principalTable: "SanPhams",
                        principalColumn: "MaSanPham",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "MaGiamGias",
                columns: table => new
                {
                    MaVoucher = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Code = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SoTienGiam = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    GiaTriToiThieu = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SoLuong = table.Column<int>(type: "int", nullable: false),
                    NgayBatDau = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    NgayKetThuc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    TrangThai = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaGiamGias", x => x.MaVoucher);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ThongTinCuaHangs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TenCuaHang = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Hotline = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Email = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DiaChi = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Logo = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FanpageUrl = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MapEmbedUrl = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    GioMoCua = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ThongTinCuaHangs", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ChiTietGioHangs",
                columns: table => new
                {
                    MaChiTietGioHang = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MaNguoiDung = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MaSanPham = table.Column<int>(type: "int", nullable: false),
                    MaBienThe = table.Column<int>(type: "int", nullable: true),
                    SoLuong = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChiTietGioHangs", x => x.MaChiTietGioHang);
                    table.ForeignKey(
                        name: "FK_ChiTietGioHangs_BienTheSanPhams_MaBienThe",
                        column: x => x.MaBienThe,
                        principalTable: "BienTheSanPhams",
                        principalColumn: "MaBienThe");
                    table.ForeignKey(
                        name: "FK_ChiTietGioHangs_SanPhams_MaSanPham",
                        column: x => x.MaSanPham,
                        principalTable: "SanPhams",
                        principalColumn: "MaSanPham",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_ChiTietDonHangs_MaBienThe",
                table: "ChiTietDonHangs",
                column: "MaBienThe");

            migrationBuilder.CreateIndex(
                name: "IX_BienTheSanPhams_MaSanPham",
                table: "BienTheSanPhams",
                column: "MaSanPham");

            migrationBuilder.CreateIndex(
                name: "IX_ChiTietGioHangs_MaBienThe",
                table: "ChiTietGioHangs",
                column: "MaBienThe");

            migrationBuilder.CreateIndex(
                name: "IX_ChiTietGioHangs_MaSanPham",
                table: "ChiTietGioHangs",
                column: "MaSanPham");

            migrationBuilder.CreateIndex(
                name: "IX_HinhAnhSanPhams_MaSanPham",
                table: "HinhAnhSanPhams",
                column: "MaSanPham");

            migrationBuilder.AddForeignKey(
                name: "FK_ChiTietDonHangs_BienTheSanPhams_MaBienThe",
                table: "ChiTietDonHangs",
                column: "MaBienThe",
                principalTable: "BienTheSanPhams",
                principalColumn: "MaBienThe");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChiTietDonHangs_BienTheSanPhams_MaBienThe",
                table: "ChiTietDonHangs");

            migrationBuilder.DropTable(
                name: "ChiTietGioHangs");

            migrationBuilder.DropTable(
                name: "DiaChiNguoiDungs");

            migrationBuilder.DropTable(
                name: "HinhAnhSanPhams");

            migrationBuilder.DropTable(
                name: "MaGiamGias");

            migrationBuilder.DropTable(
                name: "ThongTinCuaHangs");

            migrationBuilder.DropTable(
                name: "BienTheSanPhams");

            migrationBuilder.DropIndex(
                name: "IX_ChiTietDonHangs_MaBienThe",
                table: "ChiTietDonHangs");

            migrationBuilder.DropColumn(
                name: "MaBienThe",
                table: "ChiTietDonHangs");
        }
    }
}
