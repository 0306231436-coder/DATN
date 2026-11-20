import axiosClient from '../api/axiosClient';

export const donHangService = {
  // Lấy danh sách đơn hàng (hỗ trợ lọc theo maNguoiDung, trangThai)
  getDonHangs: (params = {}) => {
    return axiosClient.get('/DonHang', {
      params: {
        maNguoiDung: params.maNguoiDung || '',
        trangThai: params.trangThai || '',
      },
    });
  },

  // Lấy dữ liệu thống kê tổng số đơn, doanh thu và trạng thái đơn hàng
  getThongKe: () => axiosClient.get('/DonHang/thong-ke'),

  // Lấy chi tiết đơn hàng theo ID
  getDonHangById: (id) => axiosClient.get(`/DonHang/${id}`),

  // Lấy danh sách đơn hàng của một người dùng cụ thể
  getDonHangsByUser: (maNguoiDung) => axiosClient.get(`/DonHang/user/${maNguoiDung}`),

  // Tạo đơn hàng mới
  createDonHang: (data) => axiosClient.post('/DonHang', data),

  // Backend cập nhật trạng thái và xử lý tồn kho trong cùng một transaction.
  updateTrangThai: (id, trangThai) => 
    axiosClient.put(`/DonHang/${id}/trang-thai`, { trangThai }),

  // Cập nhật toàn bộ thông tin đơn hàng
  updateDonHang: (id, data) => axiosClient.put(`/DonHang/${id}`, data),

  // Xóa đơn hàng
  deleteDonHang: (id) => axiosClient.delete(`/DonHang/${id}`),
};

export default donHangService;