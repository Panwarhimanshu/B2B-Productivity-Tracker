import api from './axios';

export const directoryAPI = {
  getAll: () => api.get('/directory'),
  create: (data) => api.post('/directory', data),
  update: (id, data) => api.put(`/directory/${id}`, data),
  toggleVisibility: (id) => api.patch(`/directory/${id}/toggle`),
  delete: (id) => api.delete(`/directory/${id}`),
};
