namespace DATN_HKP.DTOs.GioHang
{
    public class AddToCartDto
    {
        public string MaNguoiDung { get; set; } = string.Empty;
        public int MaSanPham { get; set; }
        public int? MaBienThe { get; set; }
        public int SoLuong { get; set; } = 1;
    }

    public class UpdateQuantityDto
    {
        public int SoLuong { get; set; }
    }
}