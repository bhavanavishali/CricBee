import api from '@/api';

export const createTournament = async (tournamentData) => {
  const response = await api.post('/tournaments/create', tournamentData);
  return response.data;
};

export const verifyPayment = async (paymentData) => {
  const response = await api.post('/tournaments/verify-payment', paymentData);
  return response.data;
};

export const getPricingPlans = async () => {
  const response = await api.get('/tournaments/pricing-plans');
  return response.data;
};

export const getMyTournaments = async () => {
  const response = await api.get('/tournaments/');
  return response.data;
};

export const getMyTransactions = async () => {
  const response = await api.get('/tournaments/transactions');
  return response.data;
};

export const cancelTournament = async (tournamentId) => {
  const response = await api.post(`/tournaments/${tournamentId}/cancel`);
  return response.data;
};

export const getWalletBalance = async () => {
  const response = await api.get('/tournaments/wallet/balance');
  return response.data;
};