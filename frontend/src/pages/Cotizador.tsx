import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { empresaApi, preciosApi, camposApi } from '../services/api'
import api from '../services/api'
import { CampoCustom } from '../types'
import { useAuth } from '../context/AuthContext'
import { Plus, Trash2, Edit2, Check, X, Info, CheckCircle2, AlertTriangle } from 'lucide-react'

interface Material { id: number; nombre: string; precioUnitario: number }
interface TramoDescuento { id: number; desdeUnidades: number; porcentaje: number }
interface TipoCaja { id: number; nombre: string; formulaAncho: string; formulaLargo: string }
interface ProveedorMat { id: number; proveedor: string; material: string; precioM2: number }
interface CostoAdicional { id: number; nombre: string; tipo: string; valor: number }

const TIPOS_CAMPO = ['BOOLEAN', 'SELECT', 'NUMBER'] as const
const IMPACTO_TIPOS = ['PORCENTAJE', 'FIJO', 'POR_UNIDAD'] as const

const tipoLabel: Record<string, string> = {
  BOOLEAN: 'Sí / No',
  SELECT: 'Lista de opciones',
  NUMBER: 'Número',
}

const tipoDesc: Record<string, string> = {
  BOOLEAN: 'Checkbox — suma al precio si está activado',
  SELECT: 'Dropdown — el usuario elige una opción',
  NUMBER: 'Cantidad — usuario ingresa un número, se multiplica por el impacto',
}

const impactoLabel: Record<string, string> = {
  PORCENTAJE: '% sobre precio base',
  FIJO: 'Monto fijo ($)',
  POR_UNIDAD: 'Monto por unidad ingresada',
}

const impactoDesc: Record<string, string> = {
  PORCENTAJE: 'Suma un porcentaje al precio acumulado. Ej: 8% → +$80 en un precio de $1000',
  FIJO: 'Suma un monto fijo al precio. Ej: $500 siempre, sin importar la cantidad',
  POR_UNIDAD: 'Solo para campos NUMBER. Multiplica el valor ingresado por el monto. Ej: 2 colores × $200 = +$400',
}

const initNuevo = {
  nombre: '',
  tipo: 'BOOLEAN' as const,
  impactoTipo: 'PORCENTAJE' as const,
  impactoValor: 0,
}

export default function Cotizador() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const ic = 'w-full h-10 px-3 border border-slate-200 rounded-[10px] text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white'
  const lc = 'block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5'

  const { data: empresa } = useQuery({
    queryKey: ['empresa'],
    queryFn: () => empresaApi.get().then(r => r.data),
  })

  const isLumapack = empresa?.slug === 'lumapack'

  // ── Lumapack: Tipos de Caja ───────────────────────────────────
  const [showCreateTC, setShowCreateTC] = useState(false)
  const [createTCForm, setCreateTCForm] = useState({ nombre: '', formulaAncho: '', formulaLargo: '' })
  const [editTCId, setEditTCId] = useState<number | null>(null)
  const [editTCForm, setEditTCForm] = useState({ nombre: '', formulaAncho: '', formulaLargo: '' })

  const { data: tiposCaja = [] } = useQuery<TipoCaja[]>({
    queryKey: ['tipos-caja'],
    queryFn: () => api.get('/cotizador-avanzado/tipos-caja').then(r => r.data),
    enabled: isLumapack,
  })

  const createTCMut = useMutation({
    mutationFn: (data: any) => api.post('/cotizador-avanzado/tipos-caja', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-caja'] })
      setShowCreateTC(false)
      setCreateTCForm({ nombre: '', formulaAncho: '', formulaLargo: '' })
    },
  })

  const updateTCMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/cotizador-avanzado/tipos-caja/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-caja'] })
      setEditTCId(null)
    },
  })

  const deleteTCMut = useMutation({
    mutationFn: (id: number) => api.delete(`/cotizador-avanzado/tipos-caja/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tipos-caja'] }),
  })

  // ── Lumapack: Proveedores/Materiales ─────────────────────────
  const [showCreateProv, setShowCreateProv] = useState(false)
  const [createProvForm, setCreateProvForm] = useState({ proveedor: '', material: '', precioM2: '' })
  const [editProvId, setEditProvId] = useState<number | null>(null)
  const [editProvForm, setEditProvForm] = useState({ proveedor: '', material: '', precioM2: '' })

  const { data: proveedores = [] } = useQuery<ProveedorMat[]>({
    queryKey: ['proveedores-mat'],
    queryFn: () => api.get('/cotizador-avanzado/proveedores').then(r => r.data),
    enabled: isLumapack,
  })

  const createProvMut = useMutation({
    mutationFn: (data: any) => api.post('/cotizador-avanzado/proveedores', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores-mat'] })
      setShowCreateProv(false)
      setCreateProvForm({ proveedor: '', material: '', precioM2: '' })
    },
  })

  const updateProvMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/cotizador-avanzado/proveedores/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores-mat'] })
      setEditProvId(null)
    },
  })

  const deleteProvMut = useMutation({
    mutationFn: (id: number) => api.delete(`/cotizador-avanzado/proveedores/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proveedores-mat'] }),
  })

  // ── Lumapack: Costos Adicionales ─────────────────────────────
  const [showCreateCosto, setShowCreateCosto] = useState(false)
  const [createCostoForm, setCreateCostoForm] = useState({ nombre: '', tipo: 'POR_M2', valor: '' })
  const [editCostoId, setEditCostoId] = useState<number | null>(null)
  const [editCostoForm, setEditCostoForm] = useState({ nombre: '', tipo: 'POR_M2', valor: '' })

  const { data: costos = [] } = useQuery<CostoAdicional[]>({
    queryKey: ['costos-adicionales'],
    queryFn: () => api.get('/cotizador-avanzado/costos').then(r => r.data),
    enabled: isLumapack,
  })

  const createCostoMut = useMutation({
    mutationFn: (data: any) => api.post('/cotizador-avanzado/costos', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costos-adicionales'] })
      setShowCreateCosto(false)
      setCreateCostoForm({ nombre: '', tipo: 'POR_M2', valor: '' })
    },
  })

  const updateCostoMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/cotizador-avanzado/costos/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costos-adicionales'] })
      setEditCostoId(null)
    },
  })

  const deleteCostoMut = useMutation({
    mutationFn: (id: number) => api.delete(`/cotizador-avanzado/costos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['costos-adicionales'] }),
  })

  // ── Non-Lumapack: Precios ─────────────────────────────────────
  const [precioBaseInput, setPrecioBaseInput] = useState('0')
  const [configSavedOk, setConfigSavedOk] = useState(false)
  const [showCreateMat, setShowCreateMat] = useState(false)
  const [createMatForm, setCreateMatForm] = useState({ nombre: '', precioUnitario: '0' })
  const [editMatId, setEditMatId] = useState<number | null>(null)
  const [editMatForm, setEditMatForm] = useState({ nombre: '', precioUnitario: '0' })
  const [showCreateTramo, setShowCreateTramo] = useState(false)
  const [createTramoForm, setCreateTramoForm] = useState({ desdeUnidades: '', porcentaje: '' })
  const [editTramoId, setEditTramoId] = useState<number | null>(null)
  const [editTramoForm, setEditTramoForm] = useState({ desdeUnidades: '', porcentaje: '' })

  const nonLumapackEnabled = empresa !== undefined && !isLumapack

  const { data: precioConfig } = useQuery({
    queryKey: ['precio-config'],
    queryFn: () => preciosApi.getConfig().then(r => r.data),
    enabled: nonLumapackEnabled,
  })

  const { data: materiales = [] } = useQuery<Material[]>({
    queryKey: ['materiales'],
    queryFn: () => preciosApi.getMateriales().then(r => r.data),
    enabled: nonLumapackEnabled,
  })

  const { data: tramos = [] } = useQuery<TramoDescuento[]>({
    queryKey: ['tramos'],
    queryFn: () => preciosApi.getTramos().then(r => r.data),
    enabled: nonLumapackEnabled,
  })

  useEffect(() => {
    if (precioConfig !== undefined) setPrecioBaseInput(String(precioConfig.precioBase ?? 0))
  }, [precioConfig])

  const updateConfigMut = useMutation({
    mutationFn: (data: { precioBase: number }) => preciosApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['precio-config'] })
      setConfigSavedOk(true)
      setTimeout(() => setConfigSavedOk(false), 3000)
    },
  })

  const createMatMut = useMutation({
    mutationFn: (data: any) => preciosApi.createMaterial(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiales'] })
      setShowCreateMat(false)
      setCreateMatForm({ nombre: '', precioUnitario: '0' })
    },
  })

  const updateMatMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => preciosApi.updateMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiales'] })
      setEditMatId(null)
    },
  })

  const deleteMatMut = useMutation({
    mutationFn: (id: number) => preciosApi.deleteMaterial(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materiales'] }),
  })

  const createTramoMut = useMutation({
    mutationFn: (data: any) => preciosApi.createTramo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tramos'] })
      setShowCreateTramo(false)
      setCreateTramoForm({ desdeUnidades: '', porcentaje: '' })
    },
  })

  const updateTramoMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => preciosApi.updateTramo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tramos'] })
      setEditTramoId(null)
    },
  })

  const deleteTramoMut = useMutation({
    mutationFn: (id: number) => preciosApi.deleteTramo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tramos'] }),
  })

  // ── Non-Lumapack: Campos ──────────────────────────────────────
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<CampoCustom>>({})
  const [editOpciones, setEditOpciones] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [showNuevo, setShowNuevo] = useState(false)
  const [nuevo, setNuevo] = useState(initNuevo)
  const [nuevoOpciones, setNuevoOpciones] = useState('')

  const { data: campos = [], isLoading: isLoadingCampos } = useQuery<CampoCustom[]>({
    queryKey: ['campos'],
    queryFn: () => camposApi.getAll().then(r => r.data),
    enabled: nonLumapackEnabled,
  })

  const updateCampoMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => camposApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campos'] })
      setEditingId(null)
    },
  })

  const createCampoMut = useMutation({
    mutationFn: (data: any) => camposApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campos'] })
      setShowNuevo(false)
      setNuevo(initNuevo)
      setNuevoOpciones('')
    },
  })

  const deleteCampoMut = useMutation({
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
    updateCampoMut.mutate({ id, data })
  }

  const createCampo = () => {
    const data: any = { ...nuevo }
    data.opciones = nuevo.tipo === 'SELECT'
      ? nuevoOpciones.split(',').map(s => s.trim()).filter(Boolean)
      : []
    createCampoMut.mutate(data)
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    return (
      <div className="p-8 text-center text-[13px] text-slate-400">
        No tenés permisos para acceder a esta sección.
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-7 py-7">
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cotizador</h1>
        <p className="text-[13px] text-slate-400 mt-0.5">Configurá los parámetros del cotizador</p>
      </div>

      {!empresa ? null : empresa.slug === 'lumapack' ? (
        <>
          {/* Tipos de caja */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
            <div className="flex items-start justify-between -mx-5 px-5 pb-4 mb-5 border-b border-slate-100 gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 tracking-tight">Tipos de caja</p>
                <p className="text-[12px] text-slate-400 mt-0.5">Cada tipo define las fórmulas para calcular el largo y ancho de plancha</p>
              </div>
              <button onClick={() => setShowCreateTC(s => !s)}
                className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors flex-shrink-0">
                <Plus size={12} />
                Agregar tipo
              </button>
            </div>

            {showCreateTC && (
              <div className="border border-sky-200 bg-sky-50/40 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={lc}>Nombre *</label>
                    <input value={createTCForm.nombre}
                      onChange={e => setCreateTCForm(p => ({ ...p, nombre: e.target.value }))}
                      placeholder="Caja RSC" className={ic} />
                  </div>
                  <div>
                    <label className={lc}>Fórmula ancho plancha</label>
                    <input value={createTCForm.formulaAncho}
                      onChange={e => setCreateTCForm(p => ({ ...p, formulaAncho: e.target.value }))}
                      placeholder="F + G + 16" className={ic} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={lc}>Fórmula largo plancha</label>
                    <input value={createTCForm.formulaLargo}
                      onChange={e => setCreateTCForm(p => ({ ...p, formulaLargo: e.target.value }))}
                      placeholder="(2*E) + (2*F) + 48" className={ic} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => createTCMut.mutate(createTCForm)}
                    disabled={!createTCForm.nombre || createTCMut.isPending}
                    className="h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors disabled:opacity-40">
                    {createTCMut.isPending ? 'Creando...' : 'Crear'}
                  </button>
                  <button onClick={() => setShowCreateTC(false)}
                    className="h-8 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-[8px] text-[12px] font-semibold transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {tiposCaja.length === 0 && !showCreateTC ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
                <p className="text-[13px] text-slate-400">No hay tipos de caja configurados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tiposCaja.map(tc => (
                  <div key={tc.id} className={`border rounded-xl transition-colors ${editTCId === tc.id ? 'border-sky-200 bg-sky-50/20' : 'border-slate-100'}`}>
                    {editTCId === tc.id ? (
                      <div className="p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className={lc}>Nombre</label>
                            <input value={editTCForm.nombre} onChange={e => setEditTCForm(p => ({ ...p, nombre: e.target.value }))} className={ic} />
                          </div>
                          <div>
                            <label className={lc}>Fórmula ancho</label>
                            <input value={editTCForm.formulaAncho} onChange={e => setEditTCForm(p => ({ ...p, formulaAncho: e.target.value }))} className={ic} />
                          </div>
                          <div className="sm:col-span-2">
                            <label className={lc}>Fórmula largo</label>
                            <input value={editTCForm.formulaLargo} onChange={e => setEditTCForm(p => ({ ...p, formulaLargo: e.target.value }))} className={ic} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => updateTCMut.mutate({ id: tc.id, data: editTCForm })}
                            disabled={updateTCMut.isPending}
                            className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors disabled:opacity-40">
                            <Check size={12} /> Guardar
                          </button>
                          <button onClick={() => setEditTCId(null)}
                            className="flex items-center gap-1.5 h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[8px] text-[12px] font-semibold transition-colors">
                            <X size={12} /> Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3 px-4 py-3">
                        <div>
                          <p className="text-[13px] font-semibold text-slate-900">{tc.nombre}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">Ancho: {tc.formulaAncho}</p>
                          <p className="text-[11px] text-slate-400 font-mono">Largo: {tc.formulaLargo}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => { setEditTCId(tc.id); setEditTCForm({ nombre: tc.nombre, formulaAncho: tc.formulaAncho, formulaLargo: tc.formulaLargo }) }}
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => deleteTCMut.mutate(tc.id)} disabled={deleteTCMut.isPending}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Proveedores y materiales */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
            <div className="flex items-start justify-between -mx-5 px-5 pb-4 mb-5 border-b border-slate-100 gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 tracking-tight">Proveedores y materiales</p>
                <p className="text-[12px] text-slate-400 mt-0.5">Precio por m² según proveedor y material</p>
              </div>
              <button onClick={() => setShowCreateProv(s => !s)}
                className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors flex-shrink-0">
                <Plus size={12} />
                Agregar
              </button>
            </div>

            {showCreateProv && (
              <div className="border border-sky-200 bg-sky-50/40 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className={lc}>Proveedor *</label>
                    <input value={createProvForm.proveedor}
                      onChange={e => setCreateProvForm(p => ({ ...p, proveedor: e.target.value }))}
                      placeholder="Smurfit Kappa" className={ic} />
                  </div>
                  <div>
                    <label className={lc}>Material *</label>
                    <input value={createProvForm.material}
                      onChange={e => setCreateProvForm(p => ({ ...p, material: e.target.value }))}
                      placeholder="Micro Simple" className={ic} />
                  </div>
                  <div>
                    <label className={lc}>Precio por m² ($)</label>
                    <input type="number" min="0" step="0.01"
                      value={createProvForm.precioM2}
                      onChange={e => setCreateProvForm(p => ({ ...p, precioM2: e.target.value }))}
                      placeholder="0.00" className={ic} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => createProvMut.mutate({ proveedor: createProvForm.proveedor, material: createProvForm.material, precioM2: Number(createProvForm.precioM2) })}
                    disabled={!createProvForm.proveedor || !createProvForm.material || createProvMut.isPending}
                    className="h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors disabled:opacity-40">
                    {createProvMut.isPending ? 'Creando...' : 'Crear'}
                  </button>
                  <button onClick={() => setShowCreateProv(false)}
                    className="h-8 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-[8px] text-[12px] font-semibold transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {proveedores.length === 0 && !showCreateProv ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
                <p className="text-[13px] text-slate-400">No hay proveedores configurados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Proveedor</th>
                      <th className="text-left py-2 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Material</th>
                      <th className="text-left py-2 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Precio m²</th>
                      <th className="py-2 px-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedores.map(prov => (
                      <tr key={prov.id} className={`border-b border-slate-100 last:border-0 ${editProvId === prov.id ? 'bg-sky-50/20' : ''}`}>
                        {editProvId === prov.id ? (
                          <td colSpan={4} className="py-3 px-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                              <div>
                                <label className={lc}>Proveedor</label>
                                <input value={editProvForm.proveedor} onChange={e => setEditProvForm(p => ({ ...p, proveedor: e.target.value }))} className={ic} />
                              </div>
                              <div>
                                <label className={lc}>Material</label>
                                <input value={editProvForm.material} onChange={e => setEditProvForm(p => ({ ...p, material: e.target.value }))} className={ic} />
                              </div>
                              <div>
                                <label className={lc}>Precio m² ($)</label>
                                <input type="number" min="0" step="0.01" value={editProvForm.precioM2} onChange={e => setEditProvForm(p => ({ ...p, precioM2: e.target.value }))} className={ic} />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => updateProvMut.mutate({ id: prov.id, data: { proveedor: editProvForm.proveedor, material: editProvForm.material, precioM2: Number(editProvForm.precioM2) } })}
                                disabled={updateProvMut.isPending}
                                className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors disabled:opacity-40">
                                <Check size={12} /> Guardar
                              </button>
                              <button onClick={() => setEditProvId(null)}
                                className="flex items-center gap-1.5 h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[8px] text-[12px] font-semibold transition-colors">
                                <X size={12} /> Cancelar
                              </button>
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="py-3 px-3 font-medium text-slate-900">{prov.proveedor}</td>
                            <td className="py-3 px-3 text-slate-600">{prov.material}</td>
                            <td className="py-3 px-3 font-mono text-slate-700">${prov.precioM2.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1 justify-end">
                                <button onClick={() => { setEditProvId(prov.id); setEditProvForm({ proveedor: prov.proveedor, material: prov.material, precioM2: String(prov.precioM2) }) }}
                                  className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                                  <Edit2 size={13} />
                                </button>
                                <button onClick={() => deleteProvMut.mutate(prov.id)} disabled={deleteProvMut.isPending}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Costos adicionales */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
            <div className="flex items-start justify-between -mx-5 px-5 pb-4 mb-5 border-b border-slate-100 gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 tracking-tight">Costos adicionales</p>
                <p className="text-[12px] text-slate-400 mt-0.5">Costos extra que se suman a la cotización</p>
              </div>
              <button onClick={() => setShowCreateCosto(s => !s)}
                className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors flex-shrink-0">
                <Plus size={12} />
                Agregar
              </button>
            </div>

            {showCreateCosto && (
              <div className="border border-sky-200 bg-sky-50/40 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className={lc}>Nombre *</label>
                    <input value={createCostoForm.nombre}
                      onChange={e => setCreateCostoForm(p => ({ ...p, nombre: e.target.value }))}
                      placeholder="Flete" className={ic} />
                  </div>
                  <div>
                    <label className={lc}>Tipo</label>
                    <select value={createCostoForm.tipo}
                      onChange={e => setCreateCostoForm(p => ({ ...p, tipo: e.target.value }))}
                      className={ic}>
                      <option value="POR_M2">Por m²</option>
                      <option value="FIJO">Monto fijo $</option>
                    </select>
                  </div>
                  <div>
                    <label className={lc}>Valor</label>
                    <input type="number" min="0" step="0.01"
                      value={createCostoForm.valor}
                      onChange={e => setCreateCostoForm(p => ({ ...p, valor: e.target.value }))}
                      placeholder="0.00" className={ic} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => createCostoMut.mutate({ nombre: createCostoForm.nombre, tipo: createCostoForm.tipo, valor: Number(createCostoForm.valor) })}
                    disabled={!createCostoForm.nombre || createCostoMut.isPending}
                    className="h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors disabled:opacity-40">
                    {createCostoMut.isPending ? 'Creando...' : 'Crear'}
                  </button>
                  <button onClick={() => setShowCreateCosto(false)}
                    className="h-8 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-[8px] text-[12px] font-semibold transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {costos.length === 0 && !showCreateCosto ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
                <p className="text-[13px] text-slate-400">No hay costos adicionales configurados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {costos.map(costo => (
                  <div key={costo.id} className={`border rounded-xl transition-colors ${editCostoId === costo.id ? 'border-sky-200 bg-sky-50/20' : 'border-slate-100'}`}>
                    {editCostoId === costo.id ? (
                      <div className="p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className={lc}>Nombre</label>
                            <input value={editCostoForm.nombre} onChange={e => setEditCostoForm(p => ({ ...p, nombre: e.target.value }))} className={ic} />
                          </div>
                          <div>
                            <label className={lc}>Tipo</label>
                            <select value={editCostoForm.tipo} onChange={e => setEditCostoForm(p => ({ ...p, tipo: e.target.value }))} className={ic}>
                              <option value="POR_M2">Por m²</option>
                              <option value="FIJO">Monto fijo $</option>
                            </select>
                          </div>
                          <div>
                            <label className={lc}>Valor</label>
                            <input type="number" min="0" step="0.01" value={editCostoForm.valor} onChange={e => setEditCostoForm(p => ({ ...p, valor: e.target.value }))} className={ic} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => updateCostoMut.mutate({ id: costo.id, data: { nombre: editCostoForm.nombre, tipo: editCostoForm.tipo, valor: Number(editCostoForm.valor) } })}
                            disabled={updateCostoMut.isPending}
                            className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors disabled:opacity-40">
                            <Check size={12} /> Guardar
                          </button>
                          <button onClick={() => setEditCostoId(null)}
                            className="flex items-center gap-1.5 h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[8px] text-[12px] font-semibold transition-colors">
                            <X size={12} /> Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-[13px] font-semibold text-slate-900">{costo.nombre}</p>
                          <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-[2px] rounded-full ${costo.tipo === 'POR_M2' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'}`}>
                            {costo.tipo === 'POR_M2' ? 'Por m²' : 'Monto fijo'}
                          </span>
                          <span className="text-[13px] font-mono text-slate-600">${costo.valor.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => { setEditCostoId(costo.id); setEditCostoForm({ nombre: costo.nombre, tipo: costo.tipo, valor: String(costo.valor) }) }}
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => deleteCostoMut.mutate(costo.id)} disabled={deleteCostoMut.isPending}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Precios base */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
            <div className="flex items-center -mx-5 px-5 pb-4 mb-5 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900 tracking-tight">Precios base</p>
            </div>

            <div className="mb-6">
              <p className="text-[13px] font-semibold text-slate-700 mb-3">Precio base por cotización</p>
              <div className="flex items-end gap-3 flex-wrap">
                <div>
                  <label className={lc}>Monto base ($)</label>
                  <input type="number" min="0" step="0.01"
                    value={precioBaseInput}
                    onChange={e => setPrecioBaseInput(e.target.value)}
                    className={ic + ' w-40'} />
                </div>
                <button onClick={() => updateConfigMut.mutate({ precioBase: Number(precioBaseInput) })}
                  disabled={updateConfigMut.isPending}
                  className="h-10 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-[10px] text-[13px] font-semibold transition-colors disabled:opacity-40 shadow-[0_4px_12px_-4px_rgba(14,165,233,0.45)]">
                  {updateConfigMut.isPending ? 'Guardando...' : 'Guardar'}
                </button>
                {configSavedOk && (
                  <span className="flex items-center gap-1.5 text-[13px] text-emerald-600 font-medium">
                    <CheckCircle2 size={14} /> Guardado
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">Costo fijo que se suma a todas las cotizaciones antes del material y opciones.</p>
            </div>

            <div className="border-t border-slate-100 pt-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-semibold text-slate-700">Materiales</p>
                <button onClick={() => setShowCreateMat(s => !s)}
                  className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors">
                  <Plus size={12} /> Agregar
                </button>
              </div>

              {showCreateMat && (
                <div className="border border-sky-200 bg-sky-50/40 rounded-xl p-4 mb-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className={lc}>Nombre *</label>
                      <input value={createMatForm.nombre}
                        onChange={e => setCreateMatForm(p => ({ ...p, nombre: e.target.value }))}
                        placeholder="Cartón corrugado" className={ic} />
                    </div>
                    <div>
                      <label className={lc}>Precio por unidad ($)</label>
                      <input type="number" min="0" step="0.01"
                        value={createMatForm.precioUnitario}
                        onChange={e => setCreateMatForm(p => ({ ...p, precioUnitario: e.target.value }))}
                        className={ic} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => createMatMut.mutate({ nombre: createMatForm.nombre, precioUnitario: Number(createMatForm.precioUnitario) })}
                      disabled={!createMatForm.nombre || createMatMut.isPending}
                      className="h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors disabled:opacity-40">
                      {createMatMut.isPending ? 'Creando...' : 'Crear material'}
                    </button>
                    <button onClick={() => setShowCreateMat(false)}
                      className="h-8 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-[8px] text-[12px] font-semibold transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {materiales.length === 0 && !showCreateMat ? (
                <p className="text-[13px] text-slate-400 py-1">No hay materiales configurados</p>
              ) : (
                <div className="space-y-2">
                  {materiales.map(mat => (
                    <div key={mat.id} className={`border rounded-xl transition-colors ${editMatId === mat.id ? 'border-sky-200 bg-sky-50/20' : 'border-slate-100'}`}>
                      {editMatId === mat.id ? (
                        <div className="p-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className={lc}>Nombre</label>
                              <input value={editMatForm.nombre} onChange={e => setEditMatForm(p => ({ ...p, nombre: e.target.value }))} className={ic} />
                            </div>
                            <div>
                              <label className={lc}>Precio por unidad ($)</label>
                              <input type="number" min="0" step="0.01" value={editMatForm.precioUnitario} onChange={e => setEditMatForm(p => ({ ...p, precioUnitario: e.target.value }))} className={ic} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => updateMatMut.mutate({ id: mat.id, data: { nombre: editMatForm.nombre, precioUnitario: Number(editMatForm.precioUnitario) } })}
                              disabled={updateMatMut.isPending}
                              className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors disabled:opacity-40">
                              <Check size={12} /> Guardar
                            </button>
                            <button onClick={() => setEditMatId(null)}
                              className="flex items-center gap-1.5 h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[8px] text-[12px] font-semibold transition-colors">
                              <X size={12} /> Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3 px-4 py-3">
                          <div>
                            <p className="text-[13px] font-semibold text-slate-900">{mat.nombre}</p>
                            <p className="text-[11px] text-slate-400 font-mono">${mat.precioUnitario.toLocaleString('es-AR')} / unidad</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => { setEditMatId(mat.id); setEditMatForm({ nombre: mat.nombre, precioUnitario: String(mat.precioUnitario) }) }}
                              className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => deleteMatMut.mutate(mat.id)} disabled={deleteMatMut.isPending}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-semibold text-slate-700">Descuentos por volumen</p>
                <button onClick={() => setShowCreateTramo(s => !s)}
                  className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors">
                  <Plus size={12} /> Agregar tramo
                </button>
              </div>

              {showCreateTramo && (
                <div className="border border-sky-200 bg-sky-50/40 rounded-xl p-4 mb-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className={lc}>Desde (unidades) *</label>
                      <input type="number" min="1"
                        value={createTramoForm.desdeUnidades}
                        onChange={e => setCreateTramoForm(p => ({ ...p, desdeUnidades: e.target.value }))}
                        placeholder="1000" className={ic} />
                    </div>
                    <div>
                      <label className={lc}>Descuento (%)</label>
                      <input type="number" min="0" max="100" step="0.1"
                        value={createTramoForm.porcentaje}
                        onChange={e => setCreateTramoForm(p => ({ ...p, porcentaje: e.target.value }))}
                        placeholder="10" className={ic} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => createTramoMut.mutate({ desdeUnidades: Number(createTramoForm.desdeUnidades), porcentaje: Number(createTramoForm.porcentaje) })}
                      disabled={!createTramoForm.desdeUnidades || !createTramoForm.porcentaje || createTramoMut.isPending}
                      className="h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors disabled:opacity-40">
                      {createTramoMut.isPending ? 'Creando...' : 'Crear tramo'}
                    </button>
                    <button onClick={() => setShowCreateTramo(false)}
                      className="h-8 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-[8px] text-[12px] font-semibold transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {tramos.length === 0 && !showCreateTramo ? (
                <p className="text-[13px] text-slate-400 py-1">No hay tramos configurados</p>
              ) : (
                <div className="space-y-2">
                  {tramos.map(tramo => (
                    <div key={tramo.id} className={`border rounded-xl transition-colors ${editTramoId === tramo.id ? 'border-sky-200 bg-sky-50/20' : 'border-slate-100'}`}>
                      {editTramoId === tramo.id ? (
                        <div className="p-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className={lc}>Desde (unidades)</label>
                              <input type="number" min="1" value={editTramoForm.desdeUnidades} onChange={e => setEditTramoForm(p => ({ ...p, desdeUnidades: e.target.value }))} className={ic} />
                            </div>
                            <div>
                              <label className={lc}>Descuento (%)</label>
                              <input type="number" min="0" max="100" step="0.1" value={editTramoForm.porcentaje} onChange={e => setEditTramoForm(p => ({ ...p, porcentaje: e.target.value }))} className={ic} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => updateTramoMut.mutate({ id: tramo.id, data: { desdeUnidades: Number(editTramoForm.desdeUnidades), porcentaje: Number(editTramoForm.porcentaje) } })}
                              disabled={updateTramoMut.isPending}
                              className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors disabled:opacity-40">
                              <Check size={12} /> Guardar
                            </button>
                            <button onClick={() => setEditTramoId(null)}
                              className="flex items-center gap-1.5 h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[8px] text-[12px] font-semibold transition-colors">
                              <X size={12} /> Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3 px-4 py-3">
                          <p className="text-[13px] text-slate-700">
                            A partir de <span className="font-semibold font-mono">{tramo.desdeUnidades.toLocaleString('es-AR')} u.</span>
                            {' → '}
                            <span className="font-semibold text-emerald-600">{tramo.porcentaje}% de descuento</span>
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => { setEditTramoId(tramo.id); setEditTramoForm({ desdeUnidades: String(tramo.desdeUnidades), porcentaje: String(tramo.porcentaje) }) }}
                              className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => deleteTramoMut.mutate(tramo.id)} disabled={deleteTramoMut.isPending}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Campos del cotizador */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between -mx-5 px-5 pb-4 mb-4 border-b border-slate-100 gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 tracking-tight">Campos del cotizador</p>
                <p className="text-[12px] text-slate-400 mt-0.5">Los campos aparecen en el formulario de cotización y afectan el precio según su configuración.</p>
              </div>
              <button onClick={() => setShowNuevo(s => !s)}
                className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors flex-shrink-0">
                <Plus size={12} /> Nuevo campo
              </button>
            </div>

            {showNuevo && (
              <div className="border border-sky-200 bg-sky-50/40 rounded-xl p-4 mb-4">
                <p className="text-[13px] font-semibold text-slate-800 mb-4">Nuevo campo personalizado</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lc}>Nombre del campo</label>
                    <input value={nuevo.nombre}
                      onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))}
                      placeholder="ej. Barniz UV, Troquelado..."
                      className={ic} />
                  </div>
                  <div>
                    <label className={lc}>Tipo de entrada</label>
                    <select value={nuevo.tipo}
                      onChange={e => setNuevo(p => ({ ...p, tipo: e.target.value as any }))}
                      className={ic}>
                      {TIPOS_CAMPO.map(t => <option key={t} value={t}>{tipoLabel[t]}</option>)}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">{tipoDesc[nuevo.tipo]}</p>
                  </div>
                  {nuevo.tipo === 'SELECT' && (
                    <div className="sm:col-span-2">
                      <label className={lc}>Opciones (separadas por coma)</label>
                      <input value={nuevoOpciones}
                        onChange={e => setNuevoOpciones(e.target.value)}
                        placeholder="Opción A, Opción B, Opción C"
                        className={ic} />
                    </div>
                  )}
                  <div>
                    <label className={lc}>Tipo de impacto en precio</label>
                    <select value={nuevo.impactoTipo}
                      onChange={e => setNuevo(p => ({ ...p, impactoTipo: e.target.value as any }))}
                      className={ic}>
                      {IMPACTO_TIPOS.map(t => <option key={t} value={t}>{impactoLabel[t]}</option>)}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">{impactoDesc[nuevo.impactoTipo]}</p>
                  </div>
                  <div>
                    <label className={lc}>Valor del impacto ({nuevo.impactoTipo === 'PORCENTAJE' ? '%' : '$'})</label>
                    <input type="number" value={nuevo.impactoValor} min="0" step="0.01"
                      onChange={e => setNuevo(p => ({ ...p, impactoValor: Number(e.target.value) }))}
                      className={ic} />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-sky-200">
                  <button onClick={createCampo} disabled={!nuevo.nombre || createCampoMut.isPending}
                    className="h-9 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-[10px] text-[13px] font-semibold transition-colors disabled:opacity-40 shadow-[0_4px_12px_-4px_rgba(14,165,233,0.45)]">
                    {createCampoMut.isPending ? 'Creando...' : 'Crear campo'}
                  </button>
                  <button onClick={() => { setShowNuevo(false); setNuevo(initNuevo); setNuevoOpciones('') }}
                    className="h-9 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-[10px] text-[13px] font-semibold transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {isLoadingCampos ? (
              <p className="text-[13px] text-slate-400">Cargando campos...</p>
            ) : campos.length === 0 && !showNuevo ? (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
                <p className="text-[13px] text-slate-400 mb-1">No hay campos configurados</p>
                <p className="text-[12px] text-slate-300">Creá tu primer campo para personalizar las cotizaciones</p>
              </div>
            ) : (
              <div className="space-y-2">
                {campos.map(campo => (
                  <div key={campo.id} className={`border rounded-xl transition-colors ${editingId === campo.id ? 'border-sky-200 bg-sky-50/20' : 'border-slate-100'}`}>
                    {confirmDelete === campo.id ? (
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                            <AlertTriangle size={15} className="text-red-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[13px] font-semibold text-slate-900 mb-0.5">¿Eliminar "{campo.nombre}"?</p>
                            <p className="text-[12px] text-slate-500 mb-3">
                              Esto eliminará el campo del cotizador. Los valores guardados en cotizaciones existentes se mantendrán.
                            </p>
                            <div className="flex gap-2">
                              <button onClick={() => deleteCampoMut.mutate(campo.id)} disabled={deleteCampoMut.isPending}
                                className="h-8 px-4 bg-red-500 hover:bg-red-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors disabled:opacity-40">
                                {deleteCampoMut.isPending ? 'Eliminando...' : 'Sí, eliminar'}
                              </button>
                              <button onClick={() => setConfirmDelete(null)}
                                className="h-8 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[8px] text-[12px] font-semibold transition-colors">
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : editingId === campo.id ? (
                      <div className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className={lc}>Nombre</label>
                            <input value={editForm.nombre || ''}
                              onChange={e => setEditForm(p => ({ ...p, nombre: e.target.value }))}
                              className={ic} />
                          </div>
                          <div>
                            <label className={lc}>Tipo de entrada</label>
                            <select value={editForm.tipo || ''}
                              onChange={e => setEditForm(p => ({ ...p, tipo: e.target.value as any }))}
                              className={ic}>
                              {TIPOS_CAMPO.map(t => <option key={t} value={t}>{tipoLabel[t]}</option>)}
                            </select>
                          </div>
                          {editForm.tipo === 'SELECT' && (
                            <div className="sm:col-span-2">
                              <label className={lc}>Opciones (separadas por coma)</label>
                              <input value={editOpciones} onChange={e => setEditOpciones(e.target.value)} className={ic} />
                            </div>
                          )}
                          <div>
                            <label className={lc}>Tipo de impacto</label>
                            <select value={editForm.impactoTipo || ''}
                              onChange={e => setEditForm(p => ({ ...p, impactoTipo: e.target.value as any }))}
                              className={ic}>
                              {IMPACTO_TIPOS.map(t => <option key={t} value={t}>{impactoLabel[t]}</option>)}
                            </select>
                            <p className="text-[11px] text-slate-400 mt-1">{editForm.impactoTipo ? impactoDesc[editForm.impactoTipo] : ''}</p>
                          </div>
                          <div>
                            <label className={lc}>Valor ({editForm.impactoTipo === 'PORCENTAJE' ? '%' : '$'})</label>
                            <input type="number" min="0" step="0.01"
                              value={editForm.impactoValor ?? ''}
                              onChange={e => setEditForm(p => ({ ...p, impactoValor: Number(e.target.value) }))}
                              className={ic} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(campo.id)} disabled={updateCampoMut.isPending}
                            className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors disabled:opacity-40">
                            <Check size={12} /> Guardar cambios
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="flex items-center gap-1.5 h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[8px] text-[12px] font-semibold transition-colors">
                            <X size={12} /> Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3 p-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-[13px] font-semibold text-slate-900">{campo.nombre}</p>
                            <span className="inline-flex items-center text-[10px] font-semibold px-2 py-[2px] rounded-full bg-slate-100 text-slate-600">
                              {tipoLabel[campo.tipo]}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Info size={11} className="text-slate-300 flex-shrink-0" />
                            <p className="text-[12px] text-slate-400">
                              {impactoLabel[campo.impactoTipo]}{': '}
                              <span className="font-semibold text-slate-600 font-mono">
                                {campo.impactoTipo === 'PORCENTAJE' ? `${campo.impactoValor}%` : `$${campo.impactoValor}`}
                              </span>
                              {campo.tipo === 'SELECT' && campo.opciones.length > 0 &&
                                ` · Opciones: ${campo.opciones.join(', ')}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => startEdit(campo)}
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => setConfirmDelete(campo.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
