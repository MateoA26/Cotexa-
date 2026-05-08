import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api, { clientesApi, pedidosApi, camposApi, preciosApi, empresaApi } from '../services/api'
import { Cliente, CampoCustom } from '../types'
import { ArrowLeft, Calculator, Save, CheckCircle2 } from 'lucide-react'

interface Material { id: number; nombre: string; precioUnitario: number }
interface TramoDescuento { id: number; desdeUnidades: number; porcentaje: number }
type BreakdownItem = { label: string; delta: number }
interface TipoCaja { id: number; nombre: string; formulaAncho: string; formulaLargo: string }
interface ProveedorMaterial { id: number; proveedor: string; material: string; precioM2: number }
interface CostoAdicional { id: number; nombre: string; tipo: string; valor: number }

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

function calcularLumapack(
  tipoCaja: { formulaAncho: string; formulaLargo: string } | null,
  E: number, F: number, G: number,
  precioM2: number,
  cantidad: number,
  factor: number,
  costos: { tipo: string; valor: number }[]
): { anchoPlancha: number; largoPlancha: number; superficieM2: number; costoBase: number; costosExtra: number; costoTotal: number; precioUnitario: number; gananciaUnitaria: number; precioTotal: number } | null {
  if (!tipoCaja || !E || !F || !G || !precioM2 || !cantidad) return null

  const evalFormula = (formula: string): number => {
    try {
      const expr = formula
        .replace(/E/g, String(E))
        .replace(/F/g, String(F))
        .replace(/G/g, String(G))
      return new Function('"use strict"; return (' + expr + ')')() as number
    } catch { return 0 }
  }

  const anchoPlancha = evalFormula(tipoCaja.formulaAncho)
  const largoPlancha = evalFormula(tipoCaja.formulaLargo)
  const superficieM2 = (anchoPlancha * largoPlancha) / 1000000
  const costoBase = superficieM2 * precioM2 * cantidad

  let costosExtra = 0
  costos.forEach(c => {
    if (c.tipo === 'POR_M2') costosExtra += c.valor * superficieM2 * cantidad
    else costosExtra += c.valor * cantidad
  })

  const costoTotal = costoBase + costosExtra
  const precioUnitario = costoTotal / cantidad * (1 + factor)
  const gananciaUnitaria = precioUnitario - (costoTotal / cantidad)
  const precioTotalFinal = precioUnitario * cantidad

  return { anchoPlancha, largoPlancha, superficieM2, costoBase, costosExtra, costoTotal, precioUnitario, gananciaUnitaria, precioTotal: precioTotalFinal }
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

  const [tipoCajaId, setTipoCajaId] = useState<number | null>(null)
  const [E, setE] = useState('')
  const [F, setF] = useState('')
  const [G, setG] = useState('')
  const [proveedorMatId, setProveedorMatId] = useState<number | null>(null)
  const [factorMargen, setFactorMargen] = useState(0.5)
  const [costosSeleccionados, setCostosSeleccionados] = useState<number[]>([])

  const { data: empresa } = useQuery({
    queryKey: ['empresa'],
    queryFn: () => empresaApi.get().then(r => r.data),
  })
  const isLumapack = empresa?.slug === 'lumapack'

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
  const { data: tiposCaja = [] } = useQuery<TipoCaja[]>({
    queryKey: ['tipos-caja'],
    queryFn: () => api.get('/cotizador-avanzado/tipos-caja').then(r => r.data),
    enabled: isLumapack,
  })
  const { data: proveedoresMat = [] } = useQuery<ProveedorMaterial[]>({
    queryKey: ['proveedores-mat'],
    queryFn: () => api.get('/cotizador-avanzado/proveedores').then(r => r.data),
    enabled: isLumapack,
  })
  const { data: costosAdicionales = [] } = useQuery<CostoAdicional[]>({
    queryKey: ['costos-adicionales'],
    queryFn: () => api.get('/cotizador-avanzado/costos').then(r => r.data),
    enabled: isLumapack,
  })

  const selectedMaterial = materiales.find(m => String(m.id) === materialId) || null
  const selectedTipoCaja = tiposCaja.find(t => t.id === tipoCajaId) || null
  const selectedProvMat = proveedoresMat.find(p => p.id === proveedorMatId) || null
  const activeCostos = costosAdicionales.filter(c => costosSeleccionados.includes(c.id))
  const lumaResult = calcularLumapack(
    selectedTipoCaja,
    Number(E), Number(F), Number(G),
    selectedProvMat?.precioM2 || 0,
    Number(cantidad),
    factorMargen,
    activeCostos
  )

  const mutation = useMutation({
    mutationFn: (estado: string) => {
      if (isLumapack && lumaResult) {
        return pedidosApi.create({
          clienteId: Number(clienteId),
          largo: E ? Number(E) : null,
          ancho: F ? Number(F) : null,
          alto: G ? Number(G) : null,
          material: selectedProvMat ? `${selectedProvMat.proveedor} — ${selectedProvMat.material}` : null,
          materialId: null,
          cantidad: Number(cantidad),
          notasCliente: notasCliente || null,
          entregaEst: entregaEst || null,
          precioBase: lumaResult.costoBase,
          precioTotal: lumaResult.precioTotal,
          estado,
          notasAdmin: JSON.stringify({
            lumapack: {
              tipoCajaId: tipoCajaId,
              proveedorMatId: proveedorMatId,
              factor: factorMargen,
            },
            anchoPlancha: lumaResult.anchoPlancha,
            largoPlancha: lumaResult.largoPlancha,
            superficieM2: lumaResult.superficieM2,
          }),
          valoresCampos: [],
        })
      }
      return pedidosApi.create({
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
      })
    },
    onSuccess: (res) => navigate(`/pedidos/${res.data.id}`),
  })

  useEffect(() => {
    if (isLumapack) return
    const cant = Number(cantidad) || 0
    const base = precioConfig?.precioBase || 0
    const matPrecio = selectedMaterial?.precioUnitario || 0
    const result = calcularPrecio(campos, cant, valoresCampos, base, matPrecio, tramos)
    setDescuentoPct(result.descuentoPct)
    setPrecioUnitario(result.unitario)
    setPrecioTotal(result.total)
    setBreakdown(result.breakdown)
  }, [isLumapack, cantidad, materialId, valoresCampos, campos, precioConfig, materiales, tramos, selectedMaterial])

  const canSubmit = !!clienteId && !mutation.isPending && (!isLumapack || !!lumaResult)

  const clienteSection = (
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
  )

  const actionButtons = (
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
  )

  return (
    <div className="max-w-[1360px] mx-auto px-7 py-7">

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

        <div className="lg:col-span-7 space-y-5">
          {isLumapack ? (
            <>
              {clienteSection}

              {/* Caja */}
              <div className="bg-white rounded-2xl border border-slate-200">
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 tracking-tight">Caja</p>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className={lc}>Tipo de caja</label>
                    <select value={tipoCajaId ?? ''} onChange={e => setTipoCajaId(e.target.value ? Number(e.target.value) : null)} className={ic}>
                      <option value="">— Elegir tipo —</option>
                      {tiposCaja.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {([['Alto (E)', E, setE], ['Ancho (F)', F, setF], ['Largo (G)', G, setG]] as [string, string, (v: string) => void][]).map(([label, val, setter]) => (
                      <div key={label}>
                        <label className={lc}>{label} <span className="normal-case font-normal tracking-normal text-slate-400">mm</span></label>
                        <input type="number" value={val} onChange={e => setter(e.target.value)} placeholder="0" min="0" className={ic} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Material */}
              <div className="bg-white rounded-2xl border border-slate-200">
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 tracking-tight">Material</p>
                </div>
                <div className="p-5">
                  <label className={lc}>Proveedor / Material</label>
                  <select value={proveedorMatId ?? ''} onChange={e => setProveedorMatId(e.target.value ? Number(e.target.value) : null)} className={ic}>
                    <option value="">— Elegir material —</option>
                    {proveedoresMat.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.proveedor} — {p.material} (${p.precioM2}/m²)
                      </option>
                    ))}
                  </select>
                  {selectedProvMat && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                        ${selectedProvMat.precioM2.toLocaleString('es-AR')}/m²
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cantidad */}
              <div className="bg-white rounded-2xl border border-slate-200">
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 tracking-tight">Cantidad</p>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lc}>Cantidad de unidades</label>
                      <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} min="1" className={ic} />
                    </div>
                    <div>
                      <label className={lc}>Entrega estimada</label>
                      <input type="date" value={entregaEst} onChange={e => setEntregaEst(e.target.value)} className={ic} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Factor de margen */}
              <div className="bg-white rounded-2xl border border-slate-200">
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 tracking-tight">Factor de margen</p>
                </div>
                <div className="p-5">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Factor: {(factorMargen * 100).toFixed(0)}%
                  </p>
                  <input
                    type="range" min={0} max={1} step={0.05}
                    value={factorMargen}
                    onChange={e => setFactorMargen(Number(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Costos adicionales */}
              {costosAdicionales.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900 tracking-tight">Costos adicionales</p>
                  </div>
                  <div className="p-5 space-y-2.5">
                    {costosAdicionales.map(c => (
                      <label key={c.id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={costosSeleccionados.includes(c.id)}
                          onChange={e => setCostosSeleccionados(prev =>
                            e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id)
                          )}
                          className="w-4 h-4 rounded accent-sky-500"
                        />
                        <span className="text-[13px] text-slate-700 flex-1">{c.nombre}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.tipo === 'POR_M2' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                          {c.tipo === 'POR_M2' ? 'POR M²' : 'FIJO'}
                        </span>
                        <span className="text-[12px] text-slate-500 font-mono tabular-nums">${c.valor.toLocaleString('es-AR')}</span>
                      </label>
                    ))}
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

              {/* Buttons */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                {!clienteId && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
                    <p className="text-[12px] text-amber-700 font-medium">Seleccioná un cliente para continuar</p>
                  </div>
                )}
                {actionButtons}
              </div>
            </>
          ) : (
            <>
              {clienteSection}

              {/* Especificaciones */}
              <div className="bg-white rounded-2xl border border-slate-200">
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 tracking-tight">Especificaciones</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {([['Largo (cm)', largo, setLargo], ['Ancho (cm)', ancho, setAncho], ['Alto (cm)', alto, setAlto]] as [string, string, (v: string) => void][]).map(([label, val, setter]) => (
                      <div key={label}>
                        <label className={lc}>{label}</label>
                        <input type="number" value={val} onChange={e => setter(e.target.value)} placeholder="0" min="0" step="0.1" className={ic} />
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
            </>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-5">
          {isLumapack ? (
            <div className="bg-slate-900 rounded-2xl lg:sticky lg:top-6 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
                <Calculator size={14} className="text-sky-400" />
                <p className="text-sm font-semibold text-white tracking-tight">Cotización en tiempo real</p>
              </div>
              <div className="p-5">
                {lumaResult ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-slate-400">Ancho plancha</span>
                        <span className="text-white font-mono tabular-nums">{lumaResult.anchoPlancha.toFixed(1)} cm</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-slate-400">Largo plancha</span>
                        <span className="text-white font-mono tabular-nums">{lumaResult.largoPlancha.toFixed(1)} cm</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-slate-400">Superficie</span>
                        <span className="text-white font-mono tabular-nums">{lumaResult.superficieM2.toFixed(4)} m²</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-700 pt-3 space-y-1.5">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-slate-400">Costo cartón</span>
                        <span className="text-white font-mono tabular-nums">${lumaResult.costoBase.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-slate-400">Costos adicionales</span>
                        <span className="text-white font-mono tabular-nums">${lumaResult.costosExtra.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-slate-400">Costo total</span>
                        <span className="text-white font-semibold font-mono tabular-nums">${lumaResult.costoTotal.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-700 pt-3 space-y-1.5">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-slate-400">Factor margen</span>
                        <span className="text-white font-mono tabular-nums">{(factorMargen * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-slate-400">Precio unitario</span>
                        <span className="text-sky-400 font-bold text-xl font-mono tabular-nums">${lumaResult.precioUnitario.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-slate-400">Ganancia unitaria</span>
                        <span className="text-emerald-400 font-semibold font-mono tabular-nums">${lumaResult.gananciaUnitaria.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-700 mt-1 pt-4 flex justify-between items-baseline">
                      <span className="text-[13px] font-semibold text-white">TOTAL</span>
                      <span className="text-[28px] font-bold text-sky-400 font-mono tabular-nums leading-none">${lumaResult.precioTotal.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-16">
                    <p className="text-[12px] text-slate-500 text-center">Completá los campos para ver la cotización</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
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

                {actionButtons}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
