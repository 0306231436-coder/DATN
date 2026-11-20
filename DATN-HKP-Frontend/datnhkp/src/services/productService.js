import axiosClient from '../api/axiosClient';

export const productService = {
  getSanPhams: (params = {}) => {
    return axiosClient.get('/SanPham', {
      params: {
        pageNumber: params.pageNumber || 1,
        pageSize: params.pageSize || 12,
        search: params.search || '',
        category: params.category || '',
        brand: params.brand || '',
        includeInactive: params.includeInactive ?? false,
      },
    });
  },

  getSanPhamById: (id) => axiosClient.get(`/SanPham/${id}`),
  createSanPham: (data) => axiosClient.post('/SanPham', data),
  updateSanPham: (id, data) => axiosClient.put(`/SanPham/${id}`, data),
  softDeleteSanPham: (id) => axiosClient.delete(`/SanPham/${id}`),
  restoreSanPham: (id) => axiosClient.put(`/SanPham/${id}/restore`),

  uploadImages: (files) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    return axiosClient.post('/Upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getCategories: () => axiosClient.get('/DanhMuc'),
  getBrands: () => axiosClient.get('/ThuongHieu'),
  createCategory: (data) => axiosClient.post('/DanhMuc', data),
  updateCategory: (id, data) => axiosClient.put(`/DanhMuc/${id}`, data),
  deleteCategory: (id) => axiosClient.delete(`/DanhMuc/${id}`),
  createBrand: (data) => axiosClient.post('/ThuongHieu', data),
  updateBrand: (id, data) => axiosClient.put(`/ThuongHieu/${id}`, data),
  deleteBrand: (id) => axiosClient.delete(`/ThuongHieu/${id}`),
};