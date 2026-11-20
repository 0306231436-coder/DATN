import axios from 'axios';

export const API_BASE_URL = 'https://localhost:7287/api';

const axiosClient = axios.create({
  // URL gốc của ASP.NET Core API
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Bắt buộc phải có để gửi/nhận Cookie/Identity Session khi backend dùng AllowCredentials()
  withCredentials: true, 
});

// Tự động gắn token vào header Authorization nếu người dùng đã đăng nhập
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor xử lý response hoặc lỗi dùng chung (tùy chọn)
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response || error.message);
    return Promise.reject(error);
  }
);

export default axiosClient;
