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

const ic = 'w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500'
const lc = 'block text-xs font-medium text-gray-600 mb-1'

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
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Empresas</h1>
          <p className="text-sm text-gray-400 mt-0.5">{empresas.length} empresa(s) registrada(s)</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-10 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          Nueva empresa
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Nueva empresa</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors">
                <X size={17} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={lc}>Nombre *</label>
                <input
                  value={createForm.nombre}
                  onChange={e => setNombreCreate(e.target.value)}
                  placeholder="Empresa S.A."
                  className={ic}
                />
              </div>
              <div>
                <label className={lc}>Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="contacto@empresa.com"
                  className={ic}
                />
              </div>
              <div>
                <label className={lc}>Slug (identificador único)</label>
                <input
                  value={createForm.slug}
                  onChange={e => setCreateForm(p => ({ ...p, slug: e.target.value }))}
                  placeholder="empresa-sa"
                  className={ic}
                />
                <p className="text-xs text-gray-400 mt-1">Se genera automáticamente desde el nombre. Debe ser único.</p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { setShowCreate(false); setCreateForm({ nombre: '', email: '', slug: '' }) }}
                className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => createMut.mutate(createForm)}
                disabled={!createForm.nombre || !createForm.slug || createMut.isPending}
                className="flex-1 h-10 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
              >
                {createMut.isPending ? 'Creando...' : 'Crear empresa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="p-10 text-center text-sm text-gray-400">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {empresas.map(empresa => (
            <div key={empresa.id} className="bg-white rounded-xl border border-gray-200 p-5">
              {editId === empresa.id ? (
                <div className="space-y-3">
                  <div>
                    <label className={lc}>Nombre</label>
                    <input
                      value={editForm.nombre}
                      onChange={e => setEditForm(p => ({ ...p, nombre: e.target.value }))}
                      className={ic}
                    />
                  </div>
                  <div>
                    <label className={lc}>Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                      className={ic}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => updateMut.mutate({ id: empresa.id, data: editForm })}
                      disabled={updateMut.isPending}
                      className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                    >
                      <Check size={13} />
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="flex items-center gap-1.5 h-8 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      <X size={13} />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                          <Building2 size={15} className="text-sky-500" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 truncate">{empresa.nombre}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => startEdit(empresa)}
                      className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <p className="text-xs text-gray-400">
                      <span className="text-gray-500 font-medium">Slug:</span>{' '}
                      <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded text-gray-600">{empresa.slug}</span>
                    </p>
                    {empresa.email && (
                      <p className="text-xs text-gray-500 truncate">{empresa.email}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 py-3 border-t border-gray-100 mb-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{empresa._count.usuarios}</p>
                      <p className="text-xs text-gray-400">usuarios</p>
                    </div>
                    <div className="w-px h-8 bg-gray-100" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{empresa._count.pedidos}</p>
                      <p className="text-xs text-gray-400">pedidos</p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/superadmin/empresas/${empresa.id}`)}
                    className="w-full flex items-center justify-center gap-1.5 h-8 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Users size={13} />
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
