import api from './axios';

export const zonesAPI = {
  getAll: () => api.get('/zones'),
  create: (data) => api.post('/zones', data),
  update: (id, data) => api.put(`/zones/${id}`, data),
  delete: (id) => api.delete(`/zones/${id}`),
};
