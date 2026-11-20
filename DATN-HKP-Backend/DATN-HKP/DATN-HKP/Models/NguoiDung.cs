using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DATN_HKP.Models
{
    [Table("NguoiDungs")]
    public class NguoiDung
    {
        [Key]
        public int MaNguoiDung { get; set; }

        [Required(ErrorMessage = "Tên đăng nhập không được để trống")]
        [StringLength(50, ErrorMessage = "Tên đăng nhập từ 3 đến 50 ký tự", MinimumLength = 3)]
        public string TenDangNhap { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu không được để trống")]
        [StringLength(255)]
        public string MatKhau { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email không được để trống")]
        [EmailAddress(ErrorMessage = "Email không đúng định dạng")]
        [StringLength(100)]
        public string Email { get; set; } = string.Empty;

        [StringLength(100)]
        [Display(Name = "Họ và tên")]
        public string HoTen { get; set; } = string.Empty;

        [StringLength(10, MinimumLength = 10, ErrorMessage = "Số điện thoại phải đúng 10 chữ số")]
        [RegularExpression(@"^0[0-9]{9}$", ErrorMessage = "Số điện thoại phải bắt đầu bằng 0 và gồm đúng 10 chữ số")]
        [Display(Name = "Số điện thoại")]
        public string? SoDienThoai { get; set; }

        // ĐÃ XÓA CỘT DiaChi

        [StringLength(20)]
        [Display(Name = "Vai trò")]
        public string VaiTro { get; set; } = "Customer";

        public DateTime NgayTao { get; set; } = DateTime.Now;

        public bool TrangThai { get; set; } = true;

        // Navigation
        public List<DiaChiNguoiDung>? DiaChiNguoiDungs { get; set; }
    }
}