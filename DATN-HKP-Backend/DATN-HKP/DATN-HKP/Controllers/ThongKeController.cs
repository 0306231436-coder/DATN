using DATN_HKP.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DATN_HKP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ThongKeController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ThongKeController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/ThongKe/tong-quan
        [HttpGet("tong-quan")]
        public async Task<ActionResult<object>> GetTongQuan()
        {
            var totalRevenue = await _context.DonHangs
                .Where(d => d.TrangThai != "Đã hủy")
                .SumAsync(d => (decimal?)d.TongTien) ?? 0;

            var totalOrders = await _context.DonHangs.CountAsync();
            var pendingOrders = await _context.DonHangs.CountAsync(d => d.TrangThai == "Chờ xác nhận");
            var totalProducts = await _context.SanPhams.CountAsync();
            var totalUsers = await _context.NguoiDungs.CountAsync();

            // Đơn hàng gần đây
            var recentOrders = await _context.DonHangs
                .Include(d => d.ChiTietDonHangs!)
                    .ThenInclude(ct => ct.SanPham)
                .OrderByDescending(d => d.NgayDat)
                .Take(5)
                .Select(d => new
                {
                    d.MaDonHang,
                    d.TenNguoiNhan,
                    d.SoDienThoai,
                    d.NgayDat,
                    d.TongTien,
                    d.TrangThai,
                    d.PhuongThucThanhToan,
                    SoLuongMon = d.ChiTietDonHangs != null ? d.ChiTietDonHangs.Count : 0
                })
                .ToListAsync();

            // Sản phẩm sắp hết hàng (<= 5)
            var lowStockProducts = await _context.SanPhams
                .Where(p => p.SoLuong <= 5)
                .OrderBy(p => p.SoLuong)
                .Take(5)
                .Select(p => new
                {
                    p.MaSanPham,
                    p.TenSanPham,
                    p.Gia,
                    p.SoLuong,
                    p.HinhAnh
                })
                .ToListAsync();

            // Doanh thu 6 tháng gần nhất
            var now = DateTime.Now;
            var monthlyRevenue = new List<object>();
            for (int i = 5; i >= 0; i--)
            {
                var monthDate = now.AddMonths(-i);
                var month = monthDate.Month;
                var year = monthDate.Year;

                var rev = await _context.DonHangs
                    .Where(d => d.NgayDat.Month == month && d.NgayDat.Year == year && d.TrangThai != "Đã hủy")
                    .SumAsync(d => (decimal?)d.TongTien) ?? 0;

                monthlyRevenue.Add(new
                {
                    Thang = $"T{month}/{year}",
                    DoanhThu = rev
                });
            }

            return Ok(new
            {
                tongDoanhThu = totalRevenue,
                tongDonHang = totalOrders,
                donHangChoXuLy = pendingOrders,
                tongSanPham = totalProducts,
                tongKhachHang = totalUsers,
                donHangMoiNhat = recentOrders,
                sanPhamSapHetHang = lowStockProducts,
                doanhThuTheoThang = monthlyRevenue
            });
        }
    }
}
