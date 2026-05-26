import api from './api.js';

export const createOrder = async (payload) => (await api.post('/orders', payload)).data.data;
export const getMyOrders = async () => (await api.get('/orders/me')).data.data;
export const getAllOrders = async () => (await api.get('/orders')).data.data;
export const updateOrderStatus = async (id, status) => (await api.patch(`/orders/${id}/status`, { status })).data.data;
export const getPaymentStatus = async (orderId) => (await api.get(`/payments/orders/${orderId}/status`)).data.data;
