import api from './api.js';

export const getPlatformConfig = async () => (await api.get('/platform/config')).data.data;
export const updatePlatformConfig = async (payload) => (await api.patch('/platform/config', payload)).data.data;
export const createComplaint = async (payload) => (await api.post('/platform/complaints', payload)).data.data;
export const getComplaintsList = async () => (await api.get('/platform/complaints')).data.data;
export const updateComplaintStatus = async (id, payload) => (await api.patch(`/platform/complaints/${id}`, payload)).data.data;
export const getActivityLogs = async () => (await api.get('/platform/logs')).data.data;
