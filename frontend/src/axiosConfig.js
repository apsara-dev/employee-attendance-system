
import axios from 'axios'
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
  axios.defaults.baseURL = API_BASE_URL

// Automatically handle expired access tokens
axios.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/api/token/') &&
      localStorage.getItem('refreshToken')
    ) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')

        const response = await axios.post(
  '/api/token/refresh/',
  { refresh: refreshToken }
)

        const newAccessToken = response.data.access

        localStorage.setItem('accessToken', newAccessToken)

        axios.defaults.headers.common['Authorization'] =
          `Bearer ${newAccessToken}`

        originalRequest.headers['Authorization'] =
          `Bearer ${newAccessToken}`

        return axios(originalRequest)

      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')

        delete axios.defaults.headers.common['Authorization']

        window.location.href = '/'

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default axios
