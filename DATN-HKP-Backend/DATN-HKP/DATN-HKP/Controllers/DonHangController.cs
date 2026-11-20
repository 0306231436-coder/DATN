using DATN_HKP.Data;
using DATN_HKP.DTOs.DonHang;
using DATN_HKP.Models;
using System.Globalization;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DATN_HKP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DonHangController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DonHangController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/DonHang/thong-ke
        [HttpGet("thong-ke")]
        public async Task<ActionResult<object>> GetThongKe()
        {
            var totalOrders = await _context.DonHangs.CountAsync();
            var totalRevenue = await _context.DonHangs
                .Where(d => d.TrangThai != "Đã hủy")
                .SumAsync(d => (decimal?)d.TongTien) ?? 0;

            var pendingOrders = await _context.DonHangs
                .CountAsync(d => d.TrangThai == "Chờ xác nhận");

            var statusCounts = await _context.DonHangs
                .GroupBy(d => d.TrangThai)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            return Ok(new
            {
                tongDonHang = totalOrders,
                tongDoanhThu = totalRevenue,
                donHangChoXuLy = pendingOrders,
                trangThaiChiTiet = statusCounts
            });
        }

        // GET: api/DonHang
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DonHang>>> GetDonHangs(
            [FromQuery] string? maNguoiDung,
            [FromQuery] string? trangThai)
        {
            IQueryable<DonHang> query = _context.DonHangs
                .Include(d => d.ChiTietDonHangs!)
                    .ThenInclude(ct => ct.SanPham)
                .Include(d => d.ChiTietDonHangs!)
                    .ThenInclude(ct => ct.BienThe)
                .AsNoTracking();

            if (!string.IsNullOrWhiteSpace(maNguoiDung))
            {
                query = query.Where(d => d.MaNguoiDung == maNguoiDung);
            }

            if (!string.IsNullOrWhiteSpace(trangThai))
            {
                query = query.Where(d => d.TrangThai.ToLower() == trangThai.Trim().ToLower());
            }

            return await query.OrderByDescending(d => d.NgayDat).ToListAsync();
        }

        // GET: api/DonHang/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<DonHang>> GetDonHang(int id)
        {
            var donHang = await _context.DonHangs
                .Include(d => d.ChiTietDonHangs!)
                    .ThenInclude(ct => ct.SanPham)
                .Include(d => d.ChiTietDonHangs!)
                    .ThenInclude(ct => ct.BienThe)
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.MaDonHang == id);

            if (donHang == null)
            {
                return NotFound(new { message = $"Không tìm thấy đơn hàng có mã {id}" });
            }

            return Ok(donHang);
        }

        // GET: api/DonHang/user/{maNguoiDung}
        [HttpGet("user/{maNguoiDung}")]
        public async Task<ActionResult<IEnumerable<DonHang>>> GetByUser(string maNguoiDung)
        {
            var orders = await _context.DonHangs
                .Include(d => d.ChiTietDonHangs!)
                    .ThenInclude(ct => ct.SanPham)
                .Include(d => d.ChiTietDonHangs!)
                    .ThenInclude(ct => ct.BienThe)
                .Where(d => d.MaNguoiDung == maNguoiDung)
                .OrderByDescending(d => d.NgayDat)
                .AsNoTracking()
                .ToListAsync();

            return Ok(orders);
        }

        // POST: api/DonHang
        [HttpPost]
        public async Task<ActionResult<DonHang>> CreateDonHang([FromBody] DonHangCreateDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (request.ChiTietDonHangs == null || request.ChiTietDonHangs.Count == 0)
            {
                return BadRequest(new { message = "Đơn hàng phải có ít nhất một sản phẩm." });
            }

            if (request.ChiTietDonHangs.Any(item =>
                item.MaSanPham <= 0 || item.SoLuong <= 0 || item.DonGia < 0
                || (item.MaBienThe.HasValue && item.MaBienThe.Value <= 0)))
            {
                return BadRequest(new { message = "Thông tin sản phẩm hoặc số lượng đặt hàng không hợp lệ." });
            }

            var executionStrategy = _context.Database.CreateExecutionStrategy();
            DonHang? donHang = null;
            string? stockError = null;

            await executionStrategy.ExecuteAsync(async () =>
            {
                _context.ChangeTracker.Clear();
                await using var transaction = await _context.Database.BeginTransactionAsync();

                foreach (var item in request.ChiTietDonHangs
                    .GroupBy(c => new { c.MaSanPham, c.MaBienThe })
                    .Select(group => new
                    {
                        group.Key.MaSanPham,
                        group.Key.MaBienThe,
                        SoLuong = group.Sum(c => c.SoLuong)
                    }))
                {
                    int affectedRows;
                    if (item.MaBienThe.HasValue)
                    {
                        affectedRows = await _context.BienTheSanPhams
                            .Where(variant => variant.MaBienThe == item.MaBienThe.Value
                                && variant.MaSanPham == item.MaSanPham
                                && variant.TrangThai
                                && variant.NgayXoa == null
                                && variant.SoLuongTon >= item.SoLuong)
                            .ExecuteUpdateAsync(setters => setters
                                .SetProperty(variant => variant.SoLuongTon, variant => variant.SoLuongTon - item.SoLuong));
                    }
                    else
                    {
                        affectedRows = await _context.SanPhams
                            .Where(product => product.MaSanPham == item.MaSanPham
                                && product.TrangThai
                                && product.NgayXoa == null
                                && product.SoLuong >= item.SoLuong)
                            .ExecuteUpdateAsync(setters => setters
                                .SetProperty(product => product.SoLuong, product => product.SoLuong - item.SoLuong));
                    }

                    if (affectedRows == 0)
                    {
                        stockError = $"Sản phẩm hoặc biến thể mã {item.MaBienThe ?? item.MaSanPham} không còn đủ hàng.";
                        return;
                    }
                }

                donHang = new DonHang
                {
                    MaNguoiDung = string.IsNullOrWhiteSpace(request.MaNguoiDung) ? "guest" : request.MaNguoiDung,
                    NgayDat = DateTime.Now,
                    TenNguoiNhan = request.TenNguoiNhan,
                    SoDienThoai = request.SoDienThoai,
                    DiaChiGiaoHang = request.DiaChiGiaoHang,
                    TongTien = request.TongTien,
                    TrangThai = "Chờ xác nhận",
                    PhuongThucThanhToan = request.PhuongThucThanhToan ?? "COD",
                    GhiChu = request.GhiChu,
                    ChiTietDonHangs = request.ChiTietDonHangs.Select(c => new ChiTietDonHang
                    {
                        MaSanPham = c.MaSanPham,
                        MaBienThe = c.MaBienThe,
                        SoLuong = c.SoLuong,
                        DonGia = c.DonGia
                    }).ToList()
                };

                if (donHang.TongTien <= 0)
                {
                    donHang.TongTien = request.ChiTietDonHangs.Sum(c => c.SoLuong * c.DonGia);
                }

                _context.DonHangs.Add(donHang);

                if (!donHang.MaNguoiDung.Equals("guest", StringComparison.OrdinalIgnoreCase))
                {
                    var orderedProductIds = request.ChiTietDonHangs.Select(c => c.MaSanPham).Distinct().ToList();
                    var cartItems = await _context.ChiTietGioHangs
                        .Where(cartItem => cartItem.MaNguoiDung == donHang.MaNguoiDung
                            && orderedProductIds.Contains(cartItem.MaSanPham))
                        .ToListAsync();
                    var itemsToRemove = cartItems.Where(cartItem =>
                        request.ChiTietDonHangs.Any(orderedItem =>
                            orderedItem.MaSanPham == cartItem.MaSanPham
                            && orderedItem.MaBienThe == cartItem.MaBienThe)).ToList();

                    if (itemsToRemove.Count > 0)
                    {
                        _context.ChiTietGioHangs.RemoveRange(itemsToRemove);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            });

            if (stockError != null)
            {
                return Conflict(new { message = stockError });
            }

            if (donHang == null)
            {
                throw new InvalidOperationException("Không thể tạo đơn hàng sau khi cập nhật tồn kho.");
            }
            return CreatedAtAction(nameof(GetDonHang), new { id = donHang.MaDonHang }, donHang);
        }

        // PUT: api/DonHang/5/trang-thai
        [HttpPut("{id:int}/trang-thai")]
        public async Task<IActionResult> UpdateTrangThai(int id, [FromBody] UpdateTrangThaiDonHangDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.TrangThai))
            {
                return BadRequest(new { message = "Trạng thái không được để trống" });
            }

            var requestedStage = GetOrderStatusStage(dto.TrangThai);
            if (requestedStage == int.MinValue)
            {
                return BadRequest(new { message = "Trạng thái đơn hàng không hợp lệ." });
            }

            var executionStrategy = _context.Database.CreateExecutionStrategy();
            string? error = null;
            string? resultingStatus = null;
            DonHang? updatedOrder = null;

            await executionStrategy.ExecuteAsync(async () =>
            {
                _context.ChangeTracker.Clear();
                await using var transaction = await _context.Database.BeginTransactionAsync();
                var donHang = await _context.DonHangs
                    .Include(order => order.ChiTietDonHangs)
                    .FirstOrDefaultAsync(order => order.MaDonHang == id);

                if (donHang == null)
                {
                    error = "NOT_FOUND";
                    return;
                }

                var currentStatus = donHang.TrangThai ?? "";
                var currentStage = GetOrderStatusStage(currentStatus);
                if (currentStage == int.MinValue)
                {
                    error = $"Không thể cập nhật đơn hàng đang ở trạng thái \"{currentStatus}\".";
                    return;
                }

                if (requestedStage == currentStage)
                {
                    resultingStatus = currentStatus;
                    updatedOrder = donHang;
                    await transaction.CommitAsync();
                    return;
                }

                if (currentStage < 0 || currentStage == 3
                    || (requestedStage == -1 ? currentStage > 2 : requestedStage != currentStage + 1))
                {
                    error = $"Không thể chuyển đơn hàng từ \"{currentStatus}\" sang \"{dto.TrangThai.Trim()}\".";
                    return;
                }

                var newStatus = requestedStage switch
                {
                    -1 => "Đã hủy",
                    1 => "Đang xử lý",
                    2 => "Đang giao",
                    3 => "Đã giao",
                    _ => throw new InvalidOperationException("Trạng thái đơn hàng không được hỗ trợ.")
                };

                var orderItems = (donHang.ChiTietDonHangs ?? new List<ChiTietDonHang>())
                    .GroupBy(item => new { item.MaSanPham, item.MaBienThe })
                    .Select(group => new
                    {
                        group.Key.MaSanPham,
                        group.Key.MaBienThe,
                        SoLuong = group.Sum(item => item.SoLuong)
                    }).ToList();

                if (requestedStage == -1)
                {
                    foreach (var item in orderItems)
                    {
                        if (item.SoLuong <= 0)
                        {
                            error = "Chi tiết đơn hàng có số lượng không hợp lệ; không thể hoàn kho.";
                            return;
                        }

                        var affectedRows = item.MaBienThe.HasValue
                            ? await _context.BienTheSanPhams
                                .Where(variant => variant.MaBienThe == item.MaBienThe.Value
                                    && variant.MaSanPham == item.MaSanPham)
                                .ExecuteUpdateAsync(setters => setters
                                    .SetProperty(variant => variant.SoLuongTon, variant => variant.SoLuongTon + item.SoLuong))
                            : await _context.SanPhams
                                .Where(product => product.MaSanPham == item.MaSanPham)
                                .ExecuteUpdateAsync(setters => setters
                                    .SetProperty(product => product.SoLuong, product => product.SoLuong + item.SoLuong));

                        if (affectedRows == 0)
                        {
                            error = $"Không tìm thấy sản phẩm mã {item.MaBienThe ?? item.MaSanPham} để hoàn kho.";
                            return;
                        }
                    }
                }
                else if (requestedStage == 3)
                {
                    foreach (var item in orderItems)
                    {
                        var affectedRows = await _context.SanPhams
                            .Where(product => product.MaSanPham == item.MaSanPham)
                            .ExecuteUpdateAsync(setters => setters
                                .SetProperty(product => product.LuotBan, product => product.LuotBan + item.SoLuong));
                        if (affectedRows == 0)
                        {
                            error = $"Không tìm thấy sản phẩm mã {item.MaSanPham} để cập nhật lượt bán.";
                            return;
                        }
                    }
                }

                var statusUpdated = await _context.DonHangs
                    .Where(order => order.MaDonHang == id && order.TrangThai == currentStatus)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(order => order.TrangThai, newStatus));

                if (statusUpdated == 0)
                {
                    error = "Đơn hàng vừa được cập nhật bởi một yêu cầu khác. Hãy tải lại và thử lại.";
                    return;
                }

                donHang.TrangThai = newStatus;
                await transaction.CommitAsync();
                resultingStatus = newStatus;
                updatedOrder = donHang;
            });

            if (error == "NOT_FOUND")
            {
                return NotFound(new { message = $"Không tìm thấy đơn hàng mã {id}" });
            }
            if (error != null)
            {
                return Conflict(new { message = error });
            }

            return Ok(new
            {
                message = "Cập nhật trạng thái thành công",
                trangThai = resultingStatus,
                data = updatedOrder
            });
        }

        // PUT: api/DonHang/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateDonHang(int id, [FromBody] DonHang model)
        {
            var donHang = await _context.DonHangs.FindAsync(id);
            if (donHang == null)
            {
                return NotFound(new { message = $"Không tìm thấy đơn hàng mã {id}" });
            }

            if (!string.Equals(model.TrangThai, donHang.TrangThai, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Vui lòng dùng API cập nhật trạng thái đơn hàng để bảo đảm tồn kho được xử lý đúng." });
            }

            donHang.TenNguoiNhan = model.TenNguoiNhan;
            donHang.SoDienThoai = model.SoDienThoai;
            donHang.DiaChiGiaoHang = model.DiaChiGiaoHang;
            donHang.PhuongThucThanhToan = model.PhuongThucThanhToan;
            donHang.GhiChu = model.GhiChu;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thông tin đơn hàng thành công", data = donHang });
        }

        // DELETE: api/DonHang/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteDonHang(int id)
        {
            var donHang = await _context.DonHangs
                .Include(d => d.ChiTietDonHangs)
                .FirstOrDefaultAsync(d => d.MaDonHang == id);

            if (donHang == null)
            {
                return NotFound(new { message = $"Không tìm thấy đơn hàng mã {id}" });
            }

            var statusStage = GetOrderStatusStage(donHang.TrangThai ?? "");
            if (statusStage != -1 && statusStage != 3)
            {
                return Conflict(new { message = "Hãy hủy đơn hàng trước khi xóa để tồn kho được hoàn đúng." });
            }

            _context.DonHangs.Remove(donHang);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã xóa đơn hàng mã {id} thành công" });
        }

        private static int GetOrderStatusStage(string status)
        {
            var normalized = string.Concat(status.Normalize(NormalizationForm.FormD)
                .Where(character => CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark))
                .Replace('đ', 'd')
                .Replace('Đ', 'd')
                .Trim()
                .ToLowerInvariant();

            if (normalized.Contains("huy") || normalized.Contains("cancel")) return -1;
            if (normalized.Contains("da giao") || normalized.Contains("hoan tat")
                || normalized.Contains("delivered") || normalized.Contains("completed")) return 3;
            if (normalized.Contains("dang giao") || normalized.Contains("van chuyen")
                || normalized.Contains("shipping")) return 2;
            if (normalized.Contains("dang xu ly") || normalized.Contains("da xac nhan")
                || normalized.Contains("processing") || normalized.Contains("confirmed")) return 1;
            if (normalized.Contains("cho xac nhan") || normalized.Contains("pending")) return 0;
            return int.MinValue;
        }
    }
}
