import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { camposApi, empresaApi } from '../services/api'
import { CampoCustom } from '../types'
import { useAuth } from '../context/AuthContext'
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'

const TIPOS_CAMPO = ['BOOLEAN', 'SELECT', 'NUMBER'] as const
const IMPACTO_TIPOS = ['PORCENTAJE', 'FIJO', 'POR_UNIDAD'] as const

const tipoLabel: Record<string, string> = {
  BOOLEAN: 'Sí / No',
  SELECT: 'Lista de opciones',
  NUMBER: 'Número',
}

const impactoLabel: Record<string, string> = {
  PORCENTAJE: '% sobre precio',
  FIJO: 'Monto fijo ($)',
  POR_UNIDAD: 'Por unidad ($)',
}

const initNuevo = {
  nombre: '',
  tipo: 'BOOLEAN' as const,
  impactoTipo: 'PORCENTAJE' as const,
  impactoValor: 0,
}

export default function Configuracion() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<CampoCustom>>({})
  const [editOpciones, setEditOpciones] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [showNuevo, setShowNuevo] = useState(false)
  const [nuevo, setNuevo] = useState(initNuevo)
  const [nuevoOpciones, setNuevoOpciones] = useState('')

  const { data: empresa } = useQuery({
    queryKey: ['empresa'],
    queryFn: () => empresaApi.get().then(r => r.data),
  })

  const { data: campos = [], isLoading } = useQuery<CampoCustom[]>({
    queryKey: ['campos'],
    queryFn: () => camposApi.getAll().then(r => r.data),
    enabled: !!user,
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => camposApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campos'] })
      setEditingId(null)
    },
  })

  const createMut = useMutation({
    mutationFn: (data: any) => camposApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campos'] })
      setShowNuevo(false)
      setNuevo(initNuevo)
      setNuevoOpciones('')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => camposApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campos'] })
      setConfirmDelete(null)
    },
  })

  const startEdit = (campo: CampoCustom) => {
    setEditingId(campo.id)
    setEditForm({ ...campo })
    setEditOpciones(campo.opciones.join(', '))
  }

  const saveEdit = (id: number) => {
    const data: any = { ...editForm }
    data.opciones = editForm.tipo === 'SELECT'
      ? editOpciones.split(',').map(s => s.trim()).filter(Boolean)
      : []
    updateMut.mutate({ id, data })
  }

  const createCampo = () => {
    const data: any = { ...nuevo }
    data.opciones = nuevo.tipo === 'SELECT'
      ? nuevoOpciones.split(',').map(s => s.trim()).filter(Boolean)
      : []
    createMut.mutate(data)
  }

  const ic = 'w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500'
  const lc = 'block text-xs font-medium text-gray-500 mb-1'

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    return (
      <div className="p-8 text-center text-sm text-gray-400">
        No tenés permisos para acceder a esta sección.
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-400 mt-0.5">Administrá los datos y opciones del cotizador</p>
      </div>

      {/* Datos del negocio */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Datos del negocio</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([
            ['Empresa', empresa?.nombre || '—'],
            ['Email', empresa?.email || user.email],
            ['Slug', empresa?.slug || '—'],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="text-sm font-medium text-gray-900 bg-gray-50 rounded-lg px-3 py-2.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Campos del cotizador */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Campos del cotizador</p>
          <button
            onClick={() => setShowNuevo(s => !s)}
            className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Plus size={13} />
            Nuevo campo
          </button>
        </div>

        {/* New campo form */}
        {showNuevo && (
          <div className="border border-sky-200 bg-sky-50/40 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-gray-700 mb-3">Nuevo campo</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={lc}>Nombre</label>
                <input
                  value={nuevo.nombre}
                  onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="ej. Barniz UV"
                  className={ic}
                />
              </div>
              <div>
                <label className={lc}>Tipo de campo</label>
                <select
                  value={nuevo.tipo}
                  onChange={e => setNuevo(p => ({ ...p, tipo: e.target.value as any }))}
                  className={ic}
                >
                  {TIPOS_CAMPO.map(t => <option key={t} value={t}>{tipoLabel[t]}</option>)}
                </select>
              </div>
              <div>
                <label className={lc}>Tipo de impacto</label>
                <select
                  value={nuevo.impactoTipo}
                  onChange={e => setNuevo(p => ({ ...p, impactoTipo: e.target.value as any }))}
                  className={ic}
                >
                  {IMPACTO_TIPOS.map(t => <option key={t} value={t}>{impactoLabel[t]}</option>)}
                </select>
              </div>
              <div>
                <label className={lc}>
                  Valor ({nuevo.impactoTipo === 'PORCENTAJE' ? '%' : '$'})
                </label>
                <input
                  type="number"
                  value={nuevo.impactoValor}
                  onChange={e => setNuevo(p => ({ ...p, impactoValor: Number(e.target.value) }))}
                  className={ic}
                />
              </div>
              {nuevo.tipo === 'SELECT' && (
                <div className="sm:col-span-2">
                  <label className={lc}>Opciones (separadas por coma)</label>
                  <input
                    value={nuevoOpciones}
                    onChange={e => setNuevoOpciones(e.target.value)}
                    placeholder="Opción A, Opción B, Opción C"
                    className={ic}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={createCampo}
                disabled={!nuevo.nombre || createMut.isPending}
                className="h-9 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
              >
                {createMut.isPending ? 'Creando...' : 'Crear campo'}
              </button>
              <button
                onClick={() => { setShowNuevo(false); setNuevo(initNuevo); setNuevoOpciones('') }}
                className="h-9 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-400">Cargando campos...</p>
        ) : campos.length === 0 ? (
          <p className="text-sm text-gray-400">No hay campos configurados</p>
        ) : (
          <div className="space-y-2">
            {campos.map(campo => (
              <div
                key={campo.id}
                className={`border rounded-xl p-4 transition-colors ${
                  editingId === campo.id
                    ? 'border-sky-200 bg-sky-50/30'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                {editingId === campo.id ? (
                  <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className={lc}>Nombre</label>
                        <input
                          value={editForm.nombre || ''}
                          onChange={e => setEditForm(p => ({ ...p, nombre: e.target.value }))}
                          className={ic}
                        />
                      </div>
                      <div>
                        <label className={lc}>Tipo</label>
                        <select
                          value={editForm.tipo || ''}
                          onChange={e => setEditForm(p => ({ ...p, tipo: e.target.value as any }))}
                          className={ic}
                        >
                          {TIPOS_CAMPO.map(t => <option key={t} value={t}>{tipoLabel[t]}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={lc}>Tipo de impacto</label>
                        <select
                          value={editForm.impactoTipo || ''}
                          onChange={e => setEditForm(p => ({ ...p, impactoTipo: e.target.value as any }))}
                          className={ic}
                        >
                          {IMPACTO_TIPOS.map(t => <option key={t} value={t}>{impactoLabel[t]}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={lc}>
                          Valor ({editForm.impactoTipo === 'PORCENTAJE' ? '%' : '$'})
                        </label>
                        <input
                          type="number"
                          value={editForm.impactoValor ?? ''}
                          onChange={e => setEditForm(p => ({ ...p, impactoValor: Number(e.target.value) }))}
                          className={ic}
                        />
                      </div>
                      {editForm.tipo === 'SELECT' && (
                        <div className="sm:col-span-2">
                          <label className={lc}>Opciones (separadas por coma)</label>
                          <input
                            value={editOpciones}
                            onChange={e => setEditOpciones(e.target.value)}
                            className={ic}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(campo.id)}
                        disabled={updateMut.isPending}
                        className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                      >
                        <Check size={13} />
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1.5 h-8 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        <X size={13} />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">{campo.nombre}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {tipoLabel[campo.tipo]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {impactoLabel[campo.impactoTipo]}: {campo.impactoValor}
                        {campo.tipo === 'SELECT' && campo.opciones.length > 0 &&
                          ` · ${campo.opciones.join(', ')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => startEdit(campo)}
                        className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      {confirmDelete === campo.id ? (
                        <div className="flex items-center gap-1.5 ml-1">
                          <span className="text-xs text-red-600 font-medium">¿Eliminar?</span>
                          <button
                            onClick={() => deleteMut.mutate(campo.id)}
                            className="h-7 px-2 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="h-7 px-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs font-medium transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(campo.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
