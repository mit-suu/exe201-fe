import api from './api.js';

export const createOrder = async (payload) => (await api.post('/orders', payload)).data.data;
export const getMyOrders = async () => (await api.get('/orders/me')).data.data;
export const getOrder = async (id) => (await api.get(`/orders/${id}`)).data.data;
export const cancelOrder = async (id) => (await api.patch(`/orders/${id}/cancel`)).data.data;
export const getAllOrders = async (params = {}) => (await api.get('/orders', { params })).data.data;
export const getShopOrders = async (params = {}) => (await api.get('/orders/shop/me', { params })).data.data;
export const getShopRevenue = async () => (await api.get('/orders/shop/revenue')).data.data;
export const updateOrderStatus = async (id, status) => (await api.patch(`/orders/${id}/status`, { status })).data.data;
export const getPaymentStatus = async (orderId) => (await api.get(`/payments/orders/${orderId}/status`)).data.data;
