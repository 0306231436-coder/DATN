using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DATN_HKP.Models
{
    public class DonHang
    {
        [Key]
        public int MaDonHang { get; set; }

        public string MaNguoiDung { get; set; } = string.Empty; // Id của tài khoản mua hàng

        [Display(Name = "Ngày đặt")]
        public DateTime NgayDat { get; set; } = DateTime.Now;

        [Required(ErrorMessage = "Họ tên người nhận không được để trống")]
        [Display(Name = "Tên người nhận")]
        public string TenNguoiNhan { get; set; } = string.Empty;

        [Required(ErrorMessage = "Số điện thoại không được để trống")]
        [Display(Name = "Số điện thoại")]
        public string SoDienThoai { get; set; } = string.Empty;

        [Required(ErrorMessage = "Địa chỉ không được để trống")]
        [Display(Name = "Địa chỉ giao hàng")]
        public string DiaChiGiaoHang { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        [Display(Name = "Tổng tiền")]
        public decimal TongTien { get; set; }

        [Display(Name = "Trạng thái đơn hàng")]
        public string TrangThai { get; set; } = "Chờ xác nhận"; // Chờ xác nhận, Đã xác nhận, Đang giao, Đã giao, Đã hủy

        [Display(Name = "Phương thức thanh toán")]
        public string PhuongThucThanhToan { get; set; } = "COD"; // COD, VNPay, MoMo

        [Display(Name = "Ghi chú")]
        public string? GhiChu { get; set; }

        public List<ChiTietDonHang>? ChiTietDonHangs { get; set; }
    }
}