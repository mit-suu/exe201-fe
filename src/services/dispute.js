import api from './api.js';

export const createDispute = async (payload) => (await api.post('/disputes', payload)).data.data;
export const getMyDisputes = async () => (await api.get('/disputes/me')).data.data;
