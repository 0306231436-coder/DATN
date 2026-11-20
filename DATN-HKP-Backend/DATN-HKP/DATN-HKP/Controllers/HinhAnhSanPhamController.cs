using DATN_HKP.Data;
using DATN_HKP.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DATN_HKP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HinhAnhSanPhamController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public HinhAnhSanPhamController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/HinhAnhSanPham
        [HttpGet]
        public async Task<ActionResult<IEnumerable<HinhAnhSanPham>>> GetHinhAnhSanPhams([FromQuery] int? maSanPham)
        {
            IQueryable<HinhAnhSanPham> query = _context.HinhAnhSanPhams.AsNoTracking();

            if (maSanPham.HasValue && maSanPham.Value > 0)
            {
                query = query.Where(h => h.MaSanPham == maSanPham.Value);
            }

            return await query.OrderBy(h => h.ThuTuHienThi).ToListAsync();
        }

        // GET: api/HinhAnhSanPham/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<HinhAnhSanPham>> GetHinhAnhSanPham(int id)
        {
            var hinhAnh = await _context.HinhAnhSanPhams
                .AsNoTracking()
                .FirstOrDefaultAsync(h => h.MaHinhAnh == id);

            if (hinhAnh == null)
            {
                return NotFound(new { message = $"Không tìm thấy hình ảnh có mã {id}" });
            }

            return Ok(hinhAnh);
        }

        // POST: api/HinhAnhSanPham
        [HttpPost]
        public async Task<ActionResult<HinhAnhSanPham>> CreateHinhAnh([FromBody] HinhAnhSanPham hinhAnh)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var spExists = await _context.SanPhams.AnyAsync(s => s.MaSanPham == hinhAnh.MaSanPham);
            if (!spExists)
            {
                return BadRequest(new { message = $"Sản phẩm mã {hinhAnh.MaSanPham} không tồn tại" });
            }

            _context.HinhAnhSanPhams.Add(hinhAnh);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetHinhAnhSanPham), new { id = hinhAnh.MaHinhAnh }, hinhAnh);
        }

        // PUT: api/HinhAnhSanPham/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateHinhAnh(int id, [FromBody] HinhAnhSanPham request)
        {
            var hinhAnh = await _context.HinhAnhSanPhams.FindAsync(id);
            if (hinhAnh == null)
            {
                return NotFound(new { message = $"Không tìm thấy ảnh mã {id}" });
            }

            hinhAnh.DuongDanAnh = request.DuongDanAnh;
            hinhAnh.LaAnhChinh = request.LaAnhChinh;
            hinhAnh.ThuTuHienThi = request.ThuTuHienThi;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật hình ảnh thành công", data = hinhAnh });
        }

        // DELETE: api/HinhAnhSanPham/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteHinhAnh(int id)
        {
            var hinhAnh = await _context.HinhAnhSanPhams.FindAsync(id);
            if (hinhAnh == null)
            {
                return NotFound(new { message = $"Không tìm thấy ảnh mã {id}" });
            }

            _context.HinhAnhSanPhams.Remove(hinhAnh);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa hình ảnh thành công" });
        }
    }
}