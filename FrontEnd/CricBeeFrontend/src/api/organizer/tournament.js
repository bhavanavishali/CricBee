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

export const cancelTournament = async (tournamentId, notificationData) => {
  const response = await api.post(`/tournaments/${tournamentId}/cancel`, notificationData);
  return response.data;
};

export const getWalletBalance = async () => {
  const response = await api.get('/tournaments/wallet/balance');
  return response.data;
};

export const getEnrolledClubs = async (tournamentId) => {
  const response = await api.get(`/tournaments/${tournamentId}/enrolled-clubs`);
  return response.data;
};

export const getClubDetails = async (clubId, tournamentId = null) => {
  const params = tournamentId ? { tournament_id: tournamentId } : {};
  const response = await api.get(`/tournaments/clubs/${clubId}/details`, { params });
  return response.data;
};

export const removeClubFromTournament = async (tournamentId, clubId) => {
  const response = await api.delete(`/tournaments/${tournamentId}/enrolled-clubs/${clubId}`);
  return response.data;
};

export const getFinanceReport = async (filterType, startDate = null, endDate = null) => {
  const response = await api.post('/tournaments/finance-report', {
    filter_type: filterType,
    start_date: startDate,
    end_date: endDate
  });
  return response.data;
};