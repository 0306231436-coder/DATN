using System.ComponentModel.DataAnnotations;

namespace DATN_HKP.DTOs.DonHang
{
    public class DonHangCreateDto
    {
        public string? MaNguoiDung { get; set; } = "guest";

        [Required(ErrorMessage = "Tên người nhận không được để trống")]
        public string TenNguoiNhan { get; set; } = string.Empty;

        [Required(ErrorMessage = "Số điện thoại không được để trống")]
        public string SoDienThoai { get; set; } = string.Empty;

        [Required(ErrorMessage = "Địa chỉ giao hàng không được để trống")]
        public string DiaChiGiaoHang { get; set; } = string.Empty;

        public decimal TongTien { get; set; }

        public string PhuongThucThanhToan { get; set; } = "COD";

        public string? GhiChu { get; set; }

        public List<ChiTietDonHangCreateDto> ChiTietDonHangs { get; set; } = new();
    }

    public class ChiTietDonHangCreateDto
    {
        public int MaSanPham { get; set; }
        public int? MaBienThe { get; set; }
        public int SoLuong { get; set; }
        public decimal DonGia { get; set; }
    }

    public class UpdateTrangThaiDonHangDto
    {
        [Required(ErrorMessage = "Trạng thái không được để trống")]
        public string TrangThai { get; set; } = string.Empty;
    }


}
