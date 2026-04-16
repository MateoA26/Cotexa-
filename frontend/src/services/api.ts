import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:3001/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  seed: () => api.post('/auth/seed')
}

export const dashboardApi = {
  get: () => api.get('/dashboard')
}

export const pedidosApi = {
  getAll: (estado?: string) => api.get('/pedidos', { params: estado ? { estado } : {} }),
  getOne: (id: number) => api.get(`/pedidos/${id}`),
  create: (data: any) => api.post('/pedidos', data),
  update: (id: number, data: any) => api.patch(`/pedidos/${id}`, data)
}

export const clientesApi = {
  getAll: () => api.get('/clientes'),
  create: (data: any) => api.post('/clientes', data),
  update: (id: number, data: any) => api.patch(`/clientes/${id}`, data)
}

export const camposApi = {
  getAll: () => api.get('/campos'),
  create: (data: any) => api.post('/campos', data),
  update: (id: number, data: any) => api.patch(`/campos/${id}`, data),
  delete: (id: number) => api.delete(`/campos/${id}`)
}

export default api
