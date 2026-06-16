import api from './api.js';

export const getPlatformConfig = async () => {
  try { return (await api.get('/settings/platform/config')).data.data; } catch(e) { return null; }
};
export const updatePlatformConfig = async (payload) => {
  try { return (await api.patch('/settings/platform/config', payload)).data.data; } catch(e) { return null; }
};
export const createComplaint = async (payload) => {
  try { return (await api.post('/platform/complaints', payload)).data.data; } catch(e) { return null; }
};
export const getComplaintsList = async () => {
  try { return (await api.get('/platform/complaints')).data.data; } catch(e) { return []; }
};
export const updateComplaintStatus = async (id, payload) => {
  try { return (await api.patch(`/platform/complaints/${id}`, payload)).data.data; } catch(e) { return null; }
};
export const getActivityLogs = async () => {
  try { return (await api.get('/platform/logs')).data.data; } catch(e) { return []; }
};
export const getActivityStats = async (period = 'today') => {
  try { return (await api.get('/platform/logs/stats', { params: { period } })).data.data; } catch(e) { return null; }
};
export const getAdminBankInfo = async () => {
  try { return (await api.get('/settings/bank')).data.data; } catch(e) { return null; }
};
export const updateAdminBankInfo = async (payload) => {
  try { return (await api.put('/settings/admin/bank', payload)).data.data; } catch(e) { return null; }
};
