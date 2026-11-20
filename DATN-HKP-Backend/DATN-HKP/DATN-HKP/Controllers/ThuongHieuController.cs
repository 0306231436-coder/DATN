using DATN_HKP.Data;
using DATN_HKP.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DATN_HKP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ThuongHieuController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ThuongHieuController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/ThuongHieu
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ThuongHieu>>> GetThuongHieus([FromQuery] bool includeProducts = false)
        {
            if (includeProducts)
            {
                return await _context.ThuongHieus
                    .Include(t => t.DanhSachSanPham)
                    .AsNoTracking()
                    .ToListAsync();
            }

            return await _context.ThuongHieus.AsNoTracking().ToListAsync();
        }

        // GET: api/ThuongHieu/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ThuongHieu>> GetThuongHieu(int id, [FromQuery] bool includeProducts = true)
        {
            IQueryable<ThuongHieu> query = _context.ThuongHieus.AsNoTracking();
            if (includeProducts)
            {
                query = query.Include(t => t.DanhSachSanPham);
            }

            var thuongHieu = await query.FirstOrDefaultAsync(t => t.MaThuongHieu == id);

            if (thuongHieu == null)
            {
                return NotFound(new { message = $"Không tìm thấy thương hiệu với mã {id}" });
            }

            return thuongHieu;
        }

        // POST: api/ThuongHieu
        [HttpPost]
        public async Task<ActionResult<ThuongHieu>> CreateThuongHieu([FromBody] ThuongHieu model)
        {
            if (string.IsNullOrWhiteSpace(model.TenThuongHieu))
            {
                return BadRequest(new { message = "Tên thương hiệu không được để trống" });
            }

            _context.ThuongHieus.Add(model);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetThuongHieu), new { id = model.MaThuongHieu }, model);
        }

        // PUT: api/ThuongHieu/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateThuongHieu(int id, [FromBody] ThuongHieu model)
        {
            var th = await _context.ThuongHieus.FindAsync(id);
            if (th == null)
            {
                return NotFound(new { message = $"Không tìm thấy thương hiệu với mã {id}" });
            }

            if (string.IsNullOrWhiteSpace(model.TenThuongHieu))
            {
                return BadRequest(new { message = "Tên thương hiệu không được để trống" });
            }

            th.TenThuongHieu = model.TenThuongHieu;
            th.Logo = model.Logo ?? string.Empty;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật thương hiệu thành công", data = th });
        }

        // DELETE: api/ThuongHieu/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteThuongHieu(int id)
        {
            var th = await _context.ThuongHieus
                .Include(t => t.DanhSachSanPham)
                .FirstOrDefaultAsync(t => t.MaThuongHieu == id);

            if (th == null)
            {
                return NotFound(new { message = $"Không tìm thấy thương hiệu với mã {id}" });
            }

            if (th.DanhSachSanPham != null && th.DanhSachSanPham.Any())
            {
                return BadRequest(new { message = "Không thể xóa thương hiệu đang có sản phẩm. Hãy chuyển sản phẩm sang thương hiệu khác trước." });
            }

            _context.ThuongHieus.Remove(th);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã xóa thương hiệu {th.TenThuongHieu} thành công" });
        }
    }
}
