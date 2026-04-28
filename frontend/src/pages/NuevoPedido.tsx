import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { clientesApi, pedidosApi, camposApi, preciosApi } from '../services/api'
import { Cliente, CampoCustom } from '../types'
import { ArrowLeft, Calculator, Save, CheckCircle2 } from 'lucide-react'

interface Material { id: number; nombre: string; precioUnitario: number }
interface TramoDescuento { id: number; desdeUnidades: number; porcentaje: number }
type BreakdownItem = { label: string; delta: number }

function calcularPrecio(
  campos: CampoCustom[], cantidad: number, valoresCampos: Record<number, string>,
  precioBase: number, materialPrecioUnitario: number, tramos: TramoDescuento[]
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
      delta = c.impactoValor; precio += c.impactoValor
      breakdown.push({ label: `${c.nombre} (fijo)`, delta })
    } else if (c.impactoTipo === 'POR_UNIDAD') {
      delta = Math.round((Number(val) || 0) * c.impactoValor)
      precio += delta
      breakdown.push({ label: `${c.nombre} (×${val} u.)`, delta })
    }
  })

  const tramo = [...tramos].sort((a, b) => b.desdeUnidades - a.desdeUnidades).find(t => cantidad >= t.desdeUnidades)
  const descuentoPct = tramo?.porcentaje || 0
  if (descuentoPct > 0) {
    const delta = -Math.round(precio * descuentoPct / 100)
    breakdown.push({ label: `Descuento volumen (-${descuentoPct}%)`, delta })
    precio = precio * (1 - descuentoPct / 100)
  }
  return { unitario: Math.round(precio), total: Math.round(precio * cantidad), descuentoPct, breakdown }
}

const ic = 'w-full h-10 px-3 border border-slate-200 rounded-[10px] text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-900 transition-all'
const lc = 'block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5'

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
    queryFn: () => clientesApi.getAll().then(r => r.data),
  })
  const { data: campos = [] } = useQuery<CampoCustom[]>({
    queryKey: ['campos'],
    queryFn: () => camposApi.getAll().then(r => r.data),
  })
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
        .map(([campoId, valor]) => ({ campoId: Number(campoId), valor })),
    }),
    onSuccess: (res) => navigate(`/pedidos/${res.data.id}`),
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

  const canSubmit = !!clienteId && !mutation.isPending

  return (
    <div className="max-w-[1360px] mx-auto px-7 py-7">

      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => navigate('/pedidos')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-[10px] text-[13px] font-medium hover:bg-slate-50 transition-colors">
          <ArrowLeft size={13} />
          Volver
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Nueva cotización</h1>
          <p className="text-sm text-slate-500 mt-1">Completá los datos y cotizá en tiempo real</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Left: form */}
        <div className="lg:col-span-7 space-y-5">

          {/* Cliente */}
          <div className="bg-white rounded-2xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900 tracking-tight">Cliente</p>
            </div>
            <div className="p-5">
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
          </div>

          {/* Especificaciones */}
          <div className="bg-white rounded-2xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900 tracking-tight">Especificaciones</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[['Largo (cm)', largo, setLargo], ['Ancho (cm)', ancho, setAncho], ['Alto (cm)', alto, setAlto]].map(([label, val, setter]) => (
                  <div key={label as string}>
                    <label className={lc}>{label as string}</label>
                    <input type="number" value={val as string}
                      onChange={e => (setter as (v: string) => void)(e.target.value)}
                      placeholder="0" min="0" step="0.1" className={ic} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <p className="text-[11px] text-slate-400 mt-1">Configurá materiales en Configuración</p>
                  )}
                </div>
                <div>
                  <label className={lc}>Cantidad de unidades</label>
                  <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} min="1" className={ic} />
                  {descuentoPct > 0 && (
                    <p className="text-[11px] text-emerald-600 mt-1 font-semibold">✓ Descuento por volumen: -{descuentoPct}%</p>
                  )}
                </div>
              </div>
              <div>
                <label className={lc}>Entrega estimada</label>
                <input type="date" value={entregaEst} onChange={e => setEntregaEst(e.target.value)} className={`${ic} max-w-xs`} />
              </div>
            </div>
          </div>

          {/* Opciones adicionales */}
          {campos.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 tracking-tight">Opciones adicionales</p>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {campos.map(campo => (
                    <div key={campo.id}>
                      <label className={lc}>
                        {campo.nombre}
                        {campo.impactoTipo === 'PORCENTAJE' && <span className="text-slate-400 ml-1 font-normal normal-case tracking-normal">(+{campo.impactoValor}%)</span>}
                        {campo.impactoTipo === 'FIJO' && <span className="text-slate-400 ml-1 font-normal normal-case tracking-normal">(+${campo.impactoValor})</span>}
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
            </div>
          )}

          {/* Notas */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <label className={lc}>Notas del pedido</label>
            <textarea value={notasCliente} onChange={e => setNotasCliente(e.target.value)}
              rows={3} placeholder="Colores Pantone, detalles del logo, arte adjunto..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-[10px] text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none bg-white text-slate-900 transition-all" />
          </div>
        </div>

        {/* Right: price panel */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200 lg:sticky lg:top-6">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Calculator size={14} className="text-sky-500" />
              <p className="text-sm font-semibold text-slate-900 tracking-tight">Cotización en tiempo real</p>
            </div>
            <div className="p-5">
              {breakdown.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {breakdown.map((item, i) => (
                    <div key={i} className="flex justify-between text-[13px]">
                      <span className={item.delta < 0 ? 'text-emerald-600' : i === 0 ? 'text-slate-500' : 'text-slate-400'}>
                        {i > 0 && item.delta >= 0 ? '+ ' : ''}{item.label}
                      </span>
                      <span className={`font-semibold font-mono tabular-nums ${item.delta < 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {item.delta < 0 ? '-' : i > 0 ? '+' : ''}${Math.abs(item.delta).toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-slate-400 mb-4">Configurá el precio base en Configuración para ver el desglose</p>
              )}

              <div className="border-t border-slate-100 pt-3 space-y-1 mb-1">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Precio unitario</span>
                  <span className="font-semibold text-slate-900 font-mono tabular-nums">${precioUnitario.toLocaleString('es-AR')}/u</span>
                </div>
                <div className="text-[13px] text-slate-400 font-mono tabular-nums">
                  × {Number(cantidad).toLocaleString('es-AR')} unidades
                </div>
              </div>
              <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between items-baseline mb-5">
                <span className="text-[13px] font-semibold text-slate-900">Total estimado</span>
                <span className="text-[28px] font-bold text-sky-600 font-mono tabular-nums leading-none">${precioTotal.toLocaleString('es-AR')}</span>
              </div>

              {!clienteId && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
                  <p className="text-[12px] text-amber-700 font-medium">Seleccioná un cliente para continuar</p>
                </div>
              )}

              <div className="space-y-2">
                <button onClick={() => mutation.mutate('COTIZACION')} disabled={!canSubmit}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-[10px] text-[13px] font-medium hover:bg-slate-50 transition-colors disabled:opacity-40">
                  <Save size={13} />
                  Guardar cotización
                </button>
                <button onClick={() => mutation.mutate('CONFIRMADO')} disabled={!canSubmit}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-[10px] text-[13px] font-semibold shadow-[0_4px_12px_-4px_rgba(14,165,233,0.4)] transition-colors disabled:opacity-40">
                  <CheckCircle2 size={13} />
                  Confirmar pedido
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
