using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DATN_HKP.Migrations
{
    /// <inheritdoc />
    public partial class AddLuotBanToSanPhams : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LuotBan",
                table: "SanPhams",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LuotBan",
                table: "SanPhams");
        }
    }
}
