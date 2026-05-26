import api from './api.js';

export const askAi = async (message) => (await api.post('/ai/chat', { message })).data.data;
