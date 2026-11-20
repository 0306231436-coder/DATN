using DATN_HKP.Data;
using DATN_HKP.DTOs.Common;
using DATN_HKP.DTOs.SanPham;
using DATN_HKP.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace DATN_HKP.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SanPhamController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SanPhamController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/SanPham
        [HttpGet]
        public async Task<ActionResult<PagedResponse<SanPhamDto>>> GetSanPhams([FromQuery] ProductQueryParameters query)
        {
            var dbQuery = _context.SanPhams.AsNoTracking();

            if (!query.IncludeInactive)
            {
                dbQuery = dbQuery.Where(p => p.TrangThai && p.NgayXoa == null);
            }

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var search = query.Search.Trim();
                dbQuery = dbQuery.Where(p => p.TenSanPham.Contains(search) || p.MoTa.Contains(search));
            }

            if (query.MaDanhMuc.HasValue && query.MaDanhMuc > 0)
            {
                dbQuery = dbQuery.Where(p => p.MaDanhMuc == query.MaDanhMuc.Value);
            }
            else if (!string.IsNullOrWhiteSpace(query.Category))
            {
                if (int.TryParse(query.Category, out int catId))
                {
                    dbQuery = dbQuery.Where(p => p.MaDanhMuc == catId);
                }
                else
                {
                    dbQuery = dbQuery.Where(p => p.DanhMuc != null && p.DanhMuc.TenDanhMuc.Contains(query.Category));
                }
            }

            if (query.MaThuongHieu.HasValue && query.MaThuongHieu > 0)
            {
                dbQuery = dbQuery.Where(p => p.MaThuongHieu == query.MaThuongHieu.Value);
            }
            else if (!string.IsNullOrWhiteSpace(query.Brand) && !query.Brand.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                if (int.TryParse(query.Brand, out int brandId))
                {
                    dbQuery = dbQuery.Where(p => p.MaThuongHieu == brandId);
                }
                else
                {
                    dbQuery = dbQuery.Where(p => p.ThuongHieu != null && p.ThuongHieu.TenThuongHieu.Contains(query.Brand));
                }
            }

            if (query.MinPrice.HasValue)
            {
                dbQuery = dbQuery.Where(p => p.Gia >= query.MinPrice.Value);
            }
            if (query.MaxPrice.HasValue)
            {
                dbQuery = dbQuery.Where(p => p.Gia <= query.MaxPrice.Value);
            }

            dbQuery = (query.SortBy?.ToLower()) switch
            {
                "gia_asc" => dbQuery.OrderBy(p => p.Gia),
                "gia_desc" => dbQuery.OrderByDescending(p => p.Gia),
                "ten_asc" => dbQuery.OrderBy(p => p.TenSanPham),
                "ten_desc" => dbQuery.OrderByDescending(p => p.TenSanPham),
                _ => dbQuery.OrderByDescending(p => p.MaSanPham),
            };

            var totalItems = await dbQuery.CountAsync();

            var items = await dbQuery
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(SanPhamProjection)
                .ToListAsync();

            return Ok(new PagedResponse<SanPhamDto>(items, totalItems, query.PageNumber, query.PageSize));
        }

        // GET: api/SanPham/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<SanPhamDto>> GetSanPham(int id, [FromQuery] bool includeInactive = false)
        {
            var dbQuery = _context.SanPhams.AsNoTracking();

            if (!includeInactive)
            {
                dbQuery = dbQuery.Where(s => s.TrangThai && s.NgayXoa == null);
            }

            var dto = await dbQuery
                .Where(s => s.MaSanPham == id)
                .Select(SanPhamProjection)
                .FirstOrDefaultAsync();

            if (dto == null)
            {
                return NotFound(new { message = $"Không tìm thấy sản phẩm có mã {id}" });
            }

            return Ok(dto);
        }

        // POST: api/SanPham
        [HttpPost]
        public async Task<ActionResult<SanPhamDto>> CreateSanPham([FromBody] SanPhamRequestDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var danhMucExists = await _context.DanhMucs.AnyAsync(d => d.MaDanhMuc == request.MaDanhMuc);
            if (!danhMucExists) return BadRequest(new { message = $"Danh mục mã {request.MaDanhMuc} không tồn tại" });

            var thuongHieuExists = await _context.ThuongHieus.AnyAsync(t => t.MaThuongHieu == request.MaThuongHieu);
            if (!thuongHieuExists) return BadRequest(new { message = $"Thương hiệu mã {request.MaThuongHieu} không tồn tại" });

            string mainImage = request.HinhAnh;
            if (request.DanhSachHinhAnh != null && request.DanhSachHinhAnh.Any())
            {
                mainImage = request.DanhSachHinhAnh.First().DuongDanAnh;
            }

            var sp = new SanPham
            {
                TenSanPham = request.TenSanPham,
                Gia = request.Gia,
                SoLuong = request.SoLuong,
                LuotBan = 0,
                HinhAnh = mainImage ?? string.Empty,
                ThongSoKyThuat = request.ThongSoKyThuat ?? string.Empty,
                MoTa = request.MoTa ?? string.Empty,
                MaDanhMuc = request.MaDanhMuc,
                MaThuongHieu = request.MaThuongHieu,
                TrangThai = true,
                NgayXoa = null
            };

            _context.SanPhams.Add(sp);
            await _context.SaveChangesAsync();

            // 1. Lưu danh sách album hình ảnh
            if (request.DanhSachHinhAnh != null && request.DanhSachHinhAnh.Any())
            {
                var hinhAnhs = request.DanhSachHinhAnh.Select((h, index) => new HinhAnhSanPham
                {
                    MaSanPham = sp.MaSanPham,
                    DuongDanAnh = h.DuongDanAnh,
                    LaAnhChinh = index == 0,
                    ThuTuHienThi = index + 1
                }).ToList();

                _context.HinhAnhSanPhams.AddRange(hinhAnhs);
            }

            // 2. Lưu danh sách biến thể sản phẩm
            if (request.DanhSachBienThe != null && request.DanhSachBienThe.Any())
            {
                var bienThes = request.DanhSachBienThe.Select(b => new BienTheSanPham
                {
                    MaSanPham = sp.MaSanPham,
                    TenBienThe = b.TenBienThe,
                    SKU = b.SKU,
                    Gia = b.Gia > 0 ? b.Gia : sp.Gia,
                    GiaKhuyenMai = b.GiaKhuyenMai,
                    SoLuongTon = b.SoLuongTon,
                    HinhAnh = b.HinhAnh ?? sp.HinhAnh,
                    TrangThai = true
                }).ToList();

                _context.BienTheSanPhams.AddRange(bienThes);
            }

            await _context.SaveChangesAsync();

            var createdResult = await GetSanPham(sp.MaSanPham, includeInactive: true);
            if (createdResult.Result is OkObjectResult okResult)
            {
                return CreatedAtAction(nameof(GetSanPham), new { id = sp.MaSanPham }, okResult.Value);
            }

            return StatusCode(500, new { message = "Lỗi khi lấy thông tin sản phẩm sau khi tạo." });
        }

        // PUT: api/SanPham/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateSanPham(int id, [FromBody] SanPhamRequestDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var sp = await _context.SanPhams
                .Include(s => s.HinhAnhSanPhams)
                .Include(s => s.BienTheSanPhams)
                .FirstOrDefaultAsync(s => s.MaSanPham == id);

            if (sp == null) return NotFound(new { message = $"Không tìm thấy sản phẩm có mã {id}" });

            string mainImage = request.HinhAnh;
            if (request.DanhSachHinhAnh != null && request.DanhSachHinhAnh.Any())
            {
                mainImage = request.DanhSachHinhAnh.First().DuongDanAnh;
            }

            sp.TenSanPham = request.TenSanPham;
            sp.Gia = request.Gia;
            sp.SoLuong = request.SoLuong;
            sp.HinhAnh = string.IsNullOrWhiteSpace(mainImage) ? sp.HinhAnh : mainImage;
            sp.ThongSoKyThuat = request.ThongSoKyThuat ?? sp.ThongSoKyThuat;
            sp.MoTa = request.MoTa ?? sp.MoTa;
            sp.MaDanhMuc = request.MaDanhMuc;
            sp.MaThuongHieu = request.MaThuongHieu;

            // Cập nhật album ảnh
            if (request.DanhSachHinhAnh != null)
            {
                _context.HinhAnhSanPhams.RemoveRange(sp.HinhAnhSanPhams);

                var newImages = request.DanhSachHinhAnh.Select((h, index) => new HinhAnhSanPham
                {
                    MaSanPham = sp.MaSanPham,
                    DuongDanAnh = h.DuongDanAnh,
                    LaAnhChinh = index == 0,
                    ThuTuHienThi = index + 1
                });

                _context.HinhAnhSanPhams.AddRange(newImages);
            }

            // Cập nhật biến thể
            if (request.DanhSachBienThe != null)
            {
                _context.BienTheSanPhams.RemoveRange(sp.BienTheSanPhams);

                var newVariants = request.DanhSachBienThe.Select(b => new BienTheSanPham
                {
                    MaSanPham = sp.MaSanPham,
                    TenBienThe = b.TenBienThe,
                    SKU = b.SKU,
                    Gia = b.Gia > 0 ? b.Gia : sp.Gia,
                    GiaKhuyenMai = b.GiaKhuyenMai,
                    SoLuongTon = b.SoLuongTon,
                    HinhAnh = b.HinhAnh ?? sp.HinhAnh,
                    TrangThai = true
                });

                _context.BienTheSanPhams.AddRange(newVariants);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật sản phẩm thành công", data = sp });
        }

        // DELETE: api/SanPham/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> SoftDeleteSanPham(int id)
        {
            var sp = await _context.SanPhams.FindAsync(id);
            if (sp == null) return NotFound(new { message = $"Không tìm thấy sản phẩm có mã {id}" });

            if (!sp.TrangThai && sp.NgayXoa != null)
            {
                return BadRequest(new { message = "Sản phẩm đã bị xóa mềm trước đó." });
            }

            sp.TrangThai = false;
            sp.NgayXoa = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã xóa mềm sản phẩm mã {id}.", ngayXoa = sp.NgayXoa });
        }

        // PUT: api/SanPham/5/restore
        [HttpPut("{id:int}/restore")]
        public async Task<IActionResult> RestoreSanPham(int id)
        {
            var sp = await _context.SanPhams.FindAsync(id);
            if (sp == null) return NotFound(new { message = $"Không tìm thấy sản phẩm có mã {id}" });

            sp.TrangThai = true;
            sp.NgayXoa = null;

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã khôi phục lại sản phẩm mã {id}", data = sp });
        }

        #region Reusable Expression Projection
        private static readonly Expression<Func<SanPham, SanPhamDto>> SanPhamProjection = p => new SanPhamDto
        {
            MaSanPham = p.MaSanPham,
            TenSanPham = p.TenSanPham,
            Gia = p.Gia,
            SoLuong = p.SoLuong,
            LuotBan = p.LuotBan,
            HinhAnh = p.HinhAnh,
            ThongSoKyThuat = p.ThongSoKyThuat,
            MoTa = p.MoTa,
            MaDanhMuc = p.MaDanhMuc,
            TenDanhMuc = p.DanhMuc != null ? p.DanhMuc.TenDanhMuc : string.Empty,
            MaThuongHieu = p.MaThuongHieu,
            TenThuongHieu = p.ThuongHieu != null ? p.ThuongHieu.TenThuongHieu : string.Empty,
            IsActive = p.TrangThai,
            TrangThai = p.TrangThai,
            NgayXoa = p.NgayXoa,
            BienTheSanPhams = p.BienTheSanPhams != null ? p.BienTheSanPhams
                .Where(b => b.TrangThai && b.NgayXoa == null)
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
                }).ToList() : new List<BienTheDto>(),
            HinhAnhSanPhams = p.HinhAnhSanPhams != null ? p.HinhAnhSanPhams
                .OrderBy(h => h.ThuTuHienThi)
                .Select(h => new HinhAnhDto
                {
                    MaHinhAnh = h.MaHinhAnh,
                    MaSanPham = h.MaSanPham,
                    DuongDanAnh = h.DuongDanAnh,
                    LaAnhChinh = h.LaAnhChinh,
                    ThuTuHienThi = h.ThuTuHienThi
                }).ToList() : new List<HinhAnhDto>()
        };
        #endregion
    }
}