import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { superadminApi } from '../../services/api'
import { Plus, Edit2, X, UserCheck, UserX } from 'lucide-react'

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

const ic = 'w-full h-10 px-3 border border-slate-200 rounded-[10px] text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white'
const lc = 'block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5'

const roleBadge = (role: string) => {
  if (role === 'SUPERADMIN') return 'bg-purple-50 text-purple-600'
  if (role === 'ADMIN') return 'bg-sky-50 text-sky-600'
  return 'bg-slate-100 text-slate-600'
}

export default function SuperAdminUsuarios() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const filterEmpresaId = searchParams.get('empresaId')

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ nombre: '', email: '', password: '', role: 'ADMIN', empresaId: '' })

  const [editUser, setEditUser] = useState<UsuarioConEmpresa | null>(null)
  const [editForm, setEditForm] = useState({ nombre: '', email: '', password: '', role: '', activo: true })

  const [roleFiltro, setRoleFiltro] = useState('')
  const [empresaFiltro, setEmpresaFiltro] = useState(filterEmpresaId || '')

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

  const filtered = usuarios.filter(u =>
    (!empresaFiltro || String(u.empresaId) === empresaFiltro) &&
    (!roleFiltro || u.role === roleFiltro)
  )

  const filterEmpresaNombre = empresaFiltro
    ? empresas.find(e => String(e.id) === empresaFiltro)?.nombre
    : null

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-7">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Usuarios</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">
            {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
            {filterEmpresaNombre && (
              <span className="ml-1">· filtrando por <span className="font-semibold text-slate-600">{filterEmpresaNombre}</span></span>
            )}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-9 px-3.5 bg-sky-500 hover:bg-sky-600 text-white rounded-[10px] text-[13px] font-semibold transition-colors shadow-[0_4px_12px_-4px_rgba(14,165,233,0.45)]">
          <Plus size={14} />
          Nuevo usuario
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex flex-col gap-2.5 mb-5">
        {empresas.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {[{ id: '', nombre: 'Todas las empresas' }, ...empresas].map(e => (
              <button key={e.id} onClick={() => setEmpresaFiltro(String(e.id))}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap ${
                  empresaFiltro === String(e.id)
                    ? 'bg-sky-500 text-white shadow-[0_2px_8px_-2px_rgba(14,165,233,0.5)]'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {e.nombre}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-1.5 flex-wrap">
          {['', 'ADMIN', 'PRODUCCION', 'SUPERADMIN'].map(r => (
            <button key={r} onClick={() => setRoleFiltro(r)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap ${
                roleFiltro === r
                  ? 'bg-sky-500 text-white shadow-[0_2px_8px_-2px_rgba(14,165,233,0.5)]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {r || 'Todos los roles'}
            </button>
          ))}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-bold text-slate-900">Nuevo usuario</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X size={16} />
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
              <button onClick={() => setShowCreate(false)}
                className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[10px] text-[13px] font-semibold transition-colors">
                Cancelar
              </button>
              <button onClick={() => createMut.mutate(createForm)}
                disabled={!createForm.nombre || !createForm.email || !createForm.password || createMut.isPending}
                className="flex-1 h-10 bg-sky-500 hover:bg-sky-600 text-white rounded-[10px] text-[13px] font-semibold transition-colors disabled:opacity-40 shadow-[0_4px_12px_-4px_rgba(14,165,233,0.45)]">
                {createMut.isPending ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Editar usuario</h2>
                <p className="text-[12px] text-slate-400 mt-0.5">{editUser.empresa?.nombre || 'Sin empresa'}</p>
              </div>
              <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X size={16} />
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
                <label className={lc}>Nueva contraseña <span className="text-slate-400 font-normal normal-case tracking-normal">(dejar vacío para no cambiar)</span></label>
                <input type="password" value={editForm.password} onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" className={ic} />
              </div>
              <div>
                <label className={lc}>Rol</label>
                <select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))} className={ic}>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-[13px] font-semibold text-slate-900">Cuenta activa</p>
                  <p className="text-[11px] text-slate-400">Las cuentas inactivas no pueden iniciar sesión</p>
                </div>
                <button onClick={() => setEditForm(p => ({ ...p, activo: !p.activo }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${editForm.activo ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editForm.activo ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditUser(null)}
                className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[10px] text-[13px] font-semibold transition-colors">
                Cancelar
              </button>
              <button onClick={saveEdit} disabled={updateMut.isPending}
                className="flex-1 h-10 bg-sky-500 hover:bg-sky-600 text-white rounded-[10px] text-[13px] font-semibold transition-colors disabled:opacity-40 shadow-[0_4px_12px_-4px_rgba(14,165,233,0.45)]">
                {updateMut.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-[13px] text-slate-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[13px] text-slate-400">
            {filterEmpresaId ? 'No hay usuarios en esta empresa' : 'No hay usuarios'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Nombre', 'Email', 'Rol', 'Empresa', 'Estado', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-semibold text-slate-900">{u.nombre}</p>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-slate-500">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-[3px] rounded-full ${roleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-slate-500">
                      {u.empresa?.nombre || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.activo ? (
                        <span className="flex items-center gap-1.5 text-[12px] text-emerald-600 font-medium">
                          <UserCheck size={13} />
                          Activo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[12px] text-slate-400 font-medium">
                          <UserX size={13} />
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => startEdit(u)}
                        className="flex items-center gap-1.5 h-7 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[6px] text-[12px] font-semibold transition-colors">
                        <Edit2 size={11} />
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
