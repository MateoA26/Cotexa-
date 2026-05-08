import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { empresaApi, authApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Trash2, CheckCircle2, Image as ImageIcon, Upload } from 'lucide-react'

export default function Configuracion() {
  const { user, updateUser } = useAuth()
  const queryClient = useQueryClient()

  const [empresaForm, setEmpresaForm] = useState({ nombre: '', email: '' })
  const [savedOk, setSavedOk] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)

  const [perfilForm, setPerfilForm] = useState({ nombre: '', email: '' })
  const [savedPerfilOk, setSavedPerfilOk] = useState(false)

  const [passForm, setPassForm] = useState({ actual: '', nuevo: '', confirmar: '' })
  const [passError, setPassError] = useState('')
  const [passOk, setPassOk] = useState(false)

  useEffect(() => {
    if (user) setPerfilForm({ nombre: user.nombre || '', email: user.email || '' })
  }, [user?.id])

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
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('El archivo no puede superar 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string
      if (b64.length > 4 * 1024 * 1024) {
        setLogoError('La imagen es demasiado grande. Reducí la resolución.')
        return
      }
      setLogoPreview(b64)
    }
    reader.readAsDataURL(file)
  }

  const updatePerfilMut = useMutation({
    mutationFn: (data: { nombre?: string; email?: string }) => authApi.actualizarUsuario(data),
    onSuccess: (res) => {
      updateUser({ nombre: res.data.nombre, email: res.data.email })
      setSavedPerfilOk(true)
      setTimeout(() => setSavedPerfilOk(false), 3000)
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
        <p className="text-[13px] text-slate-400 mt-0.5">Administrá los datos de tu cuenta y negocio</p>
      </div>

      {/* Mi perfil */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
        <div className="flex items-center -mx-5 px-5 pb-4 mb-5 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900 tracking-tight">Mi perfil</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={lc}>Nombre</label>
            <input value={perfilForm.nombre}
              onChange={e => setPerfilForm(p => ({ ...p, nombre: e.target.value }))}
              className={ic} />
          </div>
          <div>
            <label className={lc}>Email</label>
            <input type="email" value={perfilForm.email}
              onChange={e => setPerfilForm(p => ({ ...p, email: e.target.value }))}
              className={ic} />
          </div>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => updatePerfilMut.mutate(perfilForm)}
            disabled={!perfilForm.nombre || updatePerfilMut.isPending}
            className="h-9 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-[10px] text-[13px] font-semibold transition-colors disabled:opacity-40 shadow-[0_4px_12px_-4px_rgba(14,165,233,0.45)]">
            {updatePerfilMut.isPending ? 'Guardando...' : 'Guardar perfil'}
          </button>
          {savedPerfilOk && (
            <span className="flex items-center gap-1.5 text-[13px] text-emerald-600 font-medium">
              <CheckCircle2 size={14} />
              Datos actualizados
            </span>
          )}
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
              <p className="text-[12px] text-slate-400 mb-3">JPG, PNG o WebP · máx. 5MB · 4MB máx en base64</p>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-1.5 h-9 px-4 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-[10px] text-[13px] font-semibold transition-colors cursor-pointer">
                  <Upload size={13} />
                  Seleccionar imagen
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleLogoSelect} />
                </label>
                {empresa?.logoUrl && !logoPreview && (
                  <button onClick={() => updateLogoMut.mutate('')}
                    disabled={updateLogoMut.isPending}
                    className="flex items-center gap-1.5 h-9 px-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-[10px] text-[13px] font-semibold transition-colors">
                    <Trash2 size={13} />
                    Eliminar logo
                  </button>
                )}
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
    </div>
  )
}
