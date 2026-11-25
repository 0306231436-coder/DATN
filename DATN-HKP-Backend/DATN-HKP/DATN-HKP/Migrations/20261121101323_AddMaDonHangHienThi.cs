using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DATN_HKP.Migrations
{
    /// <inheritdoc />
    public partial class AddMaDonHangHienThi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MaDonHangHienThi",
                table: "DonHangs",
                type: "varchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            // Thêm đoạn này: Tự động sinh mã cho các đơn cũ theo cú pháp MySQL
            migrationBuilder.Sql(
                "UPDATE `DonHangs` SET `MaDonHangHienThi` = CONCAT('DH', DATE_FORMAT(`NgayDat`, '%Y%m%d'), LPAD(`MaDonHang`, 4, '0')) WHERE `MaDonHangHienThi` = '';"
            );

            migrationBuilder.CreateIndex(
                name: "IX_DonHangs_MaDonHangHienThi",
                table: "DonHangs",
                column: "MaDonHangHienThi",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DonHangs_MaDonHangHienThi",
                table: "DonHangs");

            migrationBuilder.DropColumn(
                name: "MaDonHangHienThi",
                table: "DonHangs");
        }
    }
}
