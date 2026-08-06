import axios from 'axios'

// In production: set VITE_API_URL=https://api.yourdomain.com/api/v1
// In dev: defaults to localhost:8000
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Auth
export const authApi = {
  register: (data: { email: string; password: string; fullName: string; username?: string; phone?: string; businessName?: string; businessType?: string }) =>
    api.post('/auth/register', {
      email: data.email,
      password: data.password,
      full_name: data.fullName,
      business_name: data.businessName,
      business_type: data.businessType,
    }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  updateProfile: (data: object) => api.put('/auth/me', data),
}

// Billing / Subscriptions
export const billingApi = {
  getSubscription: () => api.get('/subscriptions/me'),
  createCheckout: (plan: 'basic' | 'pro' | 'business') =>
    api.post('/subscriptions/checkout', { plan }),
  openPortal: () => api.post('/subscriptions/portal'),
  devActivate: (plan: 'trial' | 'basic' | 'pro' | 'business') =>
    api.post('/subscriptions/dev-activate', { plan }),
}

// Campaigns
export const campaignsApi = {
  list: () => api.get('/campaigns/'),
  get: (id: number) => api.get(`/campaigns/${id}`),
  create: (data: object) => api.post('/campaigns/', data),
  update: (id: number, data: object) => api.put(`/campaigns/${id}`, data),
  delete: (id: number) => api.delete(`/campaigns/${id}`),
}

// Copy
export const copyApi = {
  generate: (campaignId: number, tone?: string) =>
    api.post('/copy/generate', { campaignId, tone }),
  improve: (id: number, feedback: string) =>
    api.post(`/copy/${id}/improve`, { feedback }),
  delete: (id: number) => api.delete(`/copy/${id}`),
}

// Audiences
export const audiencesApi = {
  generate: (campaign_id: number) =>
    api.post('/audiences/generate', { campaign_id }),
  list: (campaign_id: number) =>
    api.get(`/audiences/campaign/${campaign_id}`),
  create: (data: object) => api.post('/audiences/', data),
  delete: (id: number) => api.delete(`/audiences/${id}`),
}

// Assets
export const assetsApi = {
  platformSizes: () => api.get('/assets/platform-sizes'),
  upload: (file: File, campaignId?: number, sizeKeys?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (campaignId) form.append('campaign_id', String(campaignId))
    if (sizeKeys) form.append('size_keys', sizeKeys)
    return api.post('/assets/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  list: (campaign_id?: number) =>
    api.get('/assets/', { params: campaign_id ? { campaign_id } : {} }),
  delete: (id: number) => api.delete(`/assets/${id}`),
  export: (campaign_id: number) =>
    api.post(`/assets/export/${campaign_id}`, {}, { responseType: 'blob' }),
}
