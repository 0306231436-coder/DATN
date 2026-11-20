using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DATN_HKP.Models;

public class ChiTietDonHang
{
    [Key]
    public int MaChiTiet { get; set; }

    public int MaDonHang { get; set; }
    [ForeignKey("MaDonHang")]
    public DonHang? DonHang { get; set; }

    public int MaSanPham { get; set; }
    [ForeignKey("MaSanPham")]
    public SanPham? SanPham { get; set; }

    // Bổ sung khóa ngoại tới biến thể (nếu sản phẩm có chọn cấu hình)
    public int? MaBienThe { get; set; }
    [ForeignKey("MaBienThe")]
    public BienTheSanPham? BienThe { get; set; }

    public int SoLuong { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DonGia { get; set; }
}