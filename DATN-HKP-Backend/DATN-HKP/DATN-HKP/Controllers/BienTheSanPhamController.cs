using DATN_HKP.Data;
using DATN_HKP.DTOs.SanPham;
using DATN_HKP.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DATN_HKP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BienTheSanPhamController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BienTheSanPhamController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/BienTheSanPham
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BienTheDto>>> GetBienTheSanPhams([FromQuery] int? maSanPham, [FromQuery] bool includeInactive = false)
        {
            var query = _context.BienTheSanPhams.AsNoTracking();

            if (!includeInactive)
            {
                query = query.Where(b => b.TrangThai && b.NgayXoa == null);
            }

            if (maSanPham.HasValue && maSanPham.Value > 0)
            {
                query = query.Where(b => b.MaSanPham == maSanPham.Value);
            }

            var result = await query
                .Select(b => new BienTheDto
                {
                    MaBienThe = b.MaBienThe,
                    MaSanPham = b.MaSanPham,
                    TenBienThe = b.TenBienThe,
                    SKU = b.SKU,
                    Gia = b.Gia,
                    GiaKhuyenMai = b.GiaKhuyenMai,
                    SoLuongTon = b.SoLuongTon,
                    HinhAnh = b.HinhAnh
                })
                .ToListAsync();

            return Ok(result);
        }

        // GET: api/BienTheSanPham/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<BienTheDto>> GetBienTheSanPham(int id)
        {
            var bienThe = await _context.BienTheSanPhams
                .AsNoTracking()
                .Where(b => b.MaBienThe == id && b.TrangThai && b.NgayXoa == null)
                .Select(b => new BienTheDto
                {
                    MaBienThe = b.MaBienThe,
                    MaSanPham = b.MaSanPham,
                    TenBienThe = b.TenBienThe,
                    SKU = b.SKU,
                    Gia = b.Gia,
                    GiaKhuyenMai = b.GiaKhuyenMai,
                    SoLuongTon = b.SoLuongTon,
                    HinhAnh = b.HinhAnh
                })
                .FirstOrDefaultAsync();

            if (bienThe == null)
            {
                return NotFound(new { message = $"Không tìm thấy biến thể sản phẩm có mã {id}" });
            }

            return Ok(bienThe);
        }

        // POST: api/BienTheSanPham
        [HttpPost]
        public async Task<ActionResult<BienTheDto>> CreateBienThe([FromBody] BienTheCreateDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var sp = await _context.SanPhams.FindAsync(request.MaSanPham);
            if (sp == null)
            {
                return BadRequest(new { message = $"Sản phẩm chính mã {request.MaSanPham} không tồn tại" });
            }

            var bienThe = new BienTheSanPham
            {
                MaSanPham = request.MaSanPham,
                TenBienThe = request.TenBienThe, // Ví dụ: "16GB RAM / 512GB SSD + 1TB HDD - Xám"
                SKU = string.IsNullOrWhiteSpace(request.SKU) ? $"SKU-{Guid.NewGuid().ToString()[..8].ToUpper()}" : request.SKU,
                Gia = request.Gia > 0 ? request.Gia : sp.Gia,
                GiaKhuyenMai = request.GiaKhuyenMai,
                SoLuongTon = request.SoLuongTon,
                HinhAnh = !string.IsNullOrWhiteSpace(request.HinhAnh) ? request.HinhAnh : sp.HinhAnh,
                TrangThai = true,
                NgayXoa = null
            };

            _context.BienTheSanPhams.Add(bienThe);
            await _context.SaveChangesAsync();

            var resultDto = new BienTheDto
            {
                MaBienThe = bienThe.MaBienThe,
                MaSanPham = bienThe.MaSanPham,
                TenBienThe = bienThe.TenBienThe,
                SKU = bienThe.SKU,
                Gia = bienThe.Gia,
                GiaKhuyenMai = bienThe.GiaKhuyenMai,
                SoLuongTon = bienThe.SoLuongTon,
                HinhAnh = bienThe.HinhAnh
            };

            return CreatedAtAction(nameof(GetBienTheSanPham), new { id = bienThe.MaBienThe }, resultDto);
        }

        // PUT: api/BienTheSanPham/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateBienThe(int id, [FromBody] BienTheCreateDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var bienThe = await _context.BienTheSanPhams.FindAsync(id);
            if (bienThe == null)
            {
                return NotFound(new { message = $"Không tìm thấy biến thể có mã {id}" });
            }

            bienThe.TenBienThe = request.TenBienThe;
            bienThe.SKU = request.SKU ?? bienThe.SKU;
            bienThe.Gia = request.Gia;
            bienThe.GiaKhuyenMai = request.GiaKhuyenMai;
            bienThe.SoLuongTon = request.SoLuongTon;
            bienThe.HinhAnh = request.HinhAnh ?? bienThe.HinhAnh;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật biến thể sản phẩm thành công", data = bienThe });
        }

        // DELETE: api/BienTheSanPham/5 (Xóa mềm)
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> SoftDeleteBienThe(int id)
        {
            var bienThe = await _context.BienTheSanPhams.FindAsync(id);
            if (bienThe == null)
            {
                return NotFound(new { message = $"Không tìm thấy biến thể có mã {id}" });
            }

            bienThe.TrangThai = false;
            bienThe.NgayXoa = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Đã xóa mềm biến thể mã {id}", ngayXoa = bienThe.NgayXoa });
        }

        // PUT: api/BienTheSanPham/5/restore (Khôi phục)
        [HttpPut("{id:int}/restore")]
        public async Task<IActionResult> RestoreBienThe(int id)
        {
            var bienThe = await _context.BienTheSanPhams.FindAsync(id);
            if (bienThe == null)
            {
                return NotFound(new { message = $"Không tìm thấy biến thể có mã {id}" });
            }

            bienThe.TrangThai = true;
            bienThe.NgayXoa = null;

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Đã khôi phục biến thể mã {id}", data = bienThe });
        }
    }
}