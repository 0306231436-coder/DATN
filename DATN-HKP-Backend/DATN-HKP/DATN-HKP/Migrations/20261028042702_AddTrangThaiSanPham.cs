using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DATN_HKP.Migrations
{
    /// <inheritdoc />
    public partial class AddTrangThaiSanPham : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "SanPhams",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "SanPhams");
        }
    }
}
