import api from './api.js';

export const getMyNotifications = async () => {
  try {
    const res = await api.get('/notifications');
    return res.data?.data || [];
  } catch (error) {
    return []; // Trả về mảng rỗng nếu tính năng chưa làm (404)
  }
};

export const markNotificationRead = async (id) => {
  try {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data?.data || null;
  } catch (error) {
    return null;
  }
};
