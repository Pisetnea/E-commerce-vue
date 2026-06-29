import axios from 'axios'

const baseURL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

const http = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: import.meta.env.VITE_API_WITH_CREDENTIALS === 'true',
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
    }

    if (!error.response) {
      error.message = `Cannot connect to API at ${baseURL}. Check that Vite is running and your backend is available.`
    }

    return Promise.reject(error)
  },
)

export default http
