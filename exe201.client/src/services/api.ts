import api from '../api/axios'

export default api

export function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as { response?: { data?: unknown } }).response
    if (typeof response?.data === 'string') return response.data
  }
  return 'Khong the tai du lieu. Vui long thu lai.'
}
