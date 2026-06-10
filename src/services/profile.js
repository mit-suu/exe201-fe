import api from './api.js';
import { saveSession } from './auth.js';

export const getProfile = async () => (await api.get('/auth/me')).data.data;

export const updateProfile = async (payload) => {
  const user = (await api.patch('/auth/profile', payload)).data.data;
  const token = localStorage.getItem('accessToken');
  if (token) saveSession(user, token);
  return user;
};

export const updateLenderProfile = async (payload) => (await api.patch('/users/lender-profile', payload)).data.data;

export const changePassword = async (payload) => (await api.post('/auth/change-password', payload)).data;
