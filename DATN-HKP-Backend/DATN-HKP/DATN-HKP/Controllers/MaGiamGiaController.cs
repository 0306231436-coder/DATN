using DATN_HKP.Data;
using DATN_HKP.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DATN_HKP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MaGiamGiaController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MaGiamGiaController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/MaGiamGia
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MaGiamGia>>> GetMaGiamGias([FromQuery] bool chiHoatDong = false)
        {
            IQueryable<MaGiamGia> query = _context.MaGiamGias.AsNoTracking();

            if (chiHoatDong)
            {
                var now = DateTime.Now;
                query = query.Where(v => v.TrangThai && v.SoLuong > 0 && v.NgayBatDau <= now && v.NgayKetThuc >= now);
            }

            return await query.ToListAsync();
        }

        // GET: api/MaGiamGia/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<MaGiamGia>> GetMaGiamGia(int id)
        {
            var voucher = await _context.MaGiamGias
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.MaVoucher == id);

            if (voucher == null)
            {
                return NotFound(new { message = $"Không tìm thấy mã giảm giá có mã {id}" });
            }

            return Ok(voucher);
        }

        // GET: api/MaGiamGia/code/{code}
        [HttpGet("code/{code}")]
        public async Task<ActionResult<MaGiamGia>> GetByCode(string code)
        {
            var voucher = await _context.MaGiamGias
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.Code.ToLower() == code.Trim().ToLower());

            if (voucher == null)
            {
                return NotFound(new { message = $"Mã giảm giá '{code}' không tồn tại" });
            }

            return Ok(voucher);
        }

        // POST: api/MaGiamGia
        [HttpPost]
        public async Task<ActionResult<MaGiamGia>> CreateMaGiamGia([FromBody] MaGiamGia model)
        {
            if (string.IsNullOrWhiteSpace(model.Code))
            {
                return BadRequest(new { message = "Mã voucher không được để trống" });
            }

            var exists = await _context.MaGiamGias.AnyAsync(v => v.Code.ToLower() == model.Code.Trim().ToLower());
            if (exists)
            {
                return BadRequest(new { message = $"Mã giảm giá '{model.Code}' đã tồn tại" });
            }

            model.Code = model.Code.Trim().ToUpper();
            _context.MaGiamGias.Add(model);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMaGiamGia), new { id = model.MaVoucher }, model);
        }

        // PUT: api/MaGiamGia/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateMaGiamGia(int id, [FromBody] MaGiamGia model)
        {
            var voucher = await _context.MaGiamGias.FindAsync(id);
            if (voucher == null)
            {
                return NotFound(new { message = $"Không tìm thấy mã giảm giá có mã {id}" });
            }

            voucher.Code = string.IsNullOrWhiteSpace(model.Code) ? voucher.Code : model.Code.Trim().ToUpper();
            voucher.SoTienGiam = model.SoTienGiam;
            voucher.GiaTriToiThieu = model.GiaTriToiThieu;
            voucher.SoLuong = model.SoLuong;
            voucher.NgayBatDau = model.NgayBatDau;
            voucher.NgayKetThuc = model.NgayKetThuc;
            voucher.TrangThai = model.TrangThai;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật mã giảm giá thành công", data = voucher });
        }

        // DELETE: api/MaGiamGia/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteMaGiamGia(int id)
        {
            var voucher = await _context.MaGiamGias.FindAsync(id);
            if (voucher == null)
            {
                return NotFound(new { message = $"Không tìm thấy mã giảm giá có mã {id}" });
            }

            _context.MaGiamGias.Remove(voucher);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã xóa mã giảm giá {voucher.Code} thành công" });
        }
    }
}
