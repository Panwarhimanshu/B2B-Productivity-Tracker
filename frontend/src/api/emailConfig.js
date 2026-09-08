import api from './axios';

export const emailConfigAPI = {
  get: () => api.get('/email-config'),
  update: (data) => api.put('/email-config', data),
  getLogs: (params) => api.get('/email-config/logs', { params }),
  sendTest: () => api.post('/email-config/test'),
};
