import api from './axios';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  refresh: (data) => api.post('/auth/refresh', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateAvatar: (avatar) => api.patch('/auth/avatar', { avatar }),
  removeAvatar: () => api.delete('/auth/avatar'),
};
