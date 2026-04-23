import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { camposApi, empresaApi, authApi } from '../services/api'
import { CampoCustom } from '../types'
import { useAuth } from '../context/AuthContext'
import { Plus, Trash2, Edit2, Check, X, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'

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

  const ic = 'w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500'
  const lc = 'block text-xs font-medium text-gray-600 mb-1'

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

      {/* Mi perfil */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Mi perfil</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className={lc}>Nombre</label>
            <input value={user?.nombre || ''} disabled className={ic + ' bg-gray-50 text-gray-500 cursor-not-allowed'} />
          </div>
          <div>
            <label className={lc}>Email</label>
            <input value={user?.email || ''} disabled className={ic + ' bg-gray-50 text-gray-500 cursor-not-allowed'} />
          </div>
        </div>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Cambiar contraseña</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className={lc}>Contraseña actual</label>
            <input
              type="password"
              value={passForm.actual}
              onChange={e => setPassForm(p => ({ ...p, actual: e.target.value }))}
              className={ic}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className={lc}>Nueva contraseña</label>
            <input
              type="password"
              value={passForm.nuevo}
              onChange={e => setPassForm(p => ({ ...p, nuevo: e.target.value }))}
              className={ic}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className={lc}>Confirmar contraseña</label>
            <input
              type="password"
              value={passForm.confirmar}
              onChange={e => setPassForm(p => ({ ...p, confirmar: e.target.value }))}
              className={ic}
              placeholder="••••••••"
            />
          </div>
        </div>
        {passError && <p className="text-sm text-red-500 mb-3">{passError}</p>}
        <div className="flex items-center gap-3">
          <button
            onClick={handleChangePass}
            disabled={!passForm.actual || !passForm.nuevo || !passForm.confirmar || changePassMut.isPending}
            className="h-9 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
          >
            {changePassMut.isPending ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
          {passOk && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 size={15} />
              Contraseña actualizada
            </span>
          )}
        </div>
      </div>

      {/* Datos del negocio */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Datos del negocio</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={lc}>Nombre de la empresa</label>
            <input
              value={empresaForm.nombre}
              onChange={e => setEmpresaForm(p => ({ ...p, nombre: e.target.value }))}
              className={ic}
            />
          </div>
          <div>
            <label className={lc}>Email de contacto</label>
            <input
              type="email"
              value={empresaForm.email}
              onChange={e => setEmpresaForm(p => ({ ...p, email: e.target.value }))}
              className={ic}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => updateEmpresaMut.mutate(empresaForm)}
            disabled={!empresaForm.nombre || updateEmpresaMut.isPending}
            className="h-9 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
          >
            {updateEmpresaMut.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {savedOk && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 size={15} />
              Datos actualizados correctamente
            </span>
          )}
        </div>
      </div>

      {/* Campos del cotizador */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Campos del cotizador</p>
          <button
            onClick={() => setShowNuevo(s => !s)}
            className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Plus size={13} />
            Nuevo campo
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Los campos aparecen en el formulario de cotización y afectan el precio según su configuración.
        </p>

        {showNuevo && (
          <div className="border border-sky-200 bg-sky-50/40 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-gray-800 mb-4">Nuevo campo personalizado</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lc}>Nombre del campo</label>
                <input
                  value={nuevo.nombre}
                  onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="ej. Barniz UV, Troquelado..."
                  className={ic}
                />
              </div>
              <div>
                <label className={lc}>Tipo de entrada</label>
                <select
                  value={nuevo.tipo}
                  onChange={e => setNuevo(p => ({ ...p, tipo: e.target.value as any }))}
                  className={ic}
                >
                  {TIPOS_CAMPO.map(t => <option key={t} value={t}>{tipoLabel[t]}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">{tipoDesc[nuevo.tipo]}</p>
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
              <div>
                <label className={lc}>Tipo de impacto en precio</label>
                <select
                  value={nuevo.impactoTipo}
                  onChange={e => setNuevo(p => ({ ...p, impactoTipo: e.target.value as any }))}
                  className={ic}
                >
                  {IMPACTO_TIPOS.map(t => <option key={t} value={t}>{impactoLabel[t]}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">{impactoDesc[nuevo.impactoTipo]}</p>
              </div>
              <div>
                <label className={lc}>
                  Valor del impacto ({nuevo.impactoTipo === 'PORCENTAJE' ? '%' : '$'})
                </label>
                <input
                  type="number"
                  value={nuevo.impactoValor}
                  min="0"
                  step="0.01"
                  onChange={e => setNuevo(p => ({ ...p, impactoValor: Number(e.target.value) }))}
                  className={ic}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-sky-200">
              <button
                onClick={createCampo}
                disabled={!nuevo.nombre || createMut.isPending}
                className="h-9 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
              >
                {createMut.isPending ? 'Creando...' : 'Crear campo'}
              </button>
              <button
                onClick={() => { setShowNuevo(false); setNuevo(initNuevo); setNuevoOpciones('') }}
                className="h-9 px-4 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-400">Cargando campos...</p>
        ) : campos.length === 0 && !showNuevo ? (
          <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
            <p className="text-sm text-gray-400 mb-2">No hay campos configurados</p>
            <p className="text-xs text-gray-300">Creá tu primer campo para personalizar las cotizaciones</p>
          </div>
        ) : (
          <div className="space-y-2">
            {campos.map(campo => (
              <div
                key={campo.id}
                className={`border rounded-xl transition-colors ${
                  editingId === campo.id ? 'border-sky-200 bg-sky-50/20' : 'border-gray-100'
                }`}
              >
                {confirmDelete === campo.id ? (
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle size={16} className="text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-0.5">¿Eliminar "{campo.nombre}"?</p>
                        <p className="text-xs text-gray-500 mb-3">
                          Esto eliminará el campo del cotizador. Los valores guardados en cotizaciones existentes se mantendrán, pero no podrás ver ni editar este campo en nuevas cotizaciones.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => deleteMut.mutate(campo.id)}
                            disabled={deleteMut.isPending}
                            className="h-8 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
                          >
                            {deleteMut.isPending ? 'Eliminando...' : 'Sí, eliminar'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="h-8 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                          >
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
                        <input
                          value={editForm.nombre || ''}
                          onChange={e => setEditForm(p => ({ ...p, nombre: e.target.value }))}
                          className={ic}
                        />
                      </div>
                      <div>
                        <label className={lc}>Tipo de entrada</label>
                        <select
                          value={editForm.tipo || ''}
                          onChange={e => setEditForm(p => ({ ...p, tipo: e.target.value as any }))}
                          className={ic}
                        >
                          {TIPOS_CAMPO.map(t => <option key={t} value={t}>{tipoLabel[t]}</option>)}
                        </select>
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
                      <div>
                        <label className={lc}>Tipo de impacto</label>
                        <select
                          value={editForm.impactoTipo || ''}
                          onChange={e => setEditForm(p => ({ ...p, impactoTipo: e.target.value as any }))}
                          className={ic}
                        >
                          {IMPACTO_TIPOS.map(t => <option key={t} value={t}>{impactoLabel[t]}</option>)}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">{editForm.impactoTipo ? impactoDesc[editForm.impactoTipo] : ''}</p>
                      </div>
                      <div>
                        <label className={lc}>
                          Valor ({editForm.impactoTipo === 'PORCENTAJE' ? '%' : '$'})
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm.impactoValor ?? ''}
                          onChange={e => setEditForm(p => ({ ...p, impactoValor: Number(e.target.value) }))}
                          className={ic}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(campo.id)}
                        disabled={updateMut.isPending}
                        className="flex items-center gap-1.5 h-8 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                      >
                        <Check size={13} />
                        Guardar cambios
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
                  <div className="flex items-start justify-between gap-3 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold text-gray-900">{campo.nombre}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                          {tipoLabel[campo.tipo]}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Info size={11} className="text-gray-300 flex-shrink-0" />
                        <p className="text-xs text-gray-400">
                          {impactoLabel[campo.impactoTipo]}{': '}
                          <span className="font-medium text-gray-600">
                            {campo.impactoTipo === 'PORCENTAJE' ? `${campo.impactoValor}%` : `$${campo.impactoValor}`}
                          </span>
                          {campo.tipo === 'SELECT' && campo.opciones.length > 0 &&
                            ` · Opciones: ${campo.opciones.join(', ')}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => startEdit(campo)}
                        className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(campo.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
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