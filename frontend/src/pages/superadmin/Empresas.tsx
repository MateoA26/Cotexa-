import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { superadminApi } from '../../services/api'
import { Building2, Plus, Edit2, Users, X, Check } from 'lucide-react'

interface EmpresaConCount {
  id: number
  nombre: string
  slug: string
  email?: string | null
  activa: boolean
  createdAt: string
  _count: { usuarios: number; pedidos: number }
}

function slugify(str: string) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const ic = 'w-full h-10 px-3 border border-slate-200 rounded-[10px] text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white'
const lc = 'block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5'

export default function SuperAdminEmpresas() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ nombre: '', email: '', slug: '' })

  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ nombre: '', email: '' })

  const { data: empresas = [], isLoading } = useQuery<EmpresaConCount[]>({
    queryKey: ['sa-empresas'],
    queryFn: () => superadminApi.getEmpresas().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: (data: any) => superadminApi.createEmpresa(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa-empresas'] })
      setShowCreate(false)
      setCreateForm({ nombre: '', email: '', slug: '' })
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => superadminApi.updateEmpresa(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sa-empresas'] })
      setEditId(null)
    },
  })

  const startEdit = (e: EmpresaConCount) => {
    setEditId(e.id)
    setEditForm({ nombre: e.nombre, email: e.email || '' })
  }

  const setNombreCreate = (nombre: string) => {
    setCreateForm(p => ({ ...p, nombre, slug: slugify(nombre) }))
  }

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-7">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Empresas</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">{empresas.length} empresa{empresas.length !== 1 ? 's' : ''} registrada{empresas.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-9 px-3.5 bg-sky-500 hover:bg-sky-600 text-white rounded-[10px] text-[13px] font-semibold transition-colors shadow-[0_4px_12px_-4px_rgba(14,165,233,0.45)]">
          <Plus size={14} />
          Nueva empresa
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-bold text-slate-900">Nueva empresa</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={lc}>Nombre *</label>
                <input value={createForm.nombre} onChange={e => setNombreCreate(e.target.value)} placeholder="Empresa S.A." className={ic} />
              </div>
              <div>
                <label className={lc}>Email</label>
                <input type="email" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} placeholder="contacto@empresa.com" className={ic} />
              </div>
              <div>
                <label className={lc}>Slug (identificador único)</label>
                <input value={createForm.slug} onChange={e => setCreateForm(p => ({ ...p, slug: e.target.value }))} placeholder="empresa-sa" className={ic} />
                <p className="text-[11px] text-slate-400 mt-1">Se genera automáticamente desde el nombre. Debe ser único.</p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => { setShowCreate(false); setCreateForm({ nombre: '', email: '', slug: '' }) }}
                className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[10px] text-[13px] font-semibold transition-colors">
                Cancelar
              </button>
              <button onClick={() => createMut.mutate(createForm)}
                disabled={!createForm.nombre || !createForm.slug || createMut.isPending}
                className="flex-1 h-10 bg-sky-500 hover:bg-sky-600 text-white rounded-[10px] text-[13px] font-semibold transition-colors disabled:opacity-40 shadow-[0_4px_12px_-4px_rgba(14,165,233,0.45)]">
                {createMut.isPending ? 'Creando...' : 'Crear empresa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-[13px] text-slate-400">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {empresas.map(empresa => (
            <div key={empresa.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              {editId === empresa.id ? (
                <div className="space-y-3">
                  <div>
                    <label className={lc}>Nombre</label>
                    <input value={editForm.nombre} onChange={e => setEditForm(p => ({ ...p, nombre: e.target.value }))} className={ic} />
                  </div>
                  <div>
                    <label className={lc}>Email</label>
                    <input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className={ic} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => updateMut.mutate({ id: empresa.id, data: editForm })}
                      disabled={updateMut.isPending}
                      className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors disabled:opacity-40">
                      <Check size={12} />
                      Guardar
                    </button>
                    <button onClick={() => setEditId(null)}
                      className="flex items-center gap-1.5 h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[8px] text-[12px] font-semibold transition-colors">
                      <X size={12} />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                        <Building2 size={16} className="text-sky-500" />
                      </div>
                      <p className="text-[14px] font-bold text-slate-900 truncate">{empresa.nombre}</p>
                    </div>
                    <button onClick={() => startEdit(empresa)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors flex-shrink-0">
                      <Edit2 size={13} />
                    </button>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <p className="text-[12px] text-slate-400">
                      <span className="text-slate-500 font-medium">Slug: </span>
                      <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded text-slate-600 text-[11px]">{empresa.slug}</span>
                    </p>
                    {empresa.email && (
                      <p className="text-[12px] text-slate-500 truncate">{empresa.email}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 py-3 border-t border-slate-100 mb-3">
                    <div className="text-center">
                      <p className="text-[18px] font-bold text-slate-900 font-mono">{empresa._count.usuarios}</p>
                      <p className="text-[11px] text-slate-400">usuarios</p>
                    </div>
                    <div className="w-px h-8 bg-slate-100" />
                    <div className="text-center">
                      <p className="text-[18px] font-bold text-slate-900 font-mono">{empresa._count.pedidos}</p>
                      <p className="text-[11px] text-slate-400">pedidos</p>
                    </div>
                  </div>

                  <button onClick={() => navigate(`/superadmin/empresas/${empresa.id}`)}
                    className="w-full flex items-center justify-center gap-1.5 h-8 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[8px] text-[12px] font-semibold transition-colors">
                    <Users size={12} />
                    Ver usuarios
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
