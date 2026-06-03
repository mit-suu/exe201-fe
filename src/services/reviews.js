import api from './api.js';

export const getProductReviews = async (productId) => (await api.get(`/reviews/product/${productId}`)).data.data;
export const getLenderReviews = async () => (await api.get('/reviews/lender')).data.data;
export const createReview = async (payload) => (await api.post('/reviews', payload)).data.data;
export const replyToReview = async (reviewId, content) => (await api.post(`/reviews/${reviewId}/reply`, { content })).data.data;
