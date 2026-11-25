using DATN_HKP.Data;
using DATN_HKP.DTOs.DonHang;
using DATN_HKP.Models;
using System.Globalization;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace DATN_HKP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DonHangController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public DonHangController(ApplicationDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
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
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Admin")]
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

        // GET: api/DonHang/ma/DH202611210001
        [HttpGet("ma/{maHienThi}")]
        [AllowAnonymous]
        public async Task<ActionResult<DonHang>> GetDonHangByMaHienThi(string maHienThi)
        {
            if (string.IsNullOrWhiteSpace(maHienThi))
            {
                return BadRequest(new { message = "Mã đơn hàng không được để trống." });
            }

            var normalizedCode = maHienThi.Trim().ToUpper();
            var donHang = await _context.DonHangs
                .Include(d => d.ChiTietDonHangs!)
                    .ThenInclude(ct => ct.SanPham)
                .Include(d => d.ChiTietDonHangs!)
                    .ThenInclude(ct => ct.BienThe)
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.MaDonHangHienThi == normalizedCode);

            if (donHang == null)
            {
                return NotFound(new { message = $"Không tìm thấy đơn hàng có mã {normalizedCode}" });
            }

            return Ok(donHang);
        }

        // GET: api/DonHang/user/{maNguoiDung}
        [HttpGet("user/{maNguoiDung}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<DonHang>>> GetByUser(string maNguoiDung)
        {
            if (!User.IsInRole("Admin"))
            {
                var subject = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!string.Equals(subject, maNguoiDung, StringComparison.Ordinal))
                {
                    return Forbid();
                }
            }

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

            var requestedUserId = request.MaNguoiDung?.Trim();
            if (!string.IsNullOrWhiteSpace(requestedUserId)
                && !requestedUserId.Equals("guest", StringComparison.OrdinalIgnoreCase)
                && User?.Identity?.IsAuthenticated == true)
            {
                var subject = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!string.Equals(subject, requestedUserId, StringComparison.Ordinal))
                {
                    return Forbid();
                }
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
                decimal serverTotal = 0;
                var serverOrderItems = new List<ChiTietDonHang>();

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

                    decimal unitPrice;
                    if (item.MaBienThe.HasValue)
                    {
                        var variant = await _context.BienTheSanPhams
                            .AsNoTracking()
                            .FirstAsync(v => v.MaBienThe == item.MaBienThe.Value);
                        unitPrice = variant.GiaKhuyenMai.HasValue && variant.GiaKhuyenMai.Value > 0
                            ? variant.GiaKhuyenMai.Value
                            : variant.Gia;
                    }
                    else
                    {
                        unitPrice = await _context.SanPhams
                            .AsNoTracking()
                            .Where(p => p.MaSanPham == item.MaSanPham)
                            .Select(p => p.Gia)
                            .FirstAsync();
                    }

                    serverTotal += unitPrice * item.SoLuong;
                    serverOrderItems.Add(new ChiTietDonHang
                    {
                        MaSanPham = item.MaSanPham,
                        MaBienThe = item.MaBienThe,
                        SoLuong = item.SoLuong,
                        DonGia = unitPrice
                    });
                }

                // Sinh mã hiển thị dạng: DH + yyyyMMdd + số tăng dần theo ngày (VD: DH202611210001)
                var now = DateTime.Now;
                var prefix = $"DH{now:yyyyMMdd}";

                var lastOrderCode = await _context.DonHangs
                    .Where(d => d.MaDonHangHienThi.StartsWith(prefix))
                    .OrderByDescending(d => d.MaDonHangHienThi.Length)
                    .ThenByDescending(d => d.MaDonHangHienThi)
                    .Select(d => d.MaDonHangHienThi)
                    .FirstOrDefaultAsync();

                int nextNumber = 1;
                if (!string.IsNullOrEmpty(lastOrderCode) && lastOrderCode.Length > prefix.Length)
                {
                    if (int.TryParse(lastOrderCode.Substring(prefix.Length), out int lastNumber))
                    {
                        nextNumber = lastNumber + 1;
                    }
                }

                var maDonHangHienThi = $"{prefix}{nextNumber:D4}";

                donHang = new DonHang
                {
                    MaDonHangHienThi = maDonHangHienThi,
                    MaNguoiDung = string.IsNullOrWhiteSpace(request.MaNguoiDung) ? "guest" : request.MaNguoiDung,
                    NgayDat = now,
                    TenNguoiNhan = request.TenNguoiNhan,
                    SoDienThoai = request.SoDienThoai,
                    DiaChiGiaoHang = request.DiaChiGiaoHang,
                    TongTien = serverTotal,
                    TrangThai = "Chờ xác nhận",
                    PhuongThucThanhToan = request.PhuongThucThanhToan ?? "COD",
                    TrangThaiThanhToan = string.Equals(request.PhuongThucThanhToan, "Chuyển khoản ngân hàng", StringComparison.OrdinalIgnoreCase)
                        ? "Chưa thanh toán"
                        : "Chưa thanh toán",
                    GhiChu = request.GhiChu,
                    ChiTietDonHangs = serverOrderItems
                };

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

        // POST: api/DonHang/5/thong-bao-thanh-toan
        [HttpPost("{id:int}/thong-bao-thanh-toan")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> ThongBaoThanhToan(int id, IFormFile file)
        {
            var donHang = await _context.DonHangs.FirstOrDefaultAsync(order => order.MaDonHang == id);
            if (donHang == null)
            {
                return NotFound(new { message = $"Không tìm thấy đơn hàng mã {id}" });
            }

            if (!donHang.MaNguoiDung.Equals("guest", StringComparison.OrdinalIgnoreCase)
                && (User?.Identity?.IsAuthenticated != true
                    || !string.Equals(User.FindFirstValue(ClaimTypes.NameIdentifier), donHang.MaNguoiDung, StringComparison.Ordinal)))
            {
                return Forbid();
            }

            if (!string.Equals(donHang.PhuongThucThanhToan, "Chuyển khoản ngân hàng", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Chỉ đơn hàng thanh toán chuyển khoản mới cần tải ảnh xác nhận." });
            }

            if (donHang.TrangThai != "Chờ xác nhận")
            {
                return Conflict(new { message = "Chỉ có thể tải lại ảnh khi đơn hàng vẫn chờ xác nhận." });
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Vui lòng chọn ảnh xác nhận thanh toán." });
            }
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { message = "Ảnh xác nhận thanh toán không được vượt quá 5 MB." });
            }

            var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                ".jpg", ".jpeg", ".png", ".webp"
            };
            var extension = Path.GetExtension(file.FileName);
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP." });
            }

            using var imageStream = file.OpenReadStream();
            var signature = new byte[12];
            var bytesRead = await imageStream.ReadAsync(signature.AsMemory(0, signature.Length));
            if (!IsValidPaymentImage(signature, bytesRead, extension))
            {
                return BadRequest(new { message = "Nội dung file không phải ảnh JPG, PNG hoặc WebP hợp lệ." });
            }

            imageStream.Position = 0;
            var uploadFolder = Path.Combine(_environment.ContentRootPath, "storage", "payment-proofs");
            Directory.CreateDirectory(uploadFolder);
            var fileName = $"order-{id}-{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
            var filePath = Path.Combine(uploadFolder, fileName);
            await using (var output = new FileStream(filePath, FileMode.CreateNew, FileAccess.Write))
            {
                await imageStream.CopyToAsync(output);
            }

            if (!string.IsNullOrWhiteSpace(donHang.HinhAnhThanhToan))
            {
                DeletePaymentProof(donHang.HinhAnhThanhToan);
            }

            var now = DateTime.Now;
            donHang.HinhAnhThanhToan = $"/payment-proofs/{fileName}";
            donHang.NgayThongBaoThanhToan = now;
            donHang.TrangThaiThanhToan = "Chờ xác nhận thanh toán";
            donHang.LyDoTuChoiThanhToan = null;

            _context.LogThanhToans.Add(new LogThanhToan
            {
                MaDonHang = id,
                HanhDong = "Khách thông báo thanh toán",
                NguoiThucHien = User?.Identity?.Name ?? donHang.MaNguoiDung,
                ThoiDiem = now
            });
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đã tải ảnh xác nhận. Đơn hàng đang chờ Admin xác nhận thanh toán.",
                trangThaiThanhToan = donHang.TrangThaiThanhToan,
                ngayThongBaoThanhToan = donHang.NgayThongBaoThanhToan
            });
        }

        // PUT: api/DonHang/5/xac-nhan-thanh-toan
        [HttpPut("{id:int}/xac-nhan-thanh-toan")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> XacNhanThanhToan(int id)
        {
            var donHang = await _context.DonHangs.FirstOrDefaultAsync(order => order.MaDonHang == id);
            if (donHang == null)
            {
                return NotFound(new { message = $"Không tìm thấy đơn hàng mã {id}" });
            }
            if (string.IsNullOrWhiteSpace(donHang.HinhAnhThanhToan)
                || donHang.TrangThaiThanhToan != "Chờ xác nhận thanh toán")
            {
                return Conflict(new { message = "Đơn hàng chưa có ảnh thanh toán chờ xác nhận." });
            }

            var now = DateTime.Now;
            var actor = User?.Identity?.Name ?? "Admin";
            donHang.TrangThaiThanhToan = "Đã thanh toán";
            donHang.NgayXacNhanThanhToan = now;
            donHang.NguoiXacNhanThanhToan = actor;
            donHang.LyDoTuChoiThanhToan = null;
            if (donHang.TrangThai == "Chờ xác nhận")
            {
                donHang.TrangThai = "Đang xử lý";
            }

            _context.LogThanhToans.Add(new LogThanhToan
            {
                MaDonHang = id,
                HanhDong = "Xác nhận thanh toán",
                NguoiThucHien = actor,
                ThoiDiem = now
            });
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đã xác nhận thanh toán.",
                trangThaiThanhToan = donHang.TrangThaiThanhToan,
                trangThaiDonHang = donHang.TrangThai
            });
        }

        // PUT: api/DonHang/5/tu-choi-thanh-toan
        [HttpPut("{id:int}/tu-choi-thanh-toan")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> TuChoiThanhToan(int id, [FromBody] TuChoiThanhToanDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var donHang = await _context.DonHangs.FirstOrDefaultAsync(order => order.MaDonHang == id);
            if (donHang == null)
            {
                return NotFound(new { message = $"Không tìm thấy đơn hàng mã {id}" });
            }
            if (string.IsNullOrWhiteSpace(donHang.HinhAnhThanhToan)
                || donHang.TrangThaiThanhToan != "Chờ xác nhận thanh toán")
            {
                return Conflict(new { message = "Đơn hàng không có thanh toán đang chờ xác nhận." });
            }

            var now = DateTime.Now;
            var actor = User?.Identity?.Name ?? "Admin";
            var reason = dto.LyDo.Trim();
            donHang.TrangThaiThanhToan = "Thanh toán bị từ chối";
            donHang.LyDoTuChoiThanhToan = reason;
            donHang.NgayXacNhanThanhToan = now;
            donHang.NguoiXacNhanThanhToan = actor;

            _context.LogThanhToans.Add(new LogThanhToan
            {
                MaDonHang = id,
                HanhDong = "Từ chối thanh toán",
                NguoiThucHien = actor,
                LyDo = reason,
                ThoiDiem = now
            });
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đã từ chối thanh toán.",
                trangThaiThanhToan = donHang.TrangThaiThanhToan,
                lyDoTuChoiThanhToan = reason
            });
        }

        // GET: api/DonHang/5/hinh-thanh-toan
        [HttpGet("{id:int}/hinh-thanh-toan")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> LayHinhThanhToan(int id)
        {
            var donHang = await _context.DonHangs.AsNoTracking()
                .FirstOrDefaultAsync(order => order.MaDonHang == id);
            if (donHang == null)
            {
                return NotFound(new { message = $"Không tìm thấy đơn hàng mã {id}" });
            }
            if (string.IsNullOrWhiteSpace(donHang.HinhAnhThanhToan))
            {
                return NotFound(new { message = "Đơn hàng chưa có ảnh thanh toán." });
            }

            var fileName = Path.GetFileName(donHang.HinhAnhThanhToan);
            var filePath = Path.Combine(_environment.ContentRootPath, "storage", "payment-proofs", fileName);
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Không tìm thấy ảnh thanh toán." });
            }

            var contentType = Path.GetExtension(fileName).ToLowerInvariant() switch
            {
                ".png" => "image/png",
                ".webp" => "image/webp",
                _ => "image/jpeg"
            };
            return PhysicalFile(filePath, contentType);
        }

        // PUT: api/DonHang/5/trang-thai
        [HttpPut("{id:int}/trang-thai")]
        [Authorize]
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

                if (!User.IsInRole("Admin"))
                {
                    var subject = User.FindFirstValue(ClaimTypes.NameIdentifier);
                    var isOwner = string.Equals(subject, donHang.MaNguoiDung, StringComparison.Ordinal);
                    var isCancelRequest = GetOrderStatusStage(dto.TrangThai) == -1;
                    if (!isOwner || !isCancelRequest || GetOrderStatusStage(donHang.TrangThai ?? "") != 0)
                    {
                        error = "Bạn chỉ có thể hủy đơn hàng của mình khi đơn đang ở trạng thái Chờ xác nhận.";
                        return;
                    }
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

                var isBankTransfer = string.Equals(
                    donHang.PhuongThucThanhToan,
                    "Chuyển khoản ngân hàng",
                    StringComparison.OrdinalIgnoreCase);

                if (isBankTransfer && requestedStage > 0
                    && donHang.TrangThaiThanhToan != "Đã thanh toán")
                {
                    error = "Đơn thanh toán chuyển khoản phải được xác nhận thanh toán trước khi xử lý và giao hàng.";
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
                if (requestedStage == 3
                    && string.Equals(donHang.PhuongThucThanhToan, "COD", StringComparison.OrdinalIgnoreCase))
                {
                    var paymentConfirmedAt = DateTime.Now;
                    await _context.DonHangs
                        .Where(order => order.MaDonHang == id)
                        .ExecuteUpdateAsync(setters => setters
                            .SetProperty(order => order.TrangThaiThanhToan, "Đã thanh toán")
                            .SetProperty(order => order.NgayXacNhanThanhToan, paymentConfirmedAt)
                            .SetProperty(order => order.NguoiXacNhanThanhToan, "Người giao hàng"));
                    donHang.TrangThaiThanhToan = "Đã thanh toán";
                    donHang.NgayXacNhanThanhToan = paymentConfirmedAt;
                    donHang.NguoiXacNhanThanhToan = "Người giao hàng";
                }
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
        [Authorize]
        public async Task<IActionResult> UpdateDonHang(int id, [FromBody] DonHang model)
        {
            var donHang = await _context.DonHangs.FindAsync(id);
            if (donHang == null)
            {
                return NotFound(new { message = $"Không tìm thấy đơn hàng mã {id}" });
            }

            if (!User.IsInRole("Admin"))
            {
                var subject = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!string.Equals(subject, donHang.MaNguoiDung, StringComparison.Ordinal)
                    || donHang.TrangThai != "Chờ xác nhận")
                {
                    return Forbid();
                }
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
        [Authorize(Roles = "Admin")]
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

        private static bool IsValidPaymentImage(byte[] signature, int bytesRead, string extension)
        {
            if (bytesRead < 4)
            {
                return false;
            }

            if (extension.Equals(".jpg", StringComparison.OrdinalIgnoreCase)
                || extension.Equals(".jpeg", StringComparison.OrdinalIgnoreCase))
            {
                return bytesRead >= 3 && signature[0] == 0xFF && signature[1] == 0xD8 && signature[2] == 0xFF;
            }

            if (extension.Equals(".png", StringComparison.OrdinalIgnoreCase))
            {
                return bytesRead >= 8
                    && signature[0] == 0x89 && signature[1] == 0x50
                    && signature[2] == 0x4E && signature[3] == 0x47
                    && signature[4] == 0x0D && signature[5] == 0x0A
                    && signature[6] == 0x1A && signature[7] == 0x0A;
            }

            if (extension.Equals(".webp", StringComparison.OrdinalIgnoreCase))
            {
                return bytesRead >= 12
                    && signature[0] == 0x52 && signature[1] == 0x49
                    && signature[2] == 0x46 && signature[3] == 0x46
                    && signature[8] == 0x57 && signature[9] == 0x45
                    && signature[10] == 0x42 && signature[11] == 0x50;
            }

            return false;
        }

        private void DeletePaymentProof(string proofUrl)
        {
            var fileName = Path.GetFileName(proofUrl);
            if (string.IsNullOrWhiteSpace(fileName))
            {
                return;
            }

            var filePath = Path.Combine(_environment.ContentRootPath, "storage", "payment-proofs", fileName);
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
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