using DATN_HKP.Data;
using DATN_HKP.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DATN_HKP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DanhMucController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DanhMucController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/DanhMuc
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DanhMuc>>> GetDanhMucs([FromQuery] bool includeProducts = false)
        {
            if (includeProducts)
            {
                return await _context.DanhMucs
                    .Include(d => d.DanhSachSanPham)
                    .AsNoTracking()
                    .ToListAsync();
            }

            return await _context.DanhMucs.AsNoTracking().ToListAsync();
        }

        // GET: api/DanhMuc/5
        [HttpGet("{id}")]
        public async Task<ActionResult<DanhMuc>> GetDanhMuc(int id, [FromQuery] bool includeProducts = true)
        {
            IQueryable<DanhMuc> query = _context.DanhMucs.AsNoTracking();
            if (includeProducts)
            {
                query = query.Include(d => d.DanhSachSanPham);
            }

            var danhMuc = await query.FirstOrDefaultAsync(d => d.MaDanhMuc == id);

            if (danhMuc == null)
            {
                return NotFound(new { message = $"Không tìm thấy danh mục với mã {id}" });
            }

            return danhMuc;
        }

        // POST: api/DanhMuc
        [HttpPost]
        public async Task<ActionResult<DanhMuc>> CreateDanhMuc([FromBody] DanhMuc model)
        {
            if (string.IsNullOrWhiteSpace(model.TenDanhMuc))
            {
                return BadRequest(new { message = "Tên danh mục không được để trống" });
            }

            _context.DanhMucs.Add(model);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDanhMuc), new { id = model.MaDanhMuc }, model);
        }

        // PUT: api/DanhMuc/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateDanhMuc(int id, [FromBody] DanhMuc model)
        {
            var dm = await _context.DanhMucs.FindAsync(id);
            if (dm == null)
            {
                return NotFound(new { message = $"Không tìm thấy danh mục với mã {id}" });
            }

            if (string.IsNullOrWhiteSpace(model.TenDanhMuc))
            {
                return BadRequest(new { message = "Tên danh mục không được để trống" });
            }

            dm.TenDanhMuc = model.TenDanhMuc;
            dm.MoTa = model.MoTa ?? string.Empty;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật danh mục thành công", data = dm });
        }

        // DELETE: api/DanhMuc/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteDanhMuc(int id)
        {
            var dm = await _context.DanhMucs
                .Include(d => d.DanhSachSanPham)
                .FirstOrDefaultAsync(d => d.MaDanhMuc == id);

            if (dm == null)
            {
                return NotFound(new { message = $"Không tìm thấy danh mục với mã {id}" });
            }

            if (dm.DanhSachSanPham != null && dm.DanhSachSanPham.Any())
            {
                return BadRequest(new { message = "Không thể xóa danh mục đang có sản phẩm. Hãy chuyển sản phẩm sang danh mục khác trước." });
            }

            _context.DanhMucs.Remove(dm);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã xóa danh mục {dm.TenDanhMuc} thành công" });
        }
    }
}
