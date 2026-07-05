import axios from 'axios'
const api = axios.create({ 
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`,
  withCredentials: true
})
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
  logout: () => api.post('/auth/logout'),
  seed: () => api.post('/auth/seed'),
  cambiarPassword: (passwordActual: string, passwordNuevo: string) =>
    api.patch('/auth/cambiar-password', { passwordActual, passwordNuevo }),
  actualizarUsuario: (data: { nombre?: string; email?: string }) =>
    api.patch('/auth/usuario/me', data),
}
export const empresaApi = {
  get: () => api.get('/auth/empresa'),
  update: (data: any) => api.patch('/auth/empresa/me', data),
}
export const dashboardApi = {
  get: () => api.get('/dashboard')
}
export const pedidosApi = {
  getAll: (params?: { estado?: string; clienteId?: number }) => api.get('/pedidos', { params }),
  getOne: (id: number) => api.get(`/pedidos/${id}`),
  create: (data: any) => api.post('/pedidos', data),
  update: (id: number, data: any) => api.patch(`/pedidos/${id}`, data)
}
export const clientesApi = {
  getAll: () => api.get('/clientes'),
  create: (data: any) => api.post('/clientes', data),
  update: (id: number, data: any) => api.patch(`/clientes/${id}`, data),
  delete: (id: number) => api.delete(`/clientes/${id}`),
}
export const notificacionesApi = {
  getAll: () => api.get('/notificaciones'),
  leer: (id: number) => api.patch(`/notificaciones/${id}/leer`),
  leerTodas: () => api.patch('/notificaciones/leer-todas'),
}
export const superadminApi = {
  getEmpresas: () => api.get('/superadmin/empresas'),
  createEmpresa: (data: any) => api.post('/superadmin/empresas', data),
  updateEmpresa: (id: number, data: any) => api.patch(`/superadmin/empresas/${id}`, data),
  getUsuarios: () => api.get('/superadmin/usuarios'),
  createUsuario: (data: any) => api.post('/superadmin/usuarios', data),
  updateUsuario: (id: number, data: any) => api.patch(`/superadmin/usuarios/${id}`, data),
  getEmpresaUsuarios: (empresaId: number) => api.get(`/superadmin/empresas/${empresaId}/usuarios`),
  createEmpresaUsuario: (empresaId: number, data: any) => api.post(`/superadmin/empresas/${empresaId}/usuarios`, data),
  updateEmpresaUsuario: (empresaId: number, userId: number, data: any) => api.patch(`/superadmin/empresas/${empresaId}/usuarios/${userId}`, data),
}
export const preciosApi = {
  getConfig: () => api.get('/precios/config'),
  updateConfig: (data: { precioBase: number }) => api.patch('/precios/config', data),
  getMateriales: () => api.get('/precios/materiales'),
  createMaterial: (data: { nombre: string; precioUnitario: number }) => api.post('/precios/materiales', data),
  updateMaterial: (id: number, data: any) => api.patch(`/precios/materiales/${id}`, data),
  deleteMaterial: (id: number) => api.delete(`/precios/materiales/${id}`),
  getTramos: () => api.get('/precios/tramos'),
  createTramo: (data: { desdeUnidades: number; porcentaje: number }) => api.post('/precios/tramos', data),
  updateTramo: (id: number, data: any) => api.patch(`/precios/tramos/${id}`, data),
  deleteTramo: (id: number) => api.delete(`/precios/tramos/${id}`),
}
export const camposApi = {
  getAll: () => api.get('/campos'),
  create: (data: any) => api.post('/campos', data),
  update: (id: number, data: any) => api.patch(`/campos/${id}`, data),
  delete: (id: number) => api.delete(`/campos/${id}`)
}
export const archivosApi = {
  getAll: (pedidoId: number) => api.get(`/archivos/${pedidoId}`),
  upload: (pedidoId: number, file: File) => {
    const form = new FormData()
    form.append('archivo', file)
    return api.post(`/archivos/${pedidoId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  delete: (archivoId: number) => api.delete(`/archivos/${archivoId}`),
}
export default api
