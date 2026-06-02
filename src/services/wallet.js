import api from './api.js';

export const getBalance = async () => (await api.get('/wallet/balance')).data.data;
export const updateBankAccount = async (payload) => (await api.post('/wallet/bank-account', payload)).data.data;
export const getTransactions = async (params = {}) => (await api.get('/wallet/transactions', { params })).data;
export const depositWallet = async (amount) => (await api.post('/wallet/deposit', { amount })).data;
export const withdrawWallet = async (amount) => (await api.post('/wallet/withdraw', { amount })).data;
