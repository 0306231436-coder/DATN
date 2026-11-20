using System.ComponentModel.DataAnnotations;

namespace DATN_HKP.DTOs.SanPham
{
    public class BienTheCreateDto
    {
        public int MaSanPham { get; set; }

        [Required(ErrorMessage = "Tên biến thể không được để trống")]
        public string TenBienThe { get; set; } = string.Empty;

        public string? SKU { get; set; }
        public decimal Gia { get; set; }
        public decimal? GiaKhuyenMai { get; set; }
        public int SoLuongTon { get; set; }
        public string? HinhAnh { get; set; }
    }

    public class HinhAnhCreateDto
    {
        public string DuongDanAnh { get; set; } = string.Empty;
        public bool LaAnhChinh { get; set; } = false;
        public int ThuTuHienThi { get; set; } = 0;
    }

    public class SanPhamRequestDto
    {
        [Required(ErrorMessage = "Tên sản phẩm không được để trống")]
        [StringLength(200)]
        public string TenSanPham { get; set; } = string.Empty;

        [Required(ErrorMessage = "Giá bán không được để trống")]
        [Range(0, 1000000000)]
        public decimal Gia { get; set; }

        [Range(0, 100000)]
        public int SoLuong { get; set; }

        public string HinhAnh { get; set; } = string.Empty;
        public string ThongSoKyThuat { get; set; } = string.Empty;
        public string MoTa { get; set; } = string.Empty;

        [Required(ErrorMessage = "Danh mục không được để trống")]
        public int MaDanhMuc { get; set; }

        [Required(ErrorMessage = "Thương hiệu không được để trống")]
        public int MaThuongHieu { get; set; }

        public List<HinhAnhCreateDto>? DanhSachHinhAnh { get; set; } = new();
        public List<BienTheCreateDto>? DanhSachBienThe { get; set; } = new();
    }
}