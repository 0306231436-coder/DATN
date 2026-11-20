using DATN_HKP.Data;
using DATN_HKP.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DATN_HKP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DiaChiNguoiDungController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DiaChiNguoiDungController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/DiaChiNguoiDung?maNguoiDung=1
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DiaChiNguoiDung>>> GetDiaChiNguoiDungs([FromQuery] int? maNguoiDung)
        {
            IQueryable<DiaChiNguoiDung> query = _context.DiaChiNguoiDungs.AsNoTracking();

            if (maNguoiDung.HasValue)
            {
                query = query.Where(d => d.MaNguoiDung == maNguoiDung.Value);
            }

            var list = await query
                .OrderByDescending(d => d.LaMacDinh)
                .ThenByDescending(d => d.MaDiaChi)
                .ToListAsync();

            return Ok(list);
        }

        // GET: api/DiaChiNguoiDung/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<DiaChiNguoiDung>> GetDiaChiNguoiDung(int id)
        {
            var diaChi = await _context.DiaChiNguoiDungs
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.MaDiaChi == id);

            if (diaChi == null)
            {
                return NotFound(new { message = $"Không tìm thấy địa chỉ có mã {id}" });
            }

            return Ok(diaChi);
        }

        // GET: api/DiaChiNguoiDung/user/1
        [HttpGet("user/{maNguoiDung:int}")]
        public async Task<ActionResult<IEnumerable<DiaChiNguoiDung>>> GetByUser(int maNguoiDung)
        {
            var addresses = await _context.DiaChiNguoiDungs
                .Where(d => d.MaNguoiDung == maNguoiDung)
                .AsNoTracking()
                .OrderByDescending(d => d.LaMacDinh)
                .ThenByDescending(d => d.MaDiaChi)
                .ToListAsync();

            return Ok(addresses);
        }

        // POST: api/DiaChiNguoiDung
        [HttpPost]
        public async Task<ActionResult<DiaChiNguoiDung>> CreateDiaChiNguoiDung([FromBody] DiaChiNguoiDung model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Kiểm tra user tồn tại
            var userExists = await _context.NguoiDungs.AnyAsync(u => u.MaNguoiDung == model.MaNguoiDung);
            if (!userExists)
            {
                return BadRequest(new { message = "Người dùng không hợp lệ" });
            }

            // Nếu đây là địa chỉ đầu tiên của user → tự động set mặc định
            var hasAnyAddress = await _context.DiaChiNguoiDungs
                .AnyAsync(d => d.MaNguoiDung == model.MaNguoiDung);

            if (!hasAnyAddress)
            {
                model.LaMacDinh = true;
            }
            else if (model.LaMacDinh)
            {
                // Nếu user muốn set mặc định → bỏ mặc định của các địa chỉ khác
                await UnsetDefaultAddresses(model.MaNguoiDung);
            }

            model.MaDiaChi = 0;
            _context.DiaChiNguoiDungs.Add(model);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDiaChiNguoiDung), new { id = model.MaDiaChi }, model);
        }

        // PUT: api/DiaChiNguoiDung/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateDiaChiNguoiDung(int id, [FromBody] DiaChiNguoiDung model)
        {
            if (id != model.MaDiaChi)
            {
                return BadRequest(new { message = "Mã địa chỉ không khớp" });
            }

            var existing = await _context.DiaChiNguoiDungs.FindAsync(id);
            if (existing == null)
            {
                return NotFound(new { message = $"Không tìm thấy địa chỉ có mã {id}" });
            }

            // Không cho phép đổi chủ sở hữu địa chỉ
            if (existing.MaNguoiDung != model.MaNguoiDung)
            {
                return BadRequest(new { message = "Không được thay đổi chủ sở hữu địa chỉ" });
            }

            existing.TenNguoiNhan = model.TenNguoiNhan.Trim();
            existing.SoDienThoai = model.SoDienThoai.Trim();
            existing.DiaChiChiTiet = model.DiaChiChiTiet.Trim();

            // Xử lý mặc định
            if (model.LaMacDinh && !existing.LaMacDinh)
            {
                await UnsetDefaultAddresses(existing.MaNguoiDung);
                existing.LaMacDinh = true;
            }
            else if (!model.LaMacDinh && existing.LaMacDinh)
            {
                // Không cho bỏ mặc định nếu đây là địa chỉ mặc định duy nhất
                // (có thể cho phép, nhưng tốt nhất giữ ít nhất 1 mặc định)
                existing.LaMacDinh = false;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật địa chỉ thành công", data = existing });
        }

        // PUT: api/DiaChiNguoiDung/5/set-default
        [HttpPut("{id:int}/set-default")]
        public async Task<IActionResult> SetDefault(int id)
        {
            var address = await _context.DiaChiNguoiDungs.FindAsync(id);
            if (address == null)
            {
                return NotFound(new { message = $"Không tìm thấy địa chỉ có mã {id}" });
            }

            // Bỏ mặc định tất cả địa chỉ khác của user
            await UnsetDefaultAddresses(address.MaNguoiDung);

            address.LaMacDinh = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã đặt làm địa chỉ mặc định", data = address });
        }

        // DELETE: api/DiaChiNguoiDung/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteDiaChiNguoiDung(int id)
        {
            var address = await _context.DiaChiNguoiDungs.FindAsync(id);
            if (address == null)
            {
                return NotFound(new { message = $"Không tìm thấy địa chỉ có mã {id}" });
            }

            var wasDefault = address.LaMacDinh;
            var userId = address.MaNguoiDung;

            _context.DiaChiNguoiDungs.Remove(address);
            await _context.SaveChangesAsync();

            // Nếu xóa địa chỉ mặc định → tự động chọn 1 địa chỉ còn lại làm mặc định
            if (wasDefault)
            {
                var nextDefault = await _context.DiaChiNguoiDungs
                    .Where(d => d.MaNguoiDung == userId)
                    .OrderByDescending(d => d.MaDiaChi)
                    .FirstOrDefaultAsync();

                if (nextDefault != null)
                {
                    nextDefault.LaMacDinh = true;
                    await _context.SaveChangesAsync();
                }
            }

            return Ok(new { message = "Đã xóa địa chỉ thành công" });
        }

        // Helper: bỏ mặc định tất cả địa chỉ của 1 user
        private async Task UnsetDefaultAddresses(int maNguoiDung)
        {
            var defaults = await _context.DiaChiNguoiDungs
                .Where(d => d.MaNguoiDung == maNguoiDung && d.LaMacDinh)
                .ToListAsync();

            foreach (var item in defaults)
            {
                item.LaMacDinh = false;
            }
        }
    }
}