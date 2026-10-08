import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cmf_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/login')) {
      original._retry = true
      try {
        const token = localStorage.getItem('cmf_refresh')
        if (!token) throw new Error('No refresh token')
        const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken: token })
        localStorage.setItem('cmf_token', res.data.token)
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
        original.headers['Authorization'] = `Bearer ${res.data.token}`
        return api(original)
      } catch {
        localStorage.removeItem('cmf_token')
        localStorage.removeItem('cmf_refresh')
        localStorage.removeItem('cmf_user')
        delete api.defaults.headers.common['Authorization']
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export function formatCurrency(amount) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

export function formatDate(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date))
}

export function formatDateTime(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}