using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace DATN_HKP.Models
{
    [Index(nameof(MaDonHangHienThi), IsUnique = true)]
    public class DonHang
    {
        [Key]
        public int MaDonHang { get; set; }

        [StringLength(30)]
        [Display(Name = "Mã đơn hàng")]
        public string MaDonHangHienThi { get; set; } = string.Empty; // VD: DH202611210001

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

        [Display(Name = "Trạng thái thanh toán")]
        public string TrangThaiThanhToan { get; set; } = "Chưa thanh toán";

        [Display(Name = "Ảnh xác nhận thanh toán")]
        public string? HinhAnhThanhToan { get; set; }

        [Display(Name = "Thời điểm tải xác nhận")]
        public DateTime? NgayThongBaoThanhToan { get; set; }

        [Display(Name = "Thời điểm xác nhận thanh toán")]
        public DateTime? NgayXacNhanThanhToan { get; set; }

        [Display(Name = "Người xác nhận thanh toán")]
        public string? NguoiXacNhanThanhToan { get; set; }

        [Display(Name = "Lý do từ chối thanh toán")]
        public string? LyDoTuChoiThanhToan { get; set; }

        [Display(Name = "Ghi chú")]
        public string? GhiChu { get; set; }

        public List<ChiTietDonHang>? ChiTietDonHangs { get; set; }
    }
}