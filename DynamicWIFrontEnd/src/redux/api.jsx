import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:5148'
})

// Attach token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('op_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

const isAuthEndpoint = (url = '') => {
  try {
    const path = new URL(url, api.defaults.baseURL).pathname.toLowerCase()
    return path.startsWith('/auth/login') || path.startsWith('/auth/register')
  } catch {
    return false
  }
}

// Auto-logout on 401 Unauthorized for protected endpoints only
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && !isAuthEndpoint(err.config?.url || '')) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      localStorage.removeItem('op_token')
      localStorage.removeItem('op_user')
      window.location.href = "/auth"
    }
    return Promise.reject(err)
  }
)
