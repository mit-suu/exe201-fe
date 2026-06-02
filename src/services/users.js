import api from './api.js';

export const getUsers = async () => (await api.get('/users')).data.data;
