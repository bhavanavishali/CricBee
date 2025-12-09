import api from '@/api';

export const getMyFixtures = async () => {
  const response = await api.get('/club-profile/fixtures');
  return response.data;
};

