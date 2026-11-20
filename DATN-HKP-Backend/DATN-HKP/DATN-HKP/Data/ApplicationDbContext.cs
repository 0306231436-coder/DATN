using System.Reflection;
using DATN_HKP.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace DATN_HKP.Data
{
    public class ApplicationDbContext : IdentityDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Các bảng mở rộng mới
        public DbSet<BienTheSanPham> BienTheSanPhams { get; set; }
        public DbSet<HinhAnhSanPham> HinhAnhSanPhams { get; set; }
        public DbSet<ChiTietGioHang> ChiTietGioHangs { get; set; }
        public DbSet<DiaChiNguoiDung> DiaChiNguoiDungs { get; set; }
        public DbSet<MaGiamGia> MaGiamGias { get; set; }
        public DbSet<ThongTinCuaHang> ThongTinCuaHangs { get; set; }
        public DbSet<NguoiDung> NguoiDungs { get; set; }

        // Các bảng nghiệp vụ đã có
        public DbSet<SanPham> SanPhams { get; set; }
        public DbSet<DanhMuc> DanhMucs { get; set; }
        public DbSet<ThuongHieu> ThuongHieus { get; set; }
        public DbSet<DonHang> DonHangs { get; set; }
        public DbSet<ChiTietDonHang> ChiTietDonHangs { get; set; }
        public DbSet<DanhGia> DanhGias { get; set; }
    }
}
