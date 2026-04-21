import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { superadminApi } from '../../services/api'
import { Plus, Edit2, X, Check, UserCheck, UserX } from 'lucide-react'

interface EmpresaRef { id: number; nombre: string }

interface UsuarioConEmpresa {
  id: number
  nombre: string
  email: string
  role: string
  activo: boolean
  empresaId: number | null
  empresa: EmpresaRef | null
}

interface EmpresaConCount {
  id: number
  nombre: string
}

const ROLES = ['ADMIN', 'PRODUCCION']

const ic = 'w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500'
const lc = 'block text-xs font-medium text-gray-600 mb-1'

const roleBadge = (role: string) => {
  if (role === 'SUPERADMIN') return 'bg-purple-50 text-purple-700'
  if (role === 'ADMIN') return 'bg-sky-50 text-sky-700'
  return 'bg-gray-100 text-gray-600'
}

export default function SuperAdminUsuarios() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const filterEmpresaId = searchParams.get('empresaId')

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ nombre: '', email: '', password: '', role: 'ADMIN', empresaId: '' })

  const [editUser, setEditUser] = useState<UsuarioConEmpresa | null>(null)
  const [editForm, setEditForm] = useState({ nombre: '', email: '', password: '', role: '', activo: true })

  const { data: usuarios = [], isLoading } = useQuery<UsuarioConEmpresa[]>({
    queryKey: ['sa-usuarios'],
    queryFn: () => superadminApi.getUsuarios().then(r => r.data),
  })

  const { data: empresas = [] } = useQuery<EmpresaConCount[]>({
    queryKey: ['sa-empresas'],
    queryFn: () => superadminApi.getEmpresas().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (data: any) => superadminApi.createUsuario(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa-usuarios'] })
      setShowCreate(false)
      setCreateForm({ nombre: '', email: '', password: '', role: 'ADMIN', empresaId: '' })
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => superadminApi.updateUsuario(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa-usuarios'] })
      setEditUser(null)
    },
  })

  const startEdit = (u: UsuarioConEmpresa) => {
    setEditUser(u)
    setEditForm({ nombre: u.nombre, email: u.email, password: '', role: u.role, activo: u.activo })
  }

  const saveEdit = () => {
    if (!editUser) return
    const data: any = { nombre: editForm.nombre, email: editForm.email, role: editForm.role, activo: editForm.activo }
    if (editForm.password) data.password = editForm.password
    updateMut.mutate({ id: editUser.id, data })
  }

  const filtered = filterEmpresaId
    ? usuarios.filter(u => String(u.empresaId) === filterEmpresaId)
    : usuarios

  const filterEmpresaNombre = filterEmpresaId
    ? empresas.find(e => String(e.id) === filterEmpresaId)?.nombre
    : null

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {filtered.length} usuario(s)
            {filterEmpresaNombre && (
              <span className="ml-1">· filtrando por <span className="font-medium text-gray-600">{filterEmpresaNombre}</span></span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-10 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          Nuevo usuario
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Nuevo usuario</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors">
                <X size={17} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={lc}>Nombre *</label>
                <input value={createForm.nombre} onChange={e => setCreateForm(p => ({ ...p, nombre: e.target.value }))} className={ic} />
              </div>
              <div>
                <label className={lc}>Email *</label>
                <input type="email" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} className={ic} />
              </div>
              <div>
                <label className={lc}>Contraseña *</label>
                <input type="password" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} className={ic} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lc}>Rol</label>
                  <select value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))} className={ic}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lc}>Empresa</label>
                  <select value={createForm.empresaId} onChange={e => setCreateForm(p => ({ ...p, empresaId: e.target.value }))} className={ic}>
                    <option value="">Sin empresa</option>
                    {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => createMut.mutate(createForm)}
                disabled={!createForm.nombre || !createForm.email || !createForm.password || createMut.isPending}
                className="flex-1 h-10 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
              >
                {createMut.isPending ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Editar usuario</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editUser.empresa?.nombre || 'Sin empresa'}</p>
              </div>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors">
                <X size={17} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={lc}>Nombre</label>
                <input value={editForm.nombre} onChange={e => setEditForm(p => ({ ...p, nombre: e.target.value }))} className={ic} />
              </div>
              <div>
                <label className={lc}>Email</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className={ic} />
              </div>
              <div>
                <label className={lc}>Nueva contraseña <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span></label>
                <input type="password" value={editForm.password} onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" className={ic} />
              </div>
              <div>
                <label className={lc}>Rol</label>
                <select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))} className={ic}>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Cuenta activa</p>
                  <p className="text-xs text-gray-400">Las cuentas inactivas no pueden iniciar sesión</p>
                </div>
                <button
                  onClick={() => setEditForm(p => ({ ...p, activo: !p.activo }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${editForm.activo ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editForm.activo ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setEditUser(null)}
                className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={updateMut.isPending}
                className="flex-1 h-10 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
              >
                {updateMut.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            {filterEmpresaId ? 'No hay usuarios en esta empresa' : 'No hay usuarios'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                  {['Nombre', 'Email', 'Rol', 'Empresa', 'Estado', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-gray-900">{u.nombre}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {u.empresa?.nombre || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.activo ? (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                          <UserCheck size={13} />
                          Activo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                          <UserX size={13} />
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => startEdit(u)}
                        className="flex items-center gap-1.5 h-7 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Edit2 size={12} />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
