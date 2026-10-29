import { http } from './http'

function withQuery(path, params = {}) {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value)).toString()
  return query ? `${path}?${query}` : path
}

export const contactsApi = {
  list: (filters) => http.get(withQuery('/contacts', filters)),
  get: (id) => http.get(`/contacts/${id}`),
  create: (data) => http.post('/contacts', data),
  update: (id, data) => http.put(`/contacts/${id}`, data),
  remove: (id) => http.delete(`/contacts/${id}`),
  promote: (id, data) => http.post(`/contacts/${id}/promote`, data),
}

export const interactionsApi = {
  listForContact: (contactId) => http.get(`/contacts/${contactId}/interactions`),
  create: (contactId, data) => http.post(`/contacts/${contactId}/interactions`, data),
  update: (id, data) => http.put(`/interactions/${id}`, data),
  remove: (id) => http.delete(`/interactions/${id}`),
}

export const servicesApi = {
  listForContact: (contactId) => http.get(`/contacts/${contactId}/services`),
  create: (contactId, data) => http.post(`/contacts/${contactId}/services`, data),
  update: (id, data) => http.put(`/services/${id}`, data),
  remove: (id) => http.delete(`/services/${id}`),
  generateCharge: (serviceId, data) => http.post(`/services/${serviceId}/generate-charge`, data),
}

export const paymentsApi = {
  listAll: () => http.get('/payments'),
  listUpcoming: (days = 7) => http.get(withQuery('/payments/upcoming', { days })),
  listForContact: (contactId) => http.get(`/contacts/${contactId}/payments`),
  create: (contactId, data) => http.post(`/contacts/${contactId}/payments`, data),
  update: (id, data) => http.put(`/payments/${id}`, data),
  remove: (id) => http.delete(`/payments/${id}`),
  markPaid: (id, formData) => http.post(`/payments/${id}/mark-paid`, formData),
  uploadProof: (id, formData) => http.post(`/payments/${id}/proof`, formData),
}

export const tasksApi = {
  list: (filters) => http.get(withQuery('/tasks', filters)),
  get: (id) => http.get(`/tasks/${id}`),
  listForContact: (contactId) => http.get(`/contacts/${contactId}/tasks`),
  create: (data) => http.post('/tasks', data),
  update: (id, data) => http.put(`/tasks/${id}`, data),
  remove: (id, scope) => http.delete(withQuery(`/tasks/${id}`, { scope })),
}
