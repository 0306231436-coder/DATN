namespace DATN_HKP.DTOs.SanPham
{
    public class SanPhamDto
    {
        public int MaSanPham { get; set; }
        public string TenSanPham { get; set; } = string.Empty;
        public decimal Gia { get; set; }
        public int SoLuong { get; set; }
        public int LuotBan { get; set; } = 0; // BỔ SUNG CỘT NÀY VÀO DTO
        public string HinhAnh { get; set; } = string.Empty;
        public string ThongSoKyThuat { get; set; } = string.Empty;
        public string MoTa { get; set; } = string.Empty;

        public int MaDanhMuc { get; set; }
        public string TenDanhMuc { get; set; } = string.Empty;

        public int MaThuongHieu { get; set; }
        public string TenThuongHieu { get; set; } = string.Empty;

        public bool IsActive { get; set; }
        public bool TrangThai { get; set; } = true;
        public DateTime? NgayXoa { get; set; }

        // Các biến thể và album ảnh chi tiết
        public List<BienTheDto> BienTheSanPhams { get; set; } = new();
        public List<HinhAnhDto> HinhAnhSanPhams { get; set; } = new();
    }

    public class BienTheDto
    {
        public int MaBienThe { get; set; }
        public int MaSanPham { get; set; }
        public string TenBienThe { get; set; } = string.Empty;
        public string? SKU { get; set; }
        public decimal Gia { get; set; }
        public decimal? GiaKhuyenMai { get; set; }
        public int SoLuongTon { get; set; }
        public string? HinhAnh { get; set; }
    }

    public class HinhAnhDto
    {
        public int MaHinhAnh { get; set; }
        public int MaSanPham { get; set; }
        public string DuongDanAnh { get; set; } = string.Empty;
        public bool LaAnhChinh { get; set; }
        public int ThuTuHienThi { get; set; }
    }
}