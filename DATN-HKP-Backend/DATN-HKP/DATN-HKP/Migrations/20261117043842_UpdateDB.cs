using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DATN_HKP.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDB : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BienTheSanPhams_SanPhams_MaSanPham",
                table: "BienTheSanPhams");

            migrationBuilder.DropForeignKey(
                name: "FK_ChiTietDonHangs_SanPhams_MaSanPham",
                table: "ChiTietDonHangs");

            migrationBuilder.DropForeignKey(
                name: "FK_ChiTietGioHangs_SanPhams_MaSanPham",
                table: "ChiTietGioHangs");

            migrationBuilder.DropForeignKey(
                name: "FK_DanhGias_SanPhams_MaSanPham",
                table: "DanhGias");

            migrationBuilder.DropForeignKey(
                name: "FK_HinhAnhSanPhams_SanPhams_MaSanPham",
                table: "HinhAnhSanPhams");

            migrationBuilder.DropForeignKey(
                name: "FK_SanPhams_DanhMucs_MaDanhMuc",
                table: "SanPhams");

            migrationBuilder.DropForeignKey(
                name: "FK_SanPhams_ThuongHieus_MaThuongHieu",
                table: "SanPhams");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SanPhams",
                table: "SanPhams");

            migrationBuilder.DropPrimaryKey(
                name: "PK_HinhAnhSanPhams",
                table: "HinhAnhSanPhams");

            migrationBuilder.DropColumn(
                name: "NgayTao",
                table: "SanPhams");

            migrationBuilder.RenameTable(
                name: "SanPhams",
                newName: "sanphams");

            migrationBuilder.RenameTable(
                name: "HinhAnhSanPhams",
                newName: "hinhanhsanphams");

            migrationBuilder.RenameIndex(
                name: "IX_SanPhams_MaThuongHieu",
                table: "sanphams",
                newName: "IX_sanphams_MaThuongHieu");

            migrationBuilder.RenameIndex(
                name: "IX_SanPhams_MaDanhMuc",
                table: "sanphams",
                newName: "IX_sanphams_MaDanhMuc");

            migrationBuilder.RenameIndex(
                name: "IX_HinhAnhSanPhams_MaSanPham",
                table: "hinhanhsanphams",
                newName: "IX_hinhanhsanphams_MaSanPham");

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayXoa",
                table: "ThuongHieus",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TrangThai",
                table: "ThuongHieus",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayXoa",
                table: "sanphams",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "SoDienThoai",
                table: "NguoiDungs",
                type: "varchar(10)",
                maxLength: 10,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(15)",
                oldMaxLength: 15,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayXoa",
                table: "DanhMucs",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TrangThai",
                table: "DanhMucs",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayXoa",
                table: "DanhGias",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TrangThai",
                table: "DanhGias",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayXoa",
                table: "BienTheSanPhams",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TrangThai",
                table: "BienTheSanPhams",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddPrimaryKey(
                name: "PK_sanphams",
                table: "sanphams",
                column: "MaSanPham");

            migrationBuilder.AddPrimaryKey(
                name: "PK_hinhanhsanphams",
                table: "hinhanhsanphams",
                column: "MaHinhAnh");

            migrationBuilder.AddForeignKey(
                name: "FK_BienTheSanPhams_sanphams_MaSanPham",
                table: "BienTheSanPhams",
                column: "MaSanPham",
                principalTable: "sanphams",
                principalColumn: "MaSanPham",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ChiTietDonHangs_sanphams_MaSanPham",
                table: "ChiTietDonHangs",
                column: "MaSanPham",
                principalTable: "sanphams",
                principalColumn: "MaSanPham",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ChiTietGioHangs_sanphams_MaSanPham",
                table: "ChiTietGioHangs",
                column: "MaSanPham",
                principalTable: "sanphams",
                principalColumn: "MaSanPham",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DanhGias_sanphams_MaSanPham",
                table: "DanhGias",
                column: "MaSanPham",
                principalTable: "sanphams",
                principalColumn: "MaSanPham",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_hinhanhsanphams_sanphams_MaSanPham",
                table: "hinhanhsanphams",
                column: "MaSanPham",
                principalTable: "sanphams",
                principalColumn: "MaSanPham",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_sanphams_DanhMucs_MaDanhMuc",
                table: "sanphams",
                column: "MaDanhMuc",
                principalTable: "DanhMucs",
                principalColumn: "MaDanhMuc",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_sanphams_ThuongHieus_MaThuongHieu",
                table: "sanphams",
                column: "MaThuongHieu",
                principalTable: "ThuongHieus",
                principalColumn: "MaThuongHieu",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BienTheSanPhams_sanphams_MaSanPham",
                table: "BienTheSanPhams");

            migrationBuilder.DropForeignKey(
                name: "FK_ChiTietDonHangs_sanphams_MaSanPham",
                table: "ChiTietDonHangs");

            migrationBuilder.DropForeignKey(
                name: "FK_ChiTietGioHangs_sanphams_MaSanPham",
                table: "ChiTietGioHangs");

            migrationBuilder.DropForeignKey(
                name: "FK_DanhGias_sanphams_MaSanPham",
                table: "DanhGias");

            migrationBuilder.DropForeignKey(
                name: "FK_hinhanhsanphams_sanphams_MaSanPham",
                table: "hinhanhsanphams");

            migrationBuilder.DropForeignKey(
                name: "FK_sanphams_DanhMucs_MaDanhMuc",
                table: "sanphams");

            migrationBuilder.DropForeignKey(
                name: "FK_sanphams_ThuongHieus_MaThuongHieu",
                table: "sanphams");

            migrationBuilder.DropPrimaryKey(
                name: "PK_sanphams",
                table: "sanphams");

            migrationBuilder.DropPrimaryKey(
                name: "PK_hinhanhsanphams",
                table: "hinhanhsanphams");

            migrationBuilder.DropColumn(
                name: "NgayXoa",
                table: "ThuongHieus");

            migrationBuilder.DropColumn(
                name: "TrangThai",
                table: "ThuongHieus");

            migrationBuilder.DropColumn(
                name: "NgayXoa",
                table: "sanphams");

            migrationBuilder.DropColumn(
                name: "NgayXoa",
                table: "DanhMucs");

            migrationBuilder.DropColumn(
                name: "TrangThai",
                table: "DanhMucs");

            migrationBuilder.DropColumn(
                name: "NgayXoa",
                table: "DanhGias");

            migrationBuilder.DropColumn(
                name: "TrangThai",
                table: "DanhGias");

            migrationBuilder.DropColumn(
                name: "NgayXoa",
                table: "BienTheSanPhams");

            migrationBuilder.DropColumn(
                name: "TrangThai",
                table: "BienTheSanPhams");

            migrationBuilder.RenameTable(
                name: "sanphams",
                newName: "SanPhams");

            migrationBuilder.RenameTable(
                name: "hinhanhsanphams",
                newName: "HinhAnhSanPhams");

            migrationBuilder.RenameIndex(
                name: "IX_sanphams_MaThuongHieu",
                table: "SanPhams",
                newName: "IX_SanPhams_MaThuongHieu");

            migrationBuilder.RenameIndex(
                name: "IX_sanphams_MaDanhMuc",
                table: "SanPhams",
                newName: "IX_SanPhams_MaDanhMuc");

            migrationBuilder.RenameIndex(
                name: "IX_hinhanhsanphams_MaSanPham",
                table: "HinhAnhSanPhams",
                newName: "IX_HinhAnhSanPhams_MaSanPham");

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayTao",
                table: "SanPhams",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<string>(
                name: "SoDienThoai",
                table: "NguoiDungs",
                type: "varchar(15)",
                maxLength: 15,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(10)",
                oldMaxLength: 10,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SanPhams",
                table: "SanPhams",
                column: "MaSanPham");

            migrationBuilder.AddPrimaryKey(
                name: "PK_HinhAnhSanPhams",
                table: "HinhAnhSanPhams",
                column: "MaHinhAnh");

            migrationBuilder.AddForeignKey(
                name: "FK_BienTheSanPhams_SanPhams_MaSanPham",
                table: "BienTheSanPhams",
                column: "MaSanPham",
                principalTable: "SanPhams",
                principalColumn: "MaSanPham",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ChiTietDonHangs_SanPhams_MaSanPham",
                table: "ChiTietDonHangs",
                column: "MaSanPham",
                principalTable: "SanPhams",
                principalColumn: "MaSanPham",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ChiTietGioHangs_SanPhams_MaSanPham",
                table: "ChiTietGioHangs",
                column: "MaSanPham",
                principalTable: "SanPhams",
                principalColumn: "MaSanPham",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DanhGias_SanPhams_MaSanPham",
                table: "DanhGias",
                column: "MaSanPham",
                principalTable: "SanPhams",
                principalColumn: "MaSanPham",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_HinhAnhSanPhams_SanPhams_MaSanPham",
                table: "HinhAnhSanPhams",
                column: "MaSanPham",
                principalTable: "SanPhams",
                principalColumn: "MaSanPham",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SanPhams_DanhMucs_MaDanhMuc",
                table: "SanPhams",
                column: "MaDanhMuc",
                principalTable: "DanhMucs",
                principalColumn: "MaDanhMuc",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SanPhams_ThuongHieus_MaThuongHieu",
                table: "SanPhams",
                column: "MaThuongHieu",
                principalTable: "ThuongHieus",
                principalColumn: "MaThuongHieu",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
