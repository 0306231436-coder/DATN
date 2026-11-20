using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DATN_HKP.Models
{
    [Table("DiaChiNguoiDungs")]
    public class DiaChiNguoiDung
    {
        [Key]
        public int MaDiaChi { get; set; }

        [Required]
        public int MaNguoiDung { get; set; }          // Đổi thành int

        [Required(ErrorMessage = "Tên người nhận không được để trống")]
        [StringLength(100)]
        public string TenNguoiNhan { get; set; } = string.Empty;

        [Required(ErrorMessage = "Số điện thoại không được để trống")]
        [StringLength(10, MinimumLength = 10)]
        [RegularExpression(@"^0[0-9]{9}$", ErrorMessage = "Số điện thoại phải bắt đầu bằng 0 và gồm đúng 10 chữ số")]
        public string SoDienThoai { get; set; } = string.Empty;

        [Required(ErrorMessage = "Địa chỉ chi tiết không được để trống")]
        [StringLength(500)]
        public string DiaChiChiTiet { get; set; } = string.Empty;

        public bool LaMacDinh { get; set; } = false;

        // Navigation
        [ForeignKey(nameof(MaNguoiDung))]
        public NguoiDung? NguoiDung { get; set; }
    }
}