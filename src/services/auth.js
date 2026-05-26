import api from './api.js';

const USER_KEY = 'exe201-user';
const TOKEN_KEY = 'accessToken';

export const saveSession = (user, token) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearSession = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  saveSession(data.data.user, data.data.accessToken);
  return data.data.user;
};

export const register = async (fullName, email, password) => {
  const { data } = await api.post('/auth/register', { fullName, email, password });
  saveSession(data.data.user, data.data.accessToken);
  return data.data.user;
};
