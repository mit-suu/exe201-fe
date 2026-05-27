import api from './api.js';

export const getAdminDashboard = async () => (await api.get('/admin/dashboard')).data.data;
export const getAdminUsers = async (role) => (await api.get('/admin/users', { params: role ? { role } : {} })).data.data;
export const setUserStatus = async (id, isActive) => (await api.patch(`/admin/users/${id}/status`, { isActive })).data.data;
export const approveShop = async (id, approved = true) => (await api.patch(`/admin/shops/${id}/approve`, { approved })).data.data;
export const getAdminProducts = async (params = {}) => (await api.get('/admin/products', { params })).data.data;
export const getAdminOrders = async (params = {}) => (await api.get('/admin/orders', { params })).data.data;
export const getAdminCategories = async () => (await api.get('/admin/categories')).data.data;
export const getAdminReports = async () => (await api.get('/admin/reports')).data.data;
