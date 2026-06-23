import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gvn_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gvn_token')
      window.location.href = '/login'
    }
    return Promise.reject(err.response?.data || err)
  }
)

export const authApi = {
  login:   (data) => api.post('/auth/login', data),
  me:      ()     => api.get('/auth/me'),
  logout:  ()     => api.post('/auth/logout'),
}

export const leadsApi = {
  getAll:  (params) => api.get('/leads', { params }),
  getOne:  (id)     => api.get(`/leads/${id}`),
  create:  (data)   => api.post('/leads', data),
  update:  (id, d)  => api.put(`/leads/${id}`, d),
  delete:  (id)     => api.delete(`/leads/${id}`),
  followups:(id)    => api.get(`/leads/${id}/followups`),
  addFollowup:(id,d)=> api.post(`/leads/${id}/followups`, d),
}

export const inventoryApi = {
  getAll:  (params) => api.get('/inventory', { params }),
  getOne:  (id)     => api.get(`/inventory/${id}`),
  create:  (data)   => api.post('/inventory', data),
  update:  (id, d)  => api.put(`/inventory/${id}`, d),
  delete:  (id)     => api.delete(`/inventory/${id}`),
}

export const siteVisitsApi = {
  getAll:  (params) => api.get('/site-visits', { params }),
  getOne:  (id)     => api.get(`/site-visits/${id}`),
  create:  (data)   => api.post('/site-visits', data),
  update:  (id, d)  => api.put(`/site-visits/${id}`, d),
}

export const bookingsApi = {
  getAll:  (params) => api.get('/bookings', { params }),
  getOne:  (id)     => api.get(`/bookings/${id}`),
  create:  (data)   => api.post('/bookings', data),
  update:  (id, d)  => api.put(`/bookings/${id}`, d),
}

export const paymentsApi = {
  getAll:  (params) => api.get('/payments', { params }),
  getOne:  (id)     => api.get(`/payments/${id}`),
  create:  (data)   => api.post('/payments', data),
  update:  (id, d)  => api.put(`/payments/${id}`, d),
  receipt: (id)     => api.get(`/payments/${id}/receipt`, { responseType:'blob' }),
}

export const customersApi = {
  getAll:  (params) => api.get('/customers', { params }),
  getOne:  (id)     => api.get(`/customers/${id}`),
  create:  (data)   => api.post('/customers', data),
  update:  (id, d)  => api.put(`/customers/${id}`, d),
}

export const brokersApi = {
  getAll:  (params) => api.get('/brokers', { params }),
  getOne:  (id)     => api.get(`/brokers/${id}`),
  create:  (data)   => api.post('/brokers', data),
  update:  (id, d)  => api.put(`/brokers/${id}`, d),
}

export const tasksApi = {
  getAll:  (params) => api.get('/tasks', { params }),
  create:  (data)   => api.post('/tasks', data),
  update:  (id, d)  => api.put(`/tasks/${id}`, d),
  delete:  (id)     => api.delete(`/tasks/${id}`),
}

export const usersApi = {
  getAll:  ()       => api.get('/users'),
  create:  (data)   => api.post('/users', data),
  update:  (id, d)  => api.put(`/users/${id}`, d),
}

export const reportsApi = {
  dashboard: () => api.get('/reports/dashboard'),
  monthlyTrend: () => api.get('/reports/monthly'),
  leadSources: () => api.get('/reports/lead-sources'),
  leadStatuses: () => api.get('/reports/lead-statuses'),
  salesPerformance: () => api.get('/reports/sales'),
  inventorySummary: () => api.get('/reports/inventory'),
  paymentOutstanding: () => api.get('/reports/outstanding'),
  brokerPerformance: () => api.get('/reports/brokers'),
  payments: (params) => api.get('/reports/payments', { params }),
  export: (type, params) =>
    api.get(`/reports/export/${type}`, {
      params,
      responseType: 'blob',
    }),
}
export default api
