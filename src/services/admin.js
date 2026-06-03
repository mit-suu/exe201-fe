import api from './api.js';

export const getAdminDashboard = async () => { try { return (await api.get('/admin/dashboard')).data.data; } catch(e) { return null; } };
export const getAdminUsers = async (role) => { try { return (await api.get('/admin/users', { params: role ? { role } : {} })).data.data; } catch(e) { return []; } };
export const setUserStatus = async (id, isActive) => (await api.patch(`/admin/users/${id}/status`, { isActive })).data.data;
export const approveLender = async (id, approved = true) => (await api.patch(`/admin/lenders/${id}/approve`, { approved })).data.data;
export const rejectLender = async (id, reason = '') => (await api.patch(`/admin/lenders/${id}/reject`, { rejectReason: reason })).data.data;
export const getPendingLenders = async () => { try { return (await api.get('/admin/lenders/pending')).data.data; } catch(e) { return []; } };
export const getAdminProducts = async (params = {}) => { try { return (await api.get('/admin/products', { params })).data.data; } catch(e) { return []; } };
export const getAdminOrders = async (params = {}) => { try { return (await api.get('/admin/orders', { params })).data.data; } catch(e) { return []; } };
export const getAdminCategories = async () => { try { return (await api.get('/admin/categories')).data.data; } catch(e) { return []; } };
export const getAdminReports = async () => { try { return (await api.get('/admin/reports')).data.data; } catch(e) { return null; } };

export const getAllDisputes = async () => { try { return (await api.get('/admin/disputes')).data.data; } catch(e) { return []; } };
export const resolveDispute = async (id, payload) => (await api.patch(`/admin/disputes/${id}/resolve`, payload)).data.data;

export const getAllWithdrawals = async () => { try { return (await api.get('/admin/withdrawals')).data.data; } catch(e) { return []; } };
export const processWithdrawal = async (id, payload) => (await api.patch(`/admin/withdrawals/${id}/process`, payload)).data.data;
