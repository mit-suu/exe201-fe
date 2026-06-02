import api from './api.js';

export const getMyConversation = async () => (await api.get('/chats/me')).data.data;
export const getConversations = async () => (await api.get('/chats')).data.data;
export const getMessages = async (conversationId) => (await api.get(`/chats/${conversationId}/messages`)).data.data;
export const sendMessage = async (conversationId, text) => (await api.post(`/chats/${conversationId}/messages`, { text })).data.data;
