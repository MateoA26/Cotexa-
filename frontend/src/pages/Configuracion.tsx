import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { camposApi, empresaApi, authApi, preciosApi } from '../services/api'
import { CampoCustom } from '../types'
import { useAuth } from '../context/AuthContext'
import { Plus, Trash2, Edit2, Check, X, AlertTriangle, Info, CheckCircle2, Image as ImageIcon, Upload } from 'lucide-react'

interface Material { id: number; nombre: string; precioUnitario: number }
interface TramoDescuento { id: number; desdeUnidades: number; porcentaje: number }

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

  const [empresaForm, setEmpresaForm] = useState({ nombre: '', email: '' })
  const [savedOk, setSavedOk] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)

  const [passForm, setPassForm] = useState({ actual: '', nuevo: '', confirmar: '' })
  const [passError, setPassError] = useState('')
  const [passOk, setPassOk] = useState(false)

  const { data: empresa } = useQuery({
    queryKey: ['empresa'],
    queryFn: () => empresaApi.get().then(r => r.data),
  })

  useEffect(() => {
    if (empresa) setEmpresaForm({ nombre: empresa.nombre || '', email: empresa.email || '' })
  }, [empresa])

  const updateEmpresaMut = useMutation({
    mutationFn: (data: { nombre: string; email: string }) => empresaApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresa'] })
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 3000)
    },
  })

  const updateLogoMut = useMutation({
    mutationFn: (logoUrl: string) => empresaApi.update({ logoUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresa'] })
      setLogoPreview(null)
    },
    onError: () => setLogoError('Error al guardar el logo'),
  })

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError(null)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setLogoError('Solo se aceptan JPG, PNG o WebP')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('El archivo no puede superar 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string
      if (b64.length > 1 * 1024 * 1024) {
        setLogoError('La imagen es demasiado grande. Reducí la resolución.')
        return
      }
      setLogoPreview(b64)
    }
    reader.readAsDataURL(file)
  }

  const changePassMut = useMutation({
    mutationFn: () => authApi.cambiarPassword(passForm.actual, passForm.nuevo),
    onSuccess: () => {
      setPassOk(true)
      setPassForm({ actual: '', nuevo: '', confirmar: '' })
      setPassError('')
      setTimeout(() => setPassOk(false), 3000)
    },
    onError: (err: any) => {
      setPassError(err.response?.data?.error || 'Error al cambiar la contraseña')
    }
  })

  const handleChangePass = () => {
    setPassError('')
    if (passForm.nuevo !== passForm.confirmar) return setPassError('Las contraseñas no coinciden')
    if (passForm.nuevo.length < 6) return setPassError('Mínimo 6 caracteres')
    changePassMut.mutate()
  }

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

  // ── Precios ───────────────────────────────────────────────
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

  const { data: precioConfig } = useQuery({
    queryKey: ['precio-config'],
    queryFn: () => preciosApi.getConfig().then(r => r.data),
  })

  const { data: materiales = [] } = useQuery<Material[]>({
    queryKey: ['materiales'],
    queryFn: () => preciosApi.getMateriales().then(r => r.data),
  })

  const { data: tramos = [] } = useQuery<TramoDescuento[]>({
    queryKey: ['tramos'],
    queryFn: () => preciosApi.getTramos().then(r => r.data),
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

  const ic = 'w-full h-10 px-3 border border-slate-200 rounded-[10px] text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white'
  const lc = 'block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5'

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
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Configuración</h1>
        <p className="text-[13px] text-slate-400 mt-0.5">Administrá los datos y opciones del cotizador</p>
      </div>

      {/* Mi perfil */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
        <div className="flex items-center -mx-5 px-5 pb-4 mb-5 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900 tracking-tight">Mi perfil</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className={lc}>Nombre</label>
            <input value={user?.nombre || ''} disabled className={ic + ' bg-slate-50 text-slate-400 cursor-not-allowed'} />
          </div>
          <div>
            <label className={lc}>Email</label>
            <input value={user?.email || ''} disabled className={ic + ' bg-slate-50 text-slate-400 cursor-not-allowed'} />
          </div>
        </div>

        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Cambiar contraseña</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className={lc}>Contraseña actual</label>
            <input type="password" value={passForm.actual}
              onChange={e => setPassForm(p => ({ ...p, actual: e.target.value }))}
              className={ic} placeholder="••••••••" />
          </div>
          <div>
            <label className={lc}>Nueva contraseña</label>
            <input type="password" value={passForm.nuevo}
              onChange={e => setPassForm(p => ({ ...p, nuevo: e.target.value }))}
              className={ic} placeholder="••••••••" />
          </div>
          <div>
            <label className={lc}>Confirmar contraseña</label>
            <input type="password" value={passForm.confirmar}
              onChange={e => setPassForm(p => ({ ...p, confirmar: e.target.value }))}
              className={ic} placeholder="••••••••" />
          </div>
        </div>
        {passError && <p className="text-[13px] text-red-500 mb-3">{passError}</p>}
        <div className="flex items-center gap-3">
          <button onClick={handleChangePass}
            disabled={!passForm.actual || !passForm.nuevo || !passForm.confirmar || changePassMut.isPending}
            className="h-9 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-[10px] text-[13px] font-semibold transition-colors disabled:opacity-40 shadow-[0_4px_12px_-4px_rgba(14,165,233,0.45)]">
            {changePassMut.isPending ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
          {passOk && (
            <span className="flex items-center gap-1.5 text-[13px] text-emerald-600 font-medium">
              <CheckCircle2 size={14} />
              Contraseña actualizada
            </span>
          )}
        </div>
      </div>

      {/* Datos del negocio */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
        <div className="flex items-center -mx-5 px-5 pb-4 mb-5 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900 tracking-tight">Datos del negocio</p>
        </div>
        <div className="mb-5 pb-5 border-b border-slate-100">
          <label className={lc}>Logo de la empresa</label>
          <div className="flex items-start gap-4 mt-2">
            <div className="w-24 h-24 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
              {(logoPreview || empresa?.logoUrl) ? (
                <img src={logoPreview || empresa?.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <ImageIcon size={28} className="text-slate-300" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-[12px] text-slate-400 mb-3">JPG, PNG o WebP · máx. 2MB · 1MB máx en base64</p>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-1.5 h-9 px-4 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-[10px] text-[13px] font-semibold transition-colors cursor-pointer">
                  <Upload size={13} />
                  Seleccionar imagen
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleLogoSelect} />
                </label>
                {logoPreview && (
                  <button onClick={() => updateLogoMut.mutate(logoPreview)}
                    disabled={updateLogoMut.isPending}
                    className="h-9 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-[10px] text-[13px] font-semibold transition-colors disabled:opacity-40 shadow-[0_4px_12px_-4px_rgba(14,165,233,0.45)]">
                    {updateLogoMut.isPending ? 'Guardando...' : 'Guardar logo'}
                  </button>
                )}
                {logoPreview && (
                  <button onClick={() => setLogoPreview(null)}
                    className="h-9 px-3 text-slate-400 hover:text-slate-600 text-[13px] transition-colors">
                    Cancelar
                  </button>
                )}
              </div>
              {logoError && <p className="text-[12px] text-red-500 mt-2">{logoError}</p>}
              {!logoPreview && empresa?.logoUrl && (
                <p className="text-[11px] text-emerald-600 mt-2 font-medium flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  Logo guardado
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={lc}>Nombre de la empresa</label>
            <input value={empresaForm.nombre}
              onChange={e => setEmpresaForm(p => ({ ...p, nombre: e.target.value }))}
              className={ic} />
          </div>
          <div>
            <label className={lc}>Email de contacto</label>
            <input type="email" value={empresaForm.email}
              onChange={e => setEmpresaForm(p => ({ ...p, email: e.target.value }))}
              className={ic} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => updateEmpresaMut.mutate(empresaForm)}
            disabled={!empresaForm.nombre || updateEmpresaMut.isPending}
            className="h-9 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-[10px] text-[13px] font-semibold transition-colors disabled:opacity-40 shadow-[0_4px_12px_-4px_rgba(14,165,233,0.45)]">
            {updateEmpresaMut.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {savedOk && (
            <span className="flex items-center gap-1.5 text-[13px] text-emerald-600 font-medium">
              <CheckCircle2 size={14} />
              Datos actualizados
            </span>
          )}
        </div>
      </div>

      {/* Precios base */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
        <div className="flex items-center -mx-5 px-5 pb-4 mb-5 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900 tracking-tight">Precios base</p>
        </div>

        {/* Precio base */}
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
                <CheckCircle2 size={14} />
                Guardado
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">Costo fijo que se suma a todas las cotizaciones antes del material y opciones.</p>
        </div>

        {/* Materiales */}
        <div className="border-t border-slate-100 pt-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-slate-700">Materiales</p>
            <button onClick={() => setShowCreateMat(s => !s)}
              className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors">
              <Plus size={12} />
              Agregar
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
                          <Check size={12} />
                          Guardar
                        </button>
                        <button onClick={() => setEditMatId(null)}
                          className="flex items-center gap-1.5 h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[8px] text-[12px] font-semibold transition-colors">
                          <X size={12} />
                          Cancelar
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

        {/* Tramos de descuento */}
        <div className="border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-slate-700">Descuentos por volumen</p>
            <button onClick={() => setShowCreateTramo(s => !s)}
              className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors">
              <Plus size={12} />
              Agregar tramo
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
                          <Check size={12} />
                          Guardar
                        </button>
                        <button onClick={() => setEditTramoId(null)}
                          className="flex items-center gap-1.5 h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[8px] text-[12px] font-semibold transition-colors">
                          <X size={12} />
                          Cancelar
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
            <Plus size={12} />
            Nuevo campo
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
                <label className={lc}>
                  Valor del impacto ({nuevo.impactoTipo === 'PORCENTAJE' ? '%' : '$'})
                </label>
                <input type="number" value={nuevo.impactoValor} min="0" step="0.01"
                  onChange={e => setNuevo(p => ({ ...p, impactoValor: Number(e.target.value) }))}
                  className={ic} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-sky-200">
              <button onClick={createCampo} disabled={!nuevo.nombre || createMut.isPending}
                className="h-9 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-[10px] text-[13px] font-semibold transition-colors disabled:opacity-40 shadow-[0_4px_12px_-4px_rgba(14,165,233,0.45)]">
                {createMut.isPending ? 'Creando...' : 'Crear campo'}
              </button>
              <button onClick={() => { setShowNuevo(false); setNuevo(initNuevo); setNuevoOpciones('') }}
                className="h-9 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-[10px] text-[13px] font-semibold transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-[13px] text-slate-400">Cargando campos...</p>
        ) : campos.length === 0 && !showNuevo ? (
          <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
            <p className="text-[13px] text-slate-400 mb-1">No hay campos configurados</p>
            <p className="text-[12px] text-slate-300">Creá tu primer campo para personalizar las cotizaciones</p>
          </div>
        ) : (
          <div className="space-y-2">
            {campos.map(campo => (
              <div key={campo.id}
                className={`border rounded-xl transition-colors ${
                  editingId === campo.id ? 'border-sky-200 bg-sky-50/20' : 'border-slate-100'
                }`}>
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
                          <button onClick={() => deleteMut.mutate(campo.id)} disabled={deleteMut.isPending}
                            className="h-8 px-4 bg-red-500 hover:bg-red-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors disabled:opacity-40">
                            {deleteMut.isPending ? 'Eliminando...' : 'Sí, eliminar'}
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
                        <label className={lc}>
                          Valor ({editForm.impactoTipo === 'PORCENTAJE' ? '%' : '$'})
                        </label>
                        <input type="number" min="0" step="0.01"
                          value={editForm.impactoValor ?? ''}
                          onChange={e => setEditForm(p => ({ ...p, impactoValor: Number(e.target.value) }))}
                          className={ic} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(campo.id)} disabled={updateMut.isPending}
                        className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-[8px] text-[12px] font-semibold transition-colors disabled:opacity-40">
                        <Check size={12} />
                        Guardar cambios
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="flex items-center gap-1.5 h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[8px] text-[12px] font-semibold transition-colors">
                        <X size={12} />
                        Cancelar
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
    </div>
  )
}
