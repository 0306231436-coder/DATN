using System.ComponentModel.DataAnnotations;

namespace DATN_HKP.DTOs.NguoiDung
{
    public class NguoiDungCreateDto
    {
        [Required(ErrorMessage = "Tên đăng nhập không được để trống")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Tên đăng nhập từ 3 đến 50 ký tự")]
        [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Tên đăng nhập không được chứa ký tự đặc biệt hoặc khoảng trắng")]
        public string TenDangNhap { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu không được để trống")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu tối thiểu 6 ký tự")]
        public string MatKhau { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email không được để trống")]
        [EmailAddress(ErrorMessage = "Email không đúng định dạng")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Họ tên không được để trống")]
        [RegularExpression(@"^[^\d]+$", ErrorMessage = "Họ tên không được chứa chữ số")]
        public string HoTen { get; set; } = string.Empty;

        [Required(ErrorMessage = "Số điện thoại không được để trống")]
        [StringLength(10, MinimumLength = 10, ErrorMessage = "Số điện thoại phải đúng 10 chữ số")]
        [RegularExpression(@"^0[0-9]{9}$", ErrorMessage = "Số điện thoại phải bắt đầu bằng 0 và gồm đúng 10 chữ số")]
        public string SoDienThoai { get; set; } = string.Empty;

        // ĐÃ XÓA DiaChi

        public string VaiTro { get; set; } = "Customer";
    }

    public class NguoiDungLoginDto
    {
        [Required(ErrorMessage = "Tên đăng nhập hoặc Email không được để trống")]
        public string UserNameOrEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu không được để trống")]
        public string MatKhau { get; set; } = string.Empty;
    }

    public class NguoiDungUpdateDto
    {
        [RegularExpression(@"^[^\d]*$", ErrorMessage = "Họ tên không được chứa chữ số")]
        public string? HoTen { get; set; }

        [StringLength(10, MinimumLength = 10, ErrorMessage = "Số điện thoại phải đúng 10 chữ số")]
        [RegularExpression(@"^0[0-9]{9}$", ErrorMessage = "Số điện thoại phải bắt đầu bằng 0 và gồm đúng 10 chữ số")]
        public string? SoDienThoai { get; set; }

        // ĐÃ XÓA DiaChi

        public string? VaiTro { get; set; }
        public bool? TrangThai { get; set; }
        public string? MatKhauMoi { get; set; }
    }

    public class NguoiDungDto
    {
        public int MaNguoiDung { get; set; }
        public string TenDangNhap { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string HoTen { get; set; } = string.Empty;
        public string? SoDienThoai { get; set; }
        // ĐÃ XÓA DiaChi
        public string VaiTro { get; set; } = string.Empty;
        public DateTime NgayTao { get; set; }
        public bool TrangThai { get; set; }
    }
}