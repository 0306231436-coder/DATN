using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DATN_HKP.Migrations
{
    /// <inheritdoc />
    public partial class AddTrangThaiSanPham1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "SanPhams",
                newName: "TrangThai");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "TrangThai",
                table: "SanPhams",
                newName: "IsActive");
        }
    }
}
