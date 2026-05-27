import api from './api.js';

export const getMyNotifications = async () => (await api.get('/notifications')).data.data;
export const markNotificationRead = async (id) => (await api.patch(`/notifications/${id}/read`)).data.data;
