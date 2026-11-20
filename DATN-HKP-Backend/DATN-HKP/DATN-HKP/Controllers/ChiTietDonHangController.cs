using DATN_HKP.Data;
using DATN_HKP.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DATN_HKP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChiTietDonHangController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChiTietDonHangController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/ChiTietDonHang
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ChiTietDonHang>>> GetChiTietDonHangs([FromQuery] int? maDonHang)
        {
            IQueryable<ChiTietDonHang> query = _context.ChiTietDonHangs
                .Include(c => c.SanPham)
                .Include(c => c.BienThe)
                .AsNoTracking();

            if (maDonHang.HasValue && maDonHang.Value > 0)
            {
                query = query.Where(c => c.MaDonHang == maDonHang.Value);
            }

            return await query.ToListAsync();
        }

        // GET: api/ChiTietDonHang/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<ChiTietDonHang>> GetChiTietDonHang(int id)
        {
            var detail = await _context.ChiTietDonHangs
                .Include(c => c.SanPham)
                .Include(c => c.BienThe)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.MaChiTiet == id);

            if (detail == null)
            {
                return NotFound(new { message = $"Không tìm thấy chi tiết đơn hàng có mã {id}" });
            }

            return Ok(detail);
        }
    }
}
