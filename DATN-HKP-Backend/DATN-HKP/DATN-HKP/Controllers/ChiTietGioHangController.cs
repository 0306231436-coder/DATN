using DATN_HKP.Data;
using DATN_HKP.DTOs.GioHang;
using DATN_HKP.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DATN_HKP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChiTietGioHangController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChiTietGioHangController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/ChiTietGioHang
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ChiTietGioHang>>> GetChiTietGioHangs([FromQuery] string? maNguoiDung)
        {
            if (string.IsNullOrWhiteSpace(maNguoiDung) || maNguoiDung.StartsWith("guest", StringComparison.OrdinalIgnoreCase))
            {
                return Ok(new List<ChiTietGioHang>());
            }

            IQueryable<ChiTietGioHang> query = _context.ChiTietGioHangs
                .Include(c => c.SanPham)
                .Include(c => c.BienThe)
                .AsNoTracking();

            query = query.Where(c => c.MaNguoiDung == maNguoiDung);

            return await query.ToListAsync();
        }

        // GET: api/ChiTietGioHang/user/{maNguoiDung}
        [HttpGet("user/{maNguoiDung}")]
        public async Task<ActionResult<IEnumerable<ChiTietGioHang>>> GetByUser(string maNguoiDung)
        {
            if (string.IsNullOrWhiteSpace(maNguoiDung) || maNguoiDung.StartsWith("guest", StringComparison.OrdinalIgnoreCase))
            {
                return Ok(new List<ChiTietGioHang>());
            }

            // Tìm thành viên tương ứng trong bảng NguoiDungs
            NguoiDung? member = null;
            if (int.TryParse(maNguoiDung, out int maNguoiDungInt))
            {
                member = await _context.NguoiDungs.AsNoTracking().FirstOrDefaultAsync(u => u.MaNguoiDung == maNguoiDungInt);
            }
            if (member == null)
            {
                member = await _context.NguoiDungs.AsNoTracking().FirstOrDefaultAsync(u => u.TenDangNhap == maNguoiDung);
            }

            string memberIdStr = member != null ? member.MaNguoiDung.ToString() : maNguoiDung;
            string memberUsername = member != null ? member.TenDangNhap : maNguoiDung;

            var items = await _context.ChiTietGioHangs
                .Include(c => c.SanPham)
                .Include(c => c.BienThe)
                .Where(c => c.MaNguoiDung == memberIdStr || c.MaNguoiDung == memberUsername || c.MaNguoiDung == maNguoiDung)
                .AsNoTracking()
                .ToListAsync();

            return Ok(items);
        }

        // POST: api/ChiTietGioHang (THÊM VÀO GIỎ HÀNG - BẮT BỘC THÀNH VIÊN ĐÃ ĐĂNG NHẬP)
        [HttpPost]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartDto request)
        {
            // Bắt buộc MaNguoiDung phải hợp lệ, không rỗng và không được bắt đầu bằng "guest"
            if (request == null || string.IsNullOrWhiteSpace(request.MaNguoiDung) ||
                request.MaNguoiDung.StartsWith("guest", StringComparison.OrdinalIgnoreCase) ||
                request.MaSanPham <= 0)
            {
                return Unauthorized(new { message = "Vui lòng đăng nhập tài khoản để thực hiện thêm sản phẩm vào giỏ hàng." });
            }

            // Kiểm tra thành viên có tồn tại trong hệ thống (bảng NguoiDungs)
            NguoiDung? member = null;
            if (int.TryParse(request.MaNguoiDung, out int maNguoiDungInt))
            {
                member = await _context.NguoiDungs.FirstOrDefaultAsync(u => u.MaNguoiDung == maNguoiDungInt);
            }

            if (member == null)
            {
                member = await _context.NguoiDungs.FirstOrDefaultAsync(u => u.TenDangNhap == request.MaNguoiDung);
            }

            if (member == null)
            {
                return Unauthorized(new { message = "Tài khoản người dùng không tồn tại. Vui lòng đăng nhập để thực hiện thêm vào giỏ hàng." });
            }

            if (!member.TrangThai)
            {
                return StatusCode(403, new { message = "Tài khoản của bạn đã bị khóa. Không thể thêm sản phẩm vào giỏ hàng." });
            }

            string validUserId = member.MaNguoiDung.ToString();

            int? maBienTheClean = (request.MaBienThe.HasValue && request.MaBienThe.Value > 0)
                ? request.MaBienThe.Value
                : null;

            // 1. Kiểm tra tồn tại của Sản phẩm
            var sanPhamExists = await _context.SanPhams.AnyAsync(s => s.MaSanPham == request.MaSanPham);
            if (!sanPhamExists)
            {
                return BadRequest(new { message = $"Sản phẩm mã {request.MaSanPham} không tồn tại trong hệ thống." });
            }

            // 2. Kiểm tra tồn tại của Biến thể (nếu có)
            if (maBienTheClean.HasValue)
            {
                var bienTheExists = await _context.BienTheSanPhams.AnyAsync(b => b.MaBienThe == maBienTheClean.Value);
                if (!bienTheExists)
                {
                    return BadRequest(new { message = $"Biến thể mã {maBienTheClean.Value} không tồn tại trong hệ thống." });
                }
            }

            // 3. Tìm sản phẩm đã có trong giỏ hàng riêng của MaNguoiDung này (hỗ trợ cả id lẫn username)
            var existingItem = await _context.ChiTietGioHangs
                .FirstOrDefaultAsync(c => (c.MaNguoiDung == validUserId || c.MaNguoiDung == member.TenDangNhap)
                                       && c.MaSanPham == request.MaSanPham
                                       && c.MaBienThe == maBienTheClean);

            int quantityToAdd = request.SoLuong > 0 ? request.SoLuong : 1;

            if (existingItem != null)
            {
                existingItem.MaNguoiDung = validUserId;
                // Cộng dồn số lượng vào sản phẩm đã có
                existingItem.SoLuong += quantityToAdd;
            }
            else
            {
                // Tạo mới sản phẩm gắn với MaNguoiDung duy nhất của thành viên
                var newItem = new ChiTietGioHang
                {
                    MaNguoiDung = validUserId,
                    MaSanPham = request.MaSanPham,
                    MaBienThe = maBienTheClean,
                    SoLuong = quantityToAdd
                };
                _context.ChiTietGioHangs.Add(newItem);
            }

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Cập nhật giỏ hàng thành công." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Lỗi CSDL khi lưu giỏ hàng.",
                    detail = ex.GetBaseException().Message
                });
            }
        }

        // PUT: api/ChiTietGioHang/5 (CẬP NHẬT SỐ LƯỢNG)
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateQuantity(int id, [FromBody] UpdateQuantityDto request)
        {
            if (request == null || request.SoLuong <= 0)
            {
                return BadRequest(new { message = "Số lượng phải lớn hơn 0." });
            }

            var item = await _context.ChiTietGioHangs.FindAsync(id);
            if (item == null)
            {
                return NotFound(new { message = $"Không tìm thấy chi tiết giỏ hàng mã {id}" });
            }

            item.SoLuong = request.SoLuong;

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Cập nhật số lượng thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Lỗi CSDL khi cập nhật số lượng.",
                    detail = ex.GetBaseException().Message
                });
            }
        }

        // DELETE: api/ChiTietGioHang/5 (XÓA SẢN PHẨM KHỎI GIỎ)
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteCartItem(int id)
        {
            var item = await _context.ChiTietGioHangs.FindAsync(id);
            if (item == null)
            {
                return NotFound(new { message = $"Không tìm thấy chi tiết giỏ hàng mã {id}" });
            }

            _context.ChiTietGioHangs.Remove(item);

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Xóa khỏi giỏ hàng thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Lỗi CSDL khi xóa sản phẩm.",
                    detail = ex.GetBaseException().Message
                });
            }
        }

        // DELETE: api/ChiTietGioHang/user/{maNguoiDung} (XÓA SẠCH GIỎ HÀNG CỦA USER)
        [HttpDelete("user/{maNguoiDung}")]
        public async Task<IActionResult> ClearCart(string maNguoiDung)
        {
            if (string.IsNullOrWhiteSpace(maNguoiDung) || maNguoiDung.StartsWith("guest", StringComparison.OrdinalIgnoreCase))
            {
                return Ok(new { message = "Giỏ hàng đã trống." });
            }

            NguoiDung? member = null;
            if (int.TryParse(maNguoiDung, out int maNguoiDungInt))
            {
                member = await _context.NguoiDungs.AsNoTracking().FirstOrDefaultAsync(u => u.MaNguoiDung == maNguoiDungInt);
            }
            if (member == null)
            {
                member = await _context.NguoiDungs.AsNoTracking().FirstOrDefaultAsync(u => u.TenDangNhap == maNguoiDung);
            }

            string memberIdStr = member != null ? member.MaNguoiDung.ToString() : maNguoiDung;
            string memberUsername = member != null ? member.TenDangNhap : maNguoiDung;

            var items = await _context.ChiTietGioHangs
                .Where(c => c.MaNguoiDung == memberIdStr || c.MaNguoiDung == memberUsername || c.MaNguoiDung == maNguoiDung)
                .ToListAsync();

            if (!items.Any())
            {
                return Ok(new { message = "Giỏ hàng đã trống." });
            }

            _context.ChiTietGioHangs.RemoveRange(items);

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Đã dọn dẹp sạch giỏ hàng." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Lỗi CSDL khi dọn giỏ hàng.",
                    detail = ex.GetBaseException().Message
                });
            }
        }
    }
}
