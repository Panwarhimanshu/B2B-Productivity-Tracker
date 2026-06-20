import api from './axios';

export const reportsAPI = {
  submit: (data) => api.post('/reports', data),
  getMy: (params) => api.get('/reports/my', { params }),
  getTeam: (params) => api.get('/reports/team', { params }),
  getAll: (params) => api.get('/reports/all', { params }),
  update: (id, data) => api.put(`/reports/${id}`, data),
  getAnalytics: (params) => api.get('/reports/analytics', { params }),
  getSummary: (params) => api.get('/reports/summary', { params }),
  export: (params) => api.get('/reports/export', { params, responseType: 'blob' }),
  getTemplate: () => api.get('/reports/template'),
};
