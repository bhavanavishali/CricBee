import api from '@/api'

export const getClubManagerTransactions = async () => {
  try {
    const response = await api.get('/club-profile/transactions');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error("Get transactions error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Failed to fetch transactions",
      data: { transactions: [], total: 0 }
    };
  }
};

export const getClubManagerWalletBalance = async () => {
  try {
    const response = await api.get('/club-profile/wallet/balance');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error("Get wallet balance error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Failed to fetch wallet balance",
      data: { balance: 0, total_transactions: 0 }
    };
  }
};
