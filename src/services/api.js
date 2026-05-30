import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redirect to login on 401 — but NOT for auth endpoints (wrong password shouldn't redirect)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || ''
    const isAuthEndpoint = url.startsWith('/auth/')
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token')
      localStorage.removeItem('owner')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const authApi = {
  // 2-step signup: request sends OTP to email+phone, verify creates the account
  signupRequest: (data) => api.post('/auth/signup/request', data),
  signupVerify: (data) => api.post('/auth/signup/verify', data),
  // Legacy single-step signup (kept for internal use / admin scripts)
  signup: (data) => api.post('/auth/signup', data),
  loginRequest: (data) => api.post('/auth/login/request', data),
  loginVerify: (data) => api.post('/auth/login/verify', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  sendOtp: (data) => api.post('/auth/send-otp', data),
  updateEmail: (data) => api.patch('/auth/email', data),
  updatePhone: (data) => api.patch('/auth/phone', data),
  updatePassword: (data) => api.patch('/auth/password', data),
}

// Menu
export const menuApi = {
  list: () => api.get('/menu/'),
  create: (data) => api.post('/menu/', data),
  update: (id, data) => api.put(`/menu/${id}`, data),
  delete: (id) => api.delete(`/menu/${id}`),
  seed: () => api.post('/menu/seed'),
}

// Orders
export const ordersApi = {
  list: (params = {}) => api.get('/orders/', { params }),
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders/', data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  cancel: (id) => api.delete(`/orders/${id}`),
}

// Knowledge base
export const knowledgeApi = {
  upload: (formData) =>
    api.post('/knowledge/upload', formData, {
      headers: { 'Content-Type': null },  // null removes the default 'application/json' in axios v1, letting browser set multipart boundary
      timeout: 60000,
    }),
  listDocuments: () => api.get('/knowledge/documents'),
  deleteDocument: (id) => api.delete(`/knowledge/documents/${id}`),
  search: (query) => api.get('/knowledge/search', { params: { query } }),
  syncMenu: () => api.post('/knowledge/sync-menu'),
}

// Dashboard
export const dashboardApi = {
  stats:  (days = 0) => api.get('/dashboard/stats', { params: days > 0 ? { days } : {} }),
  calls:  (days, hours = 0) => api.get('/dashboard/calls', { params: hours > 0 ? { hours } : { days } }),
  report: (period) => api.get('/dashboard/report', { params: { period } }),
}

// Restaurant
export const restaurantApi = {
  get: () => api.get('/restaurant/'),
  update: (data) => api.put('/restaurant/', data),
}

// Subscription
export const subscriptionApi = {
  getPlans: () => api.get('/subscription/plans'),
  getCurrent: () => api.get('/subscription/current'),
  changePlan: (plan) => api.post('/subscription/change-plan', { plan }),
  createCheckout: (plan, otp_code) => api.post('/subscription/create-checkout', { plan, otp_code }),
  createPortal: () => api.post('/subscription/create-portal'),
  cancel: () => api.post('/subscription/cancel'),
  sendPlanOtp: (plan) => api.post('/subscription/send-plan-otp', { plan }),
}

// Paid extras / addons for POS orders
export const addonsApi = {
  list: () => api.get('/addons/'),
  create: (data) => api.post('/addons/', data),
  update: (id, data) => api.put(`/addons/${id}`, data),
  delete: (id) => api.delete(`/addons/${id}`),
  seedDefaults: () => api.post('/addons/seed'),
}

// Locations (owner-only)
export const locationsApi = {
  list: () => api.get('/locations/'),
  create: (data) => api.post('/locations/', data),
  update: (id, data) => api.put(`/locations/${id}`, data),
  delete: (id) => api.delete(`/locations/${id}`),
  analytics: (days = 30) => api.get('/locations/analytics/overview', { params: { days } }),
  seed: () => api.post('/locations/seed'),
  seedAnalytics: () => api.post('/locations/seed-analytics'),
}

// Staff management (owner-only)
export const staffApi = {
  list: (restaurantId) => api.get('/staff/', { params: restaurantId ? { restaurant_id: restaurantId } : {} }),
  create: (data) => api.post('/staff/', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`),
  staffLogin: (email, password) => api.post('/auth/staff/login', { email, password }),
}

// Gmail OAuth2
export const gmailApi = {
  status:     () => api.get('/gmail/status'),
  authorize:  () => api.get('/gmail/authorize'),
  test:       () => api.post('/gmail/test'),
  disconnect: () => api.delete('/gmail/disconnect'),
}

// Manager analytics (owner + manager access — scoped to assigned restaurants)
export const managerApi = {
  overview:       (days = 30) => api.get('/manager/analytics/overview', { params: { days } }),
  timeseries:     (days = 30) => api.get('/manager/analytics/timeseries', { params: { days } }),
  expenses:       (days = 30) => api.get('/manager/analytics/expenses', { params: { days } }),
  ratings:        () => api.get('/manager/analytics/ratings'),
  refreshRatings: () => api.post('/manager/analytics/ratings/refresh'),
  getAssignments:    (staffId) => api.get(`/staff/${staffId}/assignments`),
  updateAssignments: (staffId, restaurantIds) => api.put(`/staff/${staffId}/assignments`, { restaurant_ids: restaurantIds }),
}

export default api
