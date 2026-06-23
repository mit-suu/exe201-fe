import api from './api.js';

export const getContractByOrder = async (orderId) => {
  try {
    return (await api.get(`/contracts/order/${orderId}`)).data.data;
  } catch (e) {
    return null;
  }
};

export const signContract = async (orderId) => {
  try {
    return (await api.post(`/contracts/order/${orderId}/sign`)).data;
  } catch (e) {
    throw e;
  }
};
