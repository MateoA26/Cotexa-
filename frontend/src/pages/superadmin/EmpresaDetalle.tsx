import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { superadminApi } from '../../services/api'
import { ArrowLeft, Building2, Plus, Edit2, X, UserCheck, UserX } from 'lucide-react'

interface EmpresaConCount {
  id: number
  nombre: string
  slug: string
  email?: string | null
  activa: boolean
  createdAt: string
  _count: { usuarios: number; pedidos: number }
}

interface Usuario {
  id: number
  nombre: string
  email: string
  role: string
  activo: boolean
  empresaId: number
}

const ROLES = ['ADMIN', 'PRODUCCION']

const ic = 'w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500'
const lc = 'block text-xs font-medium text-gray-600 mb-1'

const roleBadge = (role: string) => {
  if (role === 'ADMIN') return 'bg-sky-50 text-sky-700'
  return 'bg-gray-100 text-gray-600'
}

export default function EmpresaDetalle() {
  const { id } = useParams<{ id: string }>()
  const empresaId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ nombre: '', email: '', password: '', role: 'ADMIN' })

  const [editUser, setEditUser] = useState<Usuario | null>(null)
  const [editForm, setEditForm] = useState({ nombre: '', email: '', password: '', role: '', activo: true })

  const { data: empresas = [] } = useQuery<EmpresaConCount[]>({
    queryKey: ['sa-empresas'],
    queryFn: () => superadminApi.getEmpresas().then(r => r.data),
  })

  const empresa = empresas.find(e => e.id === empresaId)

  const { data: usuarios = [], isLoading } = useQuery<Usuario[]>({
    queryKey: ['sa-empresa-usuarios', empresaId],
    queryFn: () => superadminApi.getEmpresaUsuarios(empresaId).then(r => r.data),
    enabled: !!empresaId,
  })

  const createMut = useMutation({
    mutationFn: (data: any) => superadminApi.createEmpresaUsuario(empresaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa-empresa-usuarios', empresaId] })
      queryClient.invalidateQueries({ queryKey: ['sa-empresas'] })
      setShowCreate(false)
      setCreateForm({ nombre: '', email: '', password: '', role: 'ADMIN' })
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: any }) =>
      superadminApi.updateEmpresaUsuario(empresaId, userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa-empresa-usuarios', empresaId] })
      setEditUser(null)
    },
  })

  const startEdit = (u: Usuario) => {
    setEditUser(u)
    setEditForm({ nombre: u.nombre, email: u.email, password: '', role: u.role, activo: u.activo })
  }

  const saveEdit = () => {
    if (!editUser) return
    const data: any = { nombre: editForm.nombre, email: editForm.email, role: editForm.role, activo: editForm.activo }
    if (editForm.password) data.password = editForm.password
    updateMut.mutate({ userId: editUser.id, data })
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/superadmin/empresas')}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={17} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
              <Building2 size={17} className="text-sky-500" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-gray-900 truncate">
                {empresa?.nombre ?? '...'}
              </h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                  {empresa?.slug}
                </span>
                {empresa?.email && (
                  <span className="text-xs text-gray-400 truncate">{empresa.email}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-10 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
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
              <div>
                <label className={lc}>Rol</label>
                <select value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))} className={ic}>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { setShowCreate(false); setCreateForm({ nombre: '', email: '', password: '', role: 'ADMIN' }) }}
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
              <h2 className="text-base font-semibold text-gray-900">Editar usuario</h2>
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

      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Usuarios</p>
          <p className="text-xs text-gray-400">{usuarios.length} usuario(s)</p>
        </div>
        {isLoading ? (
          <div className="p-10 text-center text-sm text-gray-400">Cargando...</div>
        ) : usuarios.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No hay usuarios en esta empresa</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                  {['Nombre', 'Email', 'Rol', 'Estado', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
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
