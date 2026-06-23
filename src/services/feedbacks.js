import api from './api.js';

export const submitFeedback = async (payload) => {
  return (await api.post('/feedbacks', payload)).data;
};

export const getAdminFeedbacks = async (params = {}) => {
  return (await api.get('/feedbacks/admin', { params })).data;
};

export const updateFeedback = async (id, payload) => {
  return (await api.patch(`/feedbacks/admin/${id}`, payload)).data;
};
