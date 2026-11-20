import axiosClient from '../api/axiosClient';

export const cartService = {
  // Lấy giỏ hàng theo mã người dùng
  getCartByUser: (maNguoiDung) => {
    return axiosClient.get(`/ChiTietGioHang/user/${maNguoiDung}`);
  },

  // Thêm hoặc cập nhật sản phẩm vào giỏ hàng
  addToCart: (payload) => {
    // payload: { maNguoiDung, maSanPham, maBienThe, soLuong }
    return axiosClient.post('/ChiTietGioHang', payload);
  },

  // Cập nhật số lượng của một mục giỏ hàng
  updateQuantity: (maChiTietGioHang, soLuong) => {
    return axiosClient.put(`/ChiTietGioHang/${maChiTietGioHang}`, { soLuong });
  },

  // Xóa một sản phẩm khỏi giỏ hàng
  removeFromCart: (maChiTietGioHang) => {
    return axiosClient.delete(`/ChiTietGioHang/${maChiTietGioHang}`);
  },

  // Xóa sạch giỏ hàng của người dùng
  clearCart: (maNguoiDung) => {
    return axiosClient.delete(`/ChiTietGioHang/user/${maNguoiDung}`);
  },
};

export default cartService;