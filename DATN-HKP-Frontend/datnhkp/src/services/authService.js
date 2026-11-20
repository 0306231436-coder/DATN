import axiosClient from '../api/axiosClient';

export const authService = {
  // Đăng nhập
  login: (credentials) => {
    // credentials: { userNameOrEmail, matKhau }
    return axiosClient.post('/NguoiDung/login', credentials);
  },

  // Đăng ký
  register: (userData) => {
    // userData: { hoTen, email, soDienThoai, matKhau }
    return axiosClient.post('/NguoiDung', userData);
  },

  // Lấy danh sách người dùng phục vụ trang quản trị
  getUsers: (params = {}) => axiosClient.get('/NguoiDung', { params }),

  // Lấy thông tin chi tiết người dùng theo ID
  getUserById: (id) => {
    return axiosClient.get(`/NguoiDung/${id}`);
  },

  // Cập nhật thông tin người dùng
  updateUser: (id, data) => {
    return axiosClient.put(`/NguoiDung/${id}`, data);
  },
};