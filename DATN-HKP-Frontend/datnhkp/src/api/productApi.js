import axiosClient from './axiosClient';

export const productApi = {
  // GET: /api/products
  getAll: () => {
    return axiosClient.get('/products');
  },

  // GET: /api/products/1
  getById: (id) => {
    return axiosClient.get(`/products/${id}`);
  },

  // POST: /api/products
  create: (data) => {
    return axiosClient.post('/products', data);
  },
};