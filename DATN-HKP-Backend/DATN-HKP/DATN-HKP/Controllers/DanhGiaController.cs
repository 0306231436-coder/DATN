using DATN_HKP.Data;
using DATN_HKP.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DATN_HKP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DanhGiaController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DanhGiaController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/DanhGia
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DanhGia>>> GetDanhGias(
            [FromQuery] int? maSanPham,
            [FromQuery] int? soSao)
        {
            IQueryable<DanhGia> query = _context.DanhGias
                .Include(d => d.SanPham)
                .AsNoTracking();

            if (maSanPham.HasValue && maSanPham.Value > 0)
            {
                query = query.Where(d => d.MaSanPham == maSanPham.Value);
            }

            if (soSao.HasValue && soSao.Value >= 1 && soSao.Value <= 5)
            {
                query = query.Where(d => d.SoSao == soSao.Value);
            }

            return await query.OrderByDescending(d => d.NgayDanhGia).ToListAsync();
        }

        // GET: api/DanhGia/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<DanhGia>> GetDanhGia(int id)
        {
            var review = await _context.DanhGias
                .Include(d => d.SanPham)
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.MaDanhGia == id);

            if (review == null)
            {
                return NotFound(new { message = $"Không tìm thấy đánh giá có mã {id}" });
            }

            return Ok(review);
        }

        // GET: api/DanhGia/sanpham/{maSanPham}
        [HttpGet("sanpham/{maSanPham:int}")]
        public async Task<ActionResult<IEnumerable<DanhGia>>> GetBySanPham(int maSanPham)
        {
            var reviews = await _context.DanhGias
                .Where(d => d.MaSanPham == maSanPham)
                .OrderByDescending(d => d.NgayDanhGia)
                .AsNoTracking()
                .ToListAsync();

            return Ok(reviews);
        }

        // POST: api/DanhGia
        [HttpPost]
        public async Task<ActionResult<DanhGia>> CreateDanhGia([FromBody] DanhGia model)
        {
            if (model.SoSao < 1 || model.SoSao > 5)
            {
                return BadRequest(new { message = "Số sao phải từ 1 đến 5" });
            }

            var spExists = await _context.SanPhams.AnyAsync(p => p.MaSanPham == model.MaSanPham);
            if (!spExists)
            {
                return BadRequest(new { message = $"Sản phẩm mã {model.MaSanPham} không tồn tại" });
            }

            model.NgayDanhGia = DateTime.Now;
            _context.DanhGias.Add(model);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDanhGia), new { id = model.MaDanhGia }, model);
        }

        // DELETE: api/DanhGia/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteDanhGia(int id)
        {
            var review = await _context.DanhGias.FindAsync(id);
            if (review == null)
            {
                return NotFound(new { message = $"Không tìm thấy đánh giá có mã {id}" });
            }

            _context.DanhGias.Remove(review);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã xóa đánh giá mã {id} thành công" });
        }
    }
}
