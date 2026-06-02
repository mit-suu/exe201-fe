import api from './api.js';

export const listProducts = async (params = {}) => (await api.get('/products', { params })).data.data;
export const getProduct = async (id) => (await api.get(`/products/${id}`)).data.data;
export const listCategories = async () => (await api.get('/products/categories')).data.data;
export const listShopProducts = async (params = {}) => (await api.get('/products/shop/me', { params })).data.data;
export const createProduct = async (payload) => (await api.post('/products/shop/me', payload)).data.data;
export const updateProduct = async (id, payload) => (await api.put(`/products/${id}`, payload)).data.data;
export const deleteProduct = async (id) => (await api.delete(`/products/${id}`)).data;
