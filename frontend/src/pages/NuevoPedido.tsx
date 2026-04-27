import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { clientesApi, pedidosApi, camposApi, preciosApi } from '../services/api'
import { Cliente, CampoCustom } from '../types'
import { ArrowLeft, Calculator, Save, CheckCircle } from 'lucide-react'

interface Material {
  id: number
  nombre: string
  precioUnitario: number
}

interface TramoDescuento {
  id: number
  desdeUnidades: number
  porcentaje: number
}

type BreakdownItem = { label: string; delta: number }

function calcularPrecio(
  campos: CampoCustom[],
  cantidad: number,
  valoresCampos: Record<number, string>,
  precioBase: number,
  materialPrecioUnitario: number,
  tramos: TramoDescuento[]
): { unitario: number; total: number; descuentoPct: number; breakdown: BreakdownItem[] } {
  const breakdown: BreakdownItem[] = []
  breakdown.push({ label: 'Precio base', delta: precioBase })
  let precio = precioBase

  if (materialPrecioUnitario > 0) {
    breakdown.push({ label: 'Material', delta: materialPrecioUnitario })
    precio += materialPrecioUnitario
  }

  campos.forEach(c => {
    const val = valoresCampos[c.id]
    if (!val || val === 'false') return
    let delta = 0
    if (c.impactoTipo === 'PORCENTAJE') {
      delta = Math.round(precio * c.impactoValor / 100)
      precio *= (1 + c.impactoValor / 100)
      breakdown.push({ label: `${c.nombre} (+${c.impactoValor}%)`, delta })
    } else if (c.impactoTipo === 'FIJO') {
      delta = c.impactoValor
      precio += c.impactoValor
      breakdown.push({ label: `${c.nombre} (fijo)`, delta })
    } else if (c.impactoTipo === 'POR_UNIDAD') {
      delta = Math.round((Number(val) || 0) * c.impactoValor)
      precio += delta
      breakdown.push({ label: `${c.nombre} (×${val} u.)`, delta })
    }
  })

  const tramo = [...tramos]
    .sort((a, b) => b.desdeUnidades - a.desdeUnidades)
    .find(t => cantidad >= t.desdeUnidades)
  const descuentoPct = tramo?.porcentaje || 0
  if (descuentoPct > 0) {
    const delta = -Math.round(precio * descuentoPct / 100)
    breakdown.push({ label: `Descuento volumen (-${descuentoPct}%)`, delta })
    precio = precio * (1 - descuentoPct / 100)
  }

  return { unitario: Math.round(precio), total: Math.round(precio * cantidad), descuentoPct, breakdown }
}

export default function NuevoPedido() {
  const navigate = useNavigate()
  const [clienteId, setClienteId] = useState('')
  const [largo, setLargo] = useState('')
  const [ancho, setAncho] = useState('')
  const [alto, setAlto] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [cantidad, setCantidad] = useState('100')
  const [notasCliente, setNotasCliente] = useState('')
  const [entregaEst, setEntregaEst] = useState('')
  const [valoresCampos, setValoresCampos] = useState<Record<number, string>>({})
  const [precioUnitario, setPrecioUnitario] = useState(0)
  const [precioTotal, setPrecioTotal] = useState(0)
  const [descuentoPct, setDescuentoPct] = useState(0)
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([])

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: () => clientesApi.getAll().then(r => r.data)
  })

  const { data: campos = [] } = useQuery<CampoCustom[]>({
    queryKey: ['campos'],
    queryFn: () => camposApi.getAll().then(r => r.data)
  })

  const { data: precioConfig } = useQuery({
    queryKey: ['precio-config'],
    queryFn: () => preciosApi.getConfig().then(r => r.data)
  })

  const { data: materiales = [] } = useQuery<Material[]>({
    queryKey: ['materiales'],
    queryFn: () => preciosApi.getMateriales().then(r => r.data)
  })

  const { data: tramos = [] } = useQuery<TramoDescuento[]>({
    queryKey: ['tramos'],
    queryFn: () => preciosApi.getTramos().then(r => r.data)
  })

  const selectedMaterial = materiales.find(m => String(m.id) === materialId) || null

  const mutation = useMutation({
    mutationFn: (estado: string) => pedidosApi.create({
      clienteId: Number(clienteId),
      largo: largo ? Number(largo) : null,
      ancho: ancho ? Number(ancho) : null,
      alto: alto ? Number(alto) : null,
      material: selectedMaterial?.nombre || null,
      materialId: selectedMaterial?.id || null,
      cantidad: Number(cantidad),
      notasCliente: notasCliente || null,
      entregaEst: entregaEst || null,
      precioBase: precioConfig?.precioBase || 0,
      precioTotal,
      estado,
      valoresCampos: Object.entries(valoresCampos)
        .filter(([, v]) => v !== '' && v !== 'false')
        .map(([campoId, valor]) => ({ campoId: Number(campoId), valor }))
    }),
    onSuccess: (res) => navigate(`/pedidos/${res.data.id}`)
  })

  useEffect(() => {
    const cant = Number(cantidad) || 0
    const base = precioConfig?.precioBase || 0
    const matPrecio = selectedMaterial?.precioUnitario || 0
    const result = calcularPrecio(campos, cant, valoresCampos, base, matPrecio, tramos)
    setDescuentoPct(result.descuentoPct)
    setPrecioUnitario(result.unitario)
    setPrecioTotal(result.total)
    setBreakdown(result.breakdown)
  }, [cantidad, materialId, valoresCampos, campos, precioConfig, materiales, tramos, selectedMaterial])

  const ic = "w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
  const lc = "block text-xs font-medium text-gray-500 mb-1.5"
  const canSubmit = !!clienteId && !mutation.isPending

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/pedidos')}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={17} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Nuevo pedido</h1>
          <p className="text-sm text-gray-400">Completá los datos y cotizá en tiempo real</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">

          {/* Cliente */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Cliente</p>
            <label className={lc}>Seleccionar cliente *</label>
            <select value={clienteId} onChange={e => setClienteId(e.target.value)} className={ic}>
              <option value="">— Elegir cliente —</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}{c.tipo === 'B2B' && c.razonSocial ? ` — ${c.razonSocial}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Especificaciones */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Especificaciones</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              {[['Largo (cm)', largo, setLargo], ['Ancho (cm)', ancho, setAncho], ['Alto (cm)', alto, setAlto]].map(([label, val, setter]) => (
                <div key={label as string}>
                  <label className={lc}>{label as string}</label>
                  <input type="number" value={val as string}
                    onChange={e => (setter as (v: string) => void)(e.target.value)}
                    placeholder="0" min="0" step="0.1" className={ic} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className={lc}>Material</label>
                <select value={materialId} onChange={e => setMaterialId(e.target.value)} className={ic}>
                  <option value="">— Sin material —</option>
                  {materiales.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}{m.precioUnitario > 0 ? ` (+$${m.precioUnitario}/u)` : ''}
                    </option>
                  ))}
                </select>
                {materiales.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">Configurá materiales en Configuración →</p>
                )}
              </div>
              <div>
                <label className={lc}>Cantidad de unidades</label>
                <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} min="1" className={ic} />
                {descuentoPct > 0 && (
                  <p className="text-xs text-emerald-600 mt-1">✓ Descuento por volumen: -{descuentoPct}%</p>
                )}
              </div>
            </div>
            <div>
              <label className={lc}>Entrega estimada</label>
              <input type="date" value={entregaEst} onChange={e => setEntregaEst(e.target.value)} className={`${ic} max-w-xs`} />
            </div>
          </div>

          {/* Campos custom */}
          {campos.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Opciones adicionales</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {campos.map(campo => (
                  <div key={campo.id}>
                    <label className={lc}>
                      {campo.nombre}
                      {campo.impactoTipo === 'PORCENTAJE' && <span className="text-gray-300 ml-1">(+{campo.impactoValor}%)</span>}
                      {campo.impactoTipo === 'FIJO' && <span className="text-gray-300 ml-1">(+${campo.impactoValor})</span>}
                    </label>
                    {campo.tipo === 'BOOLEAN' ? (
                      <select value={valoresCampos[campo.id] || 'false'}
                        onChange={e => setValoresCampos(p => ({ ...p, [campo.id]: e.target.value }))} className={ic}>
                        <option value="false">No</option>
                        <option value="true">Sí</option>
                      </select>
                    ) : campo.tipo === 'SELECT' ? (
                      <select value={valoresCampos[campo.id] || ''}
                        onChange={e => setValoresCampos(p => ({ ...p, [campo.id]: e.target.value }))} className={ic}>
                        <option value="">— Seleccionar —</option>
                        {campo.opciones.map(o => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type="number" value={valoresCampos[campo.id] || ''}
                        onChange={e => setValoresCampos(p => ({ ...p, [campo.id]: e.target.value }))} className={ic} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className={lc}>Notas del pedido</label>
            <textarea value={notasCliente} onChange={e => setNotasCliente(e.target.value)}
              rows={3} placeholder="Colores Pantone, detalles del logo, arte adjunto..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
          </div>
        </div>

        {/* Cotización en tiempo real */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 lg:sticky lg:top-6">
            <div className="flex items-center gap-2 mb-5">
              <Calculator size={15} className="text-sky-500" />
              <p className="text-sm font-semibold text-gray-900">Cotización en tiempo real</p>
            </div>

            <div className="mb-5">
              {breakdown.length > 0 ? (
                <div className="space-y-1.5 mb-3">
                  {breakdown.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className={item.delta < 0 ? 'text-emerald-600' : i === 0 ? 'text-gray-500' : 'text-gray-400'}>
                        {i > 0 && item.delta >= 0 ? '+ ' : ''}{item.label}
                      </span>
                      <span className={`font-medium ${item.delta < 0 ? 'text-emerald-600' : 'text-gray-700'}`}>
                        {item.delta < 0 ? '-' : i > 0 ? '+' : ''}${Math.abs(item.delta).toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 mb-3">Configurá el precio base en Configuración para ver el desglose</p>
              )}
              <div className="border-t border-gray-100 pt-2.5 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Precio unitario</span>
                  <span className="font-semibold text-gray-900">${precioUnitario.toLocaleString('es-AR')}/u</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">× {Number(cantidad).toLocaleString('es-AR')} unidades</span>
                </div>
              </div>
              <div className="border-t border-gray-100 mt-2.5 pt-2.5 flex justify-between items-baseline">
                <span className="text-sm font-semibold text-gray-900">Total estimado</span>
                <span className="text-2xl font-bold text-sky-600">${precioTotal.toLocaleString('es-AR')}</span>
              </div>
            </div>

            {!clienteId && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-4">
                Seleccioná un cliente para continuar
              </p>
            )}

            <div className="space-y-2">
              <button onClick={() => mutation.mutate('COTIZACION')} disabled={!canSubmit}
                className="w-full h-11 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-40">
                <Save size={14} />
                Guardar cotización
              </button>
              <button onClick={() => mutation.mutate('CONFIRMADO')} disabled={!canSubmit}
                className="w-full h-11 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40">
                <CheckCircle size={14} />
                Confirmar pedido
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
