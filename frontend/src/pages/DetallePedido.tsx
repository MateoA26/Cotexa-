import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pedidosApi, camposApi } from '../services/api'
import { Pedido, CampoCustom } from '../types'
import { ESTADO_LABELS, ESTADO_COLORS, ESTADOS_ORDEN } from '../utils/estados'
import { ArrowLeft, Edit2, Download, Calculator } from 'lucide-react'

const PRECIO_BASE = 150
const MATERIALES = ['Cartón corrugado', 'Cartón microcorrugado', 'Kraft', 'Cartulina', 'Otro']
const IMPRESIONES = [
  { value: 'sin_impresion', label: 'Sin impresión', recargo: 0 },
  { value: 'un_color', label: 'Un color', recargo: 0.15 },
  { value: 'full_color', label: 'Full color', recargo: 0.35 },
]
const DESCUENTOS = [
  { desde: 5000, desc: 0.20 },
  { desde: 1000, desc: 0.15 },
  { desde: 500, desc: 0.10 },
  { desde: 250, desc: 0.05 },
]

type BreakdownItem = { label: string; delta: number }

function calcularPrecio(
  campos: CampoCustom[],
  impresion: string,
  cantidad: number,
  valoresCampos: Record<number, string>
): { unitario: number; total: number; descuento: number; breakdown: BreakdownItem[] } {
  const breakdown: BreakdownItem[] = [{ label: 'Precio base', delta: PRECIO_BASE }]
  let precio = PRECIO_BASE

  const recImp = IMPRESIONES.find(i => i.value === impresion)?.recargo || 0
  if (recImp > 0) {
    const label = IMPRESIONES.find(i => i.value === impresion)!.label
    const delta = Math.round(precio * recImp)
    precio = precio * (1 + recImp)
    breakdown.push({ label: `${label} (+${recImp * 100}%)`, delta })
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

  const descObj = DESCUENTOS.find(d => cantidad >= d.desde)
  const descuento = descObj?.desc || 0
  if (descuento > 0) {
    const delta = -Math.round(precio * descuento)
    breakdown.push({ label: `Descuento volumen (-${descuento * 100}%)`, delta })
    precio = precio * (1 - descuento)
  }

  return { unitario: Math.round(precio), total: Math.round(precio * cantidad), descuento, breakdown }
}

function printQuote(pedido: Pedido) {
  const logoUrl = `${window.location.origin}/Imagenes/Copia de Logo fondo azul.png`
  const win = window.open('', '_blank', 'width=850,height=700')
  if (!win) return

  const fecha = new Date(pedido.createdAt).toLocaleDateString('es-AR')
  const entrega = pedido.entregaEst ? new Date(pedido.entregaEst).toLocaleDateString('es-AR') : '—'
  const impLabel = IMPRESIONES.find(i => i.value === pedido.impresion)?.label || pedido.impresion || '—'

  const specRows = [
    pedido.largo != null ? ['Medidas', `${pedido.largo} × ${pedido.ancho} × ${pedido.alto} cm`] : null,
    pedido.material ? ['Material', pedido.material] : null,
    ['Impresión', impLabel],
    pedido.cantidad != null ? ['Cantidad', `${pedido.cantidad.toLocaleString('es-AR')} u.`] : null,
    ['Entrega estimada', entrega],
  ].filter(Boolean) as string[][]

  const specHtml = specRows.map(([k, v]) =>
    `<tr><td class="lc">${k}</td><td class="vc">${v}</td></tr>`
  ).join('')

  const camposHtml = (pedido.valoresCampos || []).map(vc =>
    `<tr><td class="lc">${vc.campo.nombre}</td><td class="vc">${vc.valor === 'true' ? 'Sí' : vc.valor === 'false' ? 'No' : vc.valor}</td></tr>`
  ).join('')

  win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Cotización #${pedido.numeroPedido} — Cotexa</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#111827;padding:40px 48px;background:#fff}
    .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2px solid #0284c7;margin-bottom:28px}
    .logo{height:44px;width:auto;object-fit:contain}
    .title-block{text-align:right}
    .doc-title{font-size:24px;font-weight:800;color:#0284c7;letter-spacing:-0.5px}
    .doc-meta{font-size:12px;color:#6b7280;margin-top:4px}
    .badge{display:inline-block;margin-top:6px;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:600;background:#e0f2fe;color:#0369a1}
    .sec{margin-bottom:22px}
    .sec-title{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:8px}
    .card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px}
    .cn{font-size:15px;font-weight:700}
    .cs{font-size:12px;color:#6b7280;margin-top:3px}
    table{width:100%;border-collapse:collapse}
    .lc{width:40%;padding:8px 10px;font-size:12px;color:#6b7280;border-bottom:1px solid #f3f4f6}
    .vc{padding:8px 10px;font-size:13px;font-weight:500;border-bottom:1px solid #f3f4f6}
    .total{display:flex;justify-content:flex-end;align-items:center;gap:16px;margin-top:24px;padding-top:20px;border-top:2px solid #0284c7}
    .tl{font-size:14px;font-weight:600;color:#374151}
    .ta{font-size:28px;font-weight:800;color:#0284c7}
    .notes{font-size:12px;color:#4b5563;font-style:italic;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px}
    .footer{margin-top:40px;padding-top:14px;border-top:1px solid #e5e7eb;text-align:center;font-size:10px;color:#9ca3af}
    @media print{body{padding:20px 28px}}
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoUrl}" class="logo" alt="Cotexa" onerror="this.style.display='none'"/>
    <div class="title-block">
      <div class="doc-title">COTIZACIÓN</div>
      <div class="doc-meta">N° ${pedido.numeroPedido} &nbsp;·&nbsp; ${fecha}</div>
      <span class="badge">${ESTADO_LABELS[pedido.estado] || pedido.estado}</span>
    </div>
  </div>
  <div class="sec">
    <div class="sec-title">Cliente</div>
    <div class="card">
      <div class="cn">${pedido.cliente.nombre}</div>
      ${pedido.cliente.razonSocial ? `<div class="cs">${pedido.cliente.razonSocial}</div>` : ''}
      ${pedido.cliente.email ? `<div class="cs">${pedido.cliente.email}</div>` : ''}
      ${pedido.cliente.telefono ? `<div class="cs">${pedido.cliente.telefono}</div>` : ''}
    </div>
  </div>
  <div class="sec">
    <div class="sec-title">Especificaciones</div>
    <table><tbody>${specHtml}</tbody></table>
  </div>
  ${camposHtml ? `<div class="sec"><div class="sec-title">Opciones adicionales</div><table><tbody>${camposHtml}</tbody></table></div>` : ''}
  ${pedido.notasCliente ? `<div class="sec"><div class="sec-title">Notas del pedido</div><div class="notes">${pedido.notasCliente}</div></div>` : ''}
  <div class="total">
    <span class="tl">Total estimado</span>
    <span class="ta">$${pedido.precioTotal?.toLocaleString('es-AR') || '—'}</span>
  </div>
  <div class="footer">Cotexa · Plataforma de gestión de pedidos y cotizaciones · Este documento es una cotización, no una factura.</div>
</body>
</html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 600)
}

export default function DetallePedido() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [notasAdmin, setNotasAdmin] = useState('')
  const [notasSaved, setNotasSaved] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editLargo, setEditLargo] = useState('')
  const [editAncho, setEditAncho] = useState('')
  const [editAlto, setEditAlto] = useState('')
  const [editMaterial, setEditMaterial] = useState(MATERIALES[0])
  const [editImpresion, setEditImpresion] = useState('sin_impresion')
  const [editCantidad, setEditCantidad] = useState('100')
  const [editEntregaEst, setEditEntregaEst] = useState('')
  const [editNotasCliente, setEditNotasCliente] = useState('')
  const [editValoresCampos, setEditValoresCampos] = useState<Record<number, string>>({})
  const [editPrecioUnitario, setEditPrecioUnitario] = useState(PRECIO_BASE)
  const [editPrecioTotal, setEditPrecioTotal] = useState(0)
  const [editDescuento, setEditDescuento] = useState(0)
  const [editBreakdown, setEditBreakdown] = useState<BreakdownItem[]>([{ label: 'Precio base', delta: PRECIO_BASE }])

  const { data: pedido, isLoading } = useQuery<Pedido>({
    queryKey: ['pedido', id],
    queryFn: async () => {
      const res = await pedidosApi.getOne(Number(id))
      setNotasAdmin(res.data.notasAdmin || '')
      return res.data
    }
  })

  const { data: campos = [] } = useQuery<CampoCustom[]>({
    queryKey: ['campos'],
    queryFn: () => camposApi.getAll().then(r => r.data),
    enabled: isEditing,
  })

  const mutation = useMutation({
    mutationFn: (data: any) => pedidosApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido', id] })
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    }
  })

  useEffect(() => {
    if (!isEditing) return
    const cant = Number(editCantidad) || 0
    const result = calcularPrecio(campos, editImpresion, cant, editValoresCampos)
    setEditDescuento(result.descuento)
    setEditPrecioUnitario(result.unitario)
    setEditPrecioTotal(result.total)
    setEditBreakdown(result.breakdown)
  }, [editCantidad, editImpresion, editValoresCampos, campos, isEditing])

  const startEditing = () => {
    if (!pedido) return
    setEditLargo(pedido.largo?.toString() ?? '')
    setEditAncho(pedido.ancho?.toString() ?? '')
    setEditAlto(pedido.alto?.toString() ?? '')
    setEditMaterial(pedido.material || MATERIALES[0])
    setEditImpresion(pedido.impresion || 'sin_impresion')
    setEditCantidad(pedido.cantidad?.toString() ?? '100')
    setEditEntregaEst(pedido.entregaEst ? pedido.entregaEst.split('T')[0] : '')
    setEditNotasCliente(pedido.notasCliente || '')
    const vc: Record<number, string> = {}
    pedido.valoresCampos?.forEach(v => { vc[v.campoId] = v.valor })
    setEditValoresCampos(vc)
    setIsEditing(true)
  }

  const saveEdit = async () => {
    await mutation.mutateAsync({
      largo: editLargo ? Number(editLargo) : null,
      ancho: editAncho ? Number(editAncho) : null,
      alto: editAlto ? Number(editAlto) : null,
      material: editMaterial,
      impresion: editImpresion,
      cantidad: Number(editCantidad),
      entregaEst: editEntregaEst || null,
      notasCliente: editNotasCliente || null,
      precioBase: PRECIO_BASE,
      precioTotal: editPrecioTotal,
      valoresCampos: Object.entries(editValoresCampos)
        .filter(([, v]) => v !== '' && v !== 'false')
        .map(([campoId, valor]) => ({ campoId: Number(campoId), valor }))
    })
    setIsEditing(false)
  }

  const saveNotas = async () => {
    await mutation.mutateAsync({ notasAdmin })
    setNotasSaved(true)
    setTimeout(() => setNotasSaved(false), 2000)
  }

  if (isLoading) return <div className="p-8 text-[13px] text-slate-400">Cargando...</div>
  if (!pedido) return null

  const estadoIdx = ESTADOS_ORDEN.indexOf(pedido.estado)
  const estadosProgreso = ESTADOS_ORDEN.filter(e => e !== 'CANCELADO')

  const ic = 'w-full h-10 px-3 border border-slate-200 rounded-[10px] text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white'
  const lc = 'block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5'

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-7">

      {/* Header */}
      <div className="flex items-start gap-3 mb-7">
        <button onClick={() => navigate('/pedidos')}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0 mt-0.5">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 gap-y-1">
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Pedido #{pedido.numeroPedido}</h1>
            <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-[3px] rounded-full"
              style={{ background: ESTADO_COLORS[pedido.estado] + '1a', color: ESTADO_COLORS[pedido.estado] }}>
              {ESTADO_LABELS[pedido.estado]}
            </span>
          </div>
          <p className="text-[13px] text-slate-400 mt-0.5">{pedido.cliente.nombre}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {pedido.estado === 'COTIZACION' && !isEditing && (
            <button onClick={startEditing}
              className="flex items-center gap-1.5 h-9 px-3.5 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-[10px] text-[13px] font-semibold transition-colors">
              <Edit2 size={13} />
              <span className="hidden sm:inline">Editar</span>
            </button>
          )}
          <button onClick={() => printQuote(pedido)}
            className="flex items-center gap-1.5 h-9 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[10px] text-[13px] font-semibold transition-colors">
            <Download size={13} />
            PDF
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5 overflow-x-auto">
        <div className="flex items-start min-w-max gap-0">
          {estadosProgreso.map((estado, i) => {
            const idx = estadosProgreso.indexOf(estado)
            const isDone = idx < estadoIdx
            const isActive = idx === estadoIdx
            return (
              <div key={estado} className="flex items-center">
                <div className="flex flex-col items-center w-[72px]">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all ${
                    isDone ? 'bg-sky-500 border-sky-500 text-white' :
                    isActive ? 'border-sky-500 text-sky-500 bg-white' :
                    'border-slate-200 text-slate-300 bg-white'
                  }`}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <p className={`text-[10px] mt-1.5 text-center leading-tight font-medium ${isActive ? 'text-sky-500' : 'text-slate-400'}`}>
                    {ESTADO_LABELS[estado]}
                  </p>
                </div>
                {i < estadosProgreso.length - 1 && (
                  <div className={`h-0.5 w-7 mb-5 flex-shrink-0 ${idx < estadoIdx ? 'bg-sky-500' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Edit mode */}
      {isEditing ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-sky-200 ring-1 ring-sky-100 p-5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Especificaciones</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className={lc}>Largo (cm)</label>
                  <input type="number" value={editLargo} onChange={e => setEditLargo(e.target.value)} placeholder="0" min="0" step="0.1" className={ic} />
                </div>
                <div>
                  <label className={lc}>Ancho (cm)</label>
                  <input type="number" value={editAncho} onChange={e => setEditAncho(e.target.value)} placeholder="0" min="0" step="0.1" className={ic} />
                </div>
                <div>
                  <label className={lc}>Alto (cm)</label>
                  <input type="number" value={editAlto} onChange={e => setEditAlto(e.target.value)} placeholder="0" min="0" step="0.1" className={ic} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={lc}>Material</label>
                  <select value={editMaterial} onChange={e => setEditMaterial(e.target.value)} className={ic}>
                    {MATERIALES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lc}>Impresión</label>
                  <select value={editImpresion} onChange={e => setEditImpresion(e.target.value)} className={ic}>
                    {IMPRESIONES.map(i => (
                      <option key={i.value} value={i.value}>
                        {i.label}{i.recargo ? ` (+${i.recargo * 100}%)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lc}>Cantidad de unidades</label>
                  <input type="number" value={editCantidad} onChange={e => setEditCantidad(e.target.value)} min="1" className={ic} />
                  {editDescuento > 0 && (
                    <p className="text-[11px] text-emerald-600 mt-1 font-medium">✓ Descuento: -{editDescuento * 100}%</p>
                  )}
                </div>
                <div>
                  <label className={lc}>Entrega estimada</label>
                  <input type="date" value={editEntregaEst} onChange={e => setEditEntregaEst(e.target.value)} className={ic} />
                </div>
              </div>
            </div>

            {campos.length > 0 && (
              <div className="bg-white rounded-2xl border border-sky-200 ring-1 ring-sky-100 p-5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Opciones adicionales</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {campos.map(campo => (
                    <div key={campo.id}>
                      <label className={lc}>
                        {campo.nombre}
                        {campo.impactoTipo === 'PORCENTAJE' && <span className="text-slate-300 ml-1 font-normal normal-case tracking-normal">(+{campo.impactoValor}%)</span>}
                        {campo.impactoTipo === 'FIJO' && <span className="text-slate-300 ml-1 font-normal normal-case tracking-normal">(+${campo.impactoValor})</span>}
                      </label>
                      {campo.tipo === 'BOOLEAN' ? (
                        <select value={editValoresCampos[campo.id] ?? 'false'}
                          onChange={e => setEditValoresCampos(p => ({ ...p, [campo.id]: e.target.value }))} className={ic}>
                          <option value="false">No</option>
                          <option value="true">Sí</option>
                        </select>
                      ) : campo.tipo === 'SELECT' ? (
                        <select value={editValoresCampos[campo.id] ?? ''}
                          onChange={e => setEditValoresCampos(p => ({ ...p, [campo.id]: e.target.value }))} className={ic}>
                          <option value="">— Seleccionar —</option>
                          {campo.opciones.map(o => <option key={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input type="number" value={editValoresCampos[campo.id] ?? ''}
                          onChange={e => setEditValoresCampos(p => ({ ...p, [campo.id]: e.target.value }))} className={ic} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-sky-200 ring-1 ring-sky-100 p-5">
              <label className={lc}>Notas del pedido</label>
              <textarea value={editNotasCliente} onChange={e => setEditNotasCliente(e.target.value)}
                rows={3} placeholder="Colores Pantone, detalles del logo..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-[10px] text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none bg-white" />
            </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 lg:sticky lg:top-6">
              <div className="flex items-center gap-2 mb-4">
                <Calculator size={14} className="text-sky-500" />
                <p className="text-[13px] font-semibold text-slate-900">Cotización</p>
              </div>
              <div className="mb-5">
                <div className="space-y-1.5 mb-3">
                  {editBreakdown.map((item, i) => (
                    <div key={i} className="flex justify-between text-[13px]">
                      <span className={item.delta < 0 ? 'text-emerald-600' : i === 0 ? 'text-slate-500' : 'text-slate-400'}>
                        {i > 0 && item.delta >= 0 ? '+ ' : ''}{item.label}
                      </span>
                      <span className={`font-semibold font-mono ${item.delta < 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {item.delta < 0 ? '-' : i > 0 ? '+' : ''}${Math.abs(item.delta).toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-100 pt-2.5 space-y-1.5">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-500">Precio unitario</span>
                    <span className="font-semibold text-slate-900 font-mono">${editPrecioUnitario.toLocaleString('es-AR')}/u</span>
                  </div>
                  <div className="text-[13px] text-slate-400 font-mono">× {Number(editCantidad).toLocaleString('es-AR')} u.</div>
                </div>
                <div className="border-t border-slate-100 mt-2.5 pt-2.5 flex justify-between items-baseline">
                  <span className="text-[13px] font-semibold text-slate-900">Total estimado</span>
                  <span className="text-[24px] font-bold text-sky-600 font-mono">${editPrecioTotal.toLocaleString('es-AR')}</span>
                </div>
              </div>
              <div className="space-y-2">
                <button onClick={saveEdit} disabled={mutation.isPending}
                  className="w-full h-10 bg-sky-500 hover:bg-sky-600 text-white rounded-[10px] text-[13px] font-semibold transition-colors disabled:opacity-40 shadow-[0_4px_12px_-4px_rgba(14,165,233,0.45)]">
                  {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button onClick={() => setIsEditing(false)}
                  className="w-full h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[10px] text-[13px] font-semibold transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Cliente</p>
              <p className="font-bold text-slate-900 text-[15px]">{pedido.cliente.nombre}</p>
              {pedido.cliente.razonSocial && <p className="text-[13px] text-slate-500 mt-0.5">{pedido.cliente.razonSocial}</p>}
              {pedido.cliente.email && <p className="text-[13px] text-slate-400 mt-1.5">{pedido.cliente.email}</p>}
              {pedido.cliente.telefono && <p className="text-[13px] text-slate-400">{pedido.cliente.telefono}</p>}
              <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-[3px] rounded-full mt-3 ${
                pedido.cliente.tipo === 'B2B' ? 'bg-violet-50 text-violet-600' : 'bg-amber-50 text-amber-600'
              }`}>{pedido.cliente.tipo}</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Especificaciones</p>
              <div className="space-y-2.5">
                {[
                  ['Medidas', pedido.largo != null ? `${pedido.largo} × ${pedido.ancho} × ${pedido.alto} cm` : null],
                  ['Material', pedido.material],
                  ['Impresión', pedido.impresion],
                  ['Cantidad', pedido.cantidad != null ? `${pedido.cantidad.toLocaleString('es-AR')} u.` : null],
                  ['Entrega', pedido.entregaEst ? new Date(pedido.entregaEst).toLocaleDateString('es-AR') : null],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label as string} className="flex justify-between text-[13px]">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-medium text-slate-900">{value}</span>
                  </div>
                ))}
                {pedido.precioTotal && (
                  <div className="flex justify-between text-[13px] border-t border-slate-100 pt-2.5 mt-2.5">
                    <span className="font-semibold text-slate-900">Total</span>
                    <span className="font-bold text-sky-600 font-mono">${pedido.precioTotal.toLocaleString('es-AR')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {pedido.valoresCampos && pedido.valoresCampos.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Opciones adicionales</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {pedido.valoresCampos.map(v => (
                  <div key={v.id} className="text-[13px]">
                    <span className="text-slate-400">{v.campo.nombre}: </span>
                    <span className="font-medium text-slate-900">
                      {v.valor === 'true' ? 'Sí' : v.valor === 'false' ? 'No' : v.valor}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Gestionar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Gestionar pedido</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={lc}>Cambiar estado</label>
            <select defaultValue={pedido.estado}
              onChange={e => mutation.mutate({ estado: e.target.value })}
              className={ic}>
              {ESTADOS_ORDEN.map(e => (
                <option key={e} value={e}>{ESTADO_LABELS[e]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lc}>Notas internas</label>
            <div className="flex gap-2">
              <input value={notasAdmin} onChange={e => setNotasAdmin(e.target.value)}
                placeholder="Notas para el equipo..."
                className="flex-1 h-10 px-3 border border-slate-200 rounded-[10px] text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white" />
              <button onClick={saveNotas}
                className={`h-10 px-3 rounded-[10px] text-[12px] font-semibold transition-colors flex-shrink-0 ${
                  notasSaved ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}>
                {notasSaved ? '✓ Guardado' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
        {pedido.notasCliente && (
          <div className="mt-3 text-[13px] bg-slate-50 rounded-xl p-3">
            <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-widest">Notas: </span>
            <span className="text-slate-700">{pedido.notasCliente}</span>
          </div>
        )}
      </div>

      {/* Historial */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Historial</p>
        {(pedido.eventos || []).length === 0 ? (
          <p className="text-[13px] text-slate-400">Sin eventos</p>
        ) : (
          <div className="space-y-3">
            {(pedido.eventos || []).map(ev => (
              <div key={ev.id} className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: ESTADO_COLORS[ev.estado] || '#94a3b8' }} />
                <div>
                  <p className="text-[13px] font-semibold text-slate-900">{ESTADO_LABELS[ev.estado] || ev.estado}</p>
                  {ev.descripcion && <p className="text-[12px] text-slate-500">{ev.descripcion}</p>}
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{new Date(ev.createdAt).toLocaleString('es-AR')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
