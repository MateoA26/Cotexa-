import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api, { pedidosApi, camposApi, archivosApi, empresaApi, preciosApi } from '../services/api'
import { Pedido, CampoCustom, ArchivoAdjunto } from '../types'
import { ESTADO_LABELS, ESTADO_COLORS, ESTADOS_ORDEN } from '../utils/estados'
import { ArrowLeft, Edit2, Download, Calculator, FileText, Clock, CheckCircle2, Package, Truck, XCircle, Upload, Trash2, Image as ImageIcon, File as FileIcon, MessageSquare } from 'lucide-react'

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getFileIcon = (tipo: string) => {
  if (tipo.startsWith('image/')) return ImageIcon
  if (tipo === 'application/pdf') return FileText
  return FileIcon
}

const IMPRESIONES = [
  { value: 'sin_impresion', label: 'Sin impresión' },
  { value: 'un_color', label: 'Un color' },
  { value: 'full_color', label: 'Full color' },
]

const ESTADO_ICONS: Record<string, any> = {
  COTIZACION: FileText, PENDIENTE: Clock, CONFIRMADO: CheckCircle2,
  EN_PRODUCCION: Package, LISTO: CheckCircle2, ENVIADO: Truck,
  ENTREGADO: Truck, CANCELADO: XCircle,
}

interface BreakdownItem { label: string; delta: number }
interface TramoDescuento { id: number; desdeUnidades: number; porcentaje: number }
interface Material { id: number; nombre: string; precioUnitario: number; activo: boolean }

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

function printQuote(pedido: Pedido, empresaLogoUrl?: string, empresaNombre?: string) {
  const fallbackLogo = `${window.location.origin}/Imagenes/Copia de Logo fondo azul.png`
  const logoSrc = empresaLogoUrl || fallbackLogo
  const companyName = empresaNombre || 'Cotexa'
  const win = window.open('', '_blank', 'width=850,height=700')
  if (!win) return

  const fecha = new Date(pedido.createdAt).toLocaleDateString('es-AR')
  const entrega = pedido.entregaEst ? new Date(pedido.entregaEst).toLocaleDateString('es-AR') : '—'
  const impLabel = IMPRESIONES.find(i => i.value === pedido.impresion)?.label || pedido.impresion || '—'

  const specRows = [
    pedido.largo != null ? ['Medidas', `${pedido.largo} × ${pedido.ancho} × ${pedido.alto} cm`] : null,
    pedido.material ? ['Material', pedido.material] : null,
    ['Impresión', impLabel],
    pedido.cantidad != null ? ['Cantidad', `${pedido.cantidad.toLocaleString('es-AR')} unidades`] : null,
    ['Entrega estimada', entrega],
  ].filter(Boolean) as string[][]

  const specHtml = specRows.map(([k, v]) =>
    `<tr><td class="lc">${k}</td><td class="vc">${v}</td></tr>`
  ).join('')

  const camposHtml = (pedido.valoresCampos || []).map(vc =>
    `<tr><td class="lc">${vc.campo.nombre}</td><td class="vc">${vc.valor === 'true' ? 'Sí' : vc.valor === 'false' ? 'No' : vc.valor}</td></tr>`
  ).join('')

  const unitario = pedido.precioTotal && pedido.cantidad
    ? Math.round(pedido.precioTotal / pedido.cantidad)
    : null

  win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Cotización #${pedido.numeroPedido} — ${companyName}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body{font-family:'Inter',sans-serif;font-size:13px;color:#0f172a;background:#fff;padding:0}

    .page{max-width:780px;margin:0 auto;padding:48px 52px;min-height:100vh;position:relative}

    /* HEADER */
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px}
    .logo{height:52px;width:auto;object-fit:contain}
    .company-name{font-size:22px;font-weight:800;color:#0f172a}
    .title-block{text-align:right}
    .doc-title{font-size:28px;font-weight:800;letter-spacing:-1px;color:#0ea5e9}
    .doc-meta{font-size:12px;color:#94a3b8;margin-top:6px;font-weight:500}
    .badge{display:inline-block;margin-top:8px;padding:4px 14px;border-radius:99px;font-size:10px;font-weight:700;background:#e0f2fe;color:#0369a1;letter-spacing:.08em;text-transform:uppercase}

    /* DIVIDER */
    .divider{height:3px;background:linear-gradient(90deg,#0ea5e9,#38bdf8,#7dd3fc);border-radius:99px;margin-bottom:32px}

    /* SECTIONS */
    .sec{margin-bottom:28px}
    .sec-title{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:#cbd5e1;margin-bottom:12px}

    /* CLIENT CARD */
    .client-card{background:linear-gradient(135deg,#f8fafc 0%,#f0f9ff 100%);border:1px solid #e2e8f0;border-radius:14px;padding:20px 22px;position:relative;overflow:hidden}
    .client-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,#0ea5e9,#38bdf8);border-radius:4px 0 0 4px}
    .cn{font-size:17px;font-weight:800;color:#0f172a;padding-left:4px}
    .cs{font-size:12px;color:#64748b;margin-top:4px;padding-left:4px;display:flex;align-items:center;gap:6px}
    .cuit{font-size:11px;color:#94a3b8;font-family:monospace;margin-top:3px;padding-left:4px}

    /* SPECS TABLE */
    .spec-table{width:100%;border-collapse:collapse;border-radius:14px;overflow:hidden;border:1px solid #f1f5f9}
    .lc{width:40%;padding:11px 16px;font-size:12px;color:#94a3b8;font-weight:500;background:#fafafa;border-bottom:1px solid #f1f5f9}
    .vc{padding:11px 16px;font-size:13px;font-weight:600;color:#0f172a;border-bottom:1px solid #f1f5f9;background:#fff}
    tr:last-child .lc,tr:last-child .vc{border-bottom:none}
    tr:hover .lc,tr:hover .vc{background:#f8fafc}

    /* PRICE BOX */
    .price-box{background:#fafafa;border:1px solid #f1f5f9;border-radius:14px;overflow:hidden}
    .pr{display:flex;justify-content:space-between;align-items:center;padding:11px 16px;border-bottom:1px solid #f1f5f9}
    .pr:last-child{border-bottom:none}
    .pl{font-size:12px;color:#94a3b8;font-weight:500}
    .pv{font-size:13px;font-weight:600;font-family:monospace;color:#0f172a}

    /* TOTAL */
    .total-section{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-radius:14px;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;margin-top:8px}
    .total-label{font-size:14px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em}
    .total-amount{font-size:32px;font-weight:800;color:#0ea5e9;font-family:monospace;letter-spacing:-1px}

    /* NOTES */
    .notes{font-size:12px;color:#475569;background:#f0f9ff;border:1px solid #bae6fd;border-left:4px solid #0ea5e9;border-radius:10px;padding:14px 16px;line-height:1.7}

    /* FOOTER */
    .footer{margin-top:48px;padding-top:16px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;font-size:10px;color:#cbd5e1;font-weight:500}

    @media print{
      @page{margin:0;size:A4}
      body{padding:0;margin:0}
      .page{padding:32px 40px}
      .total-section{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .client-card{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .divider{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <img src="${logoSrc}" class="logo" alt="${companyName}" onerror="this.style.display='none';document.getElementById('cname').style.display='block'"/>
      <div id="cname" style="display:none" class="company-name">${companyName}</div>
    </div>
    <div class="title-block">
      <div class="doc-title">COTIZACIÓN</div>
      <div class="doc-meta">N° ${pedido.numeroPedido} &nbsp;·&nbsp; ${fecha}</div>
      <span class="badge">${ESTADO_LABELS[pedido.estado] || pedido.estado}</span>
    </div>
  </div>

  <div class="divider"></div>

  <div class="sec">
    <div class="sec-title">Cliente</div>
    <div class="client-card">
      <div class="cn">${pedido.cliente.nombre}</div>
      ${pedido.cliente.razonSocial ? `<div class="cs">${pedido.cliente.razonSocial}</div>` : ''}
      ${(pedido.cliente as any).cuit ? `<div class="cuit">CUIT: ${(pedido.cliente as any).cuit}</div>` : ''}
      ${pedido.cliente.email ? `<div class="cs">✉ ${pedido.cliente.email}</div>` : ''}
      ${pedido.cliente.telefono ? `<div class="cs">📞 ${pedido.cliente.telefono}</div>` : ''}
    </div>
  </div>

  <div class="sec">
    <div class="sec-title">Especificaciones del pedido</div>
    <table class="spec-table"><tbody>${specHtml}</tbody></table>
  </div>

  ${camposHtml ? `<div class="sec"><div class="sec-title">Opciones adicionales</div><table class="spec-table"><tbody>${camposHtml}</tbody></table></div>` : ''}

  ${pedido.notasCliente ? `<div class="sec"><div class="sec-title">Notas del pedido</div><div class="notes">${pedido.notasCliente}</div></div>` : ''}

  <div class="sec">
    <div class="sec-title">Precio estimado</div>
    <div class="price-box">
      ${pedido.precioBase != null ? `<div class="pr"><span class="pl">Precio base</span><span class="pv">$${pedido.precioBase.toLocaleString('es-AR')}/u</span></div>` : ''}
      ${unitario != null && pedido.precioBase != null && unitario !== pedido.precioBase ? `<div class="pr"><span class="pl">Precio unitario final</span><span class="pv">$${unitario.toLocaleString('es-AR')}/u</span></div>` : ''}
      ${pedido.cantidad ? `<div class="pr"><span class="pl">Cantidad</span><span class="pv">${pedido.cantidad.toLocaleString('es-AR')} u.</span></div>` : ''}
    </div>
    <div class="total-section">
      <span class="total-label">Total estimado</span>
      <span class="total-amount">$${pedido.precioTotal?.toLocaleString('es-AR') || '—'}</span>
    </div>
  </div>

  <div class="footer">
    <span>${companyName} · Plataforma de gestión de pedidos y cotizaciones</span>
    <span>Este documento es una cotización, no una factura.</span>
  </div>
</div>
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

  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editLargo, setEditLargo] = useState('')
  const [editAncho, setEditAncho] = useState('')
  const [editAlto, setEditAlto] = useState('')
  const [editMaterialId, setEditMaterialId] = useState('')
  const [editImpresion, setEditImpresion] = useState('sin_impresion')
  const [editCantidad, setEditCantidad] = useState('100')
  const [editEntregaEst, setEditEntregaEst] = useState('')
  const [editNotasCliente, setEditNotasCliente] = useState('')
  const [editValoresCampos, setEditValoresCampos] = useState<Record<number, string>>({})
  const [editPrecioUnitario, setEditPrecioUnitario] = useState(0)
  const [editPrecioTotal, setEditPrecioTotal] = useState(0)
  const [editDescuentoPct, setEditDescuentoPct] = useState(0)
  const [editBreakdown, setEditBreakdown] = useState<BreakdownItem[]>([])

  const [lumaTypoCajaId, setLumaTipoCajaId] = useState<number | null>(null)
  const [lumaE, setLumaE] = useState('')
  const [lumaF, setLumaF] = useState('')
  const [lumaG, setLumaG] = useState('')
  const [lumaProveedorMatId, setLumaProveedorMatId] = useState<number | null>(null)
  const [lumaFactor, setLumaFactor] = useState(0.5)
  const [lumaCostosSeleccionados, setLumaCostosSeleccionados] = useState<number[]>([])

  const [printBocas, setPrintBocas] = useState('')
  const [printAnchoCart, setPrintAnchoCart] = useState('')
  const [printAltoCart, setPrintAltoCart] = useState('')
  const [printGramaje, setPrintGramaje] = useState('')
  const [printPrecioKiloUSD, setPrintPrecioKiloUSD] = useState('')
  const [printPrecioDolar, setPrintPrecioDolar] = useState('1490')
  const [printTotalTroquelado, setPrintTotalTroquelado] = useState('')
  const [printPoli, setPrintPoli] = useState('')
  const [printRelieve, setPrintRelieve] = useState('')
  const [printStamping, setPrintStamping] = useState('')
  const [printDoblado, setPrintDoblado] = useState('')
  const [printTotalImpresion, setPrintTotalImpresion] = useState('')
  const [printCajasPorCaja, setPrintCajasPorCaja] = useState('')
  const [printPrecioPorCaja, setPrintPrecioPorCaja] = useState('')
  const [printTotalFlete, setPrintTotalFlete] = useState('')
  const [printMargen, setPrintMargen] = useState('30')
  const [printDescripcion, setPrintDescripcion] = useState('')

  const { data: pedido, isLoading } = useQuery<Pedido>({
    queryKey: ['pedido', id],
    queryFn: async () => {
      const res = await pedidosApi.getOne(Number(id))
      return res.data
    }
  })

  const { data: campos = [] } = useQuery<CampoCustom[]>({
    queryKey: ['campos'],
    queryFn: () => camposApi.getAll().then(r => r.data),
    enabled: isEditing,
  })

  const { data: archivos = [] } = useQuery<ArchivoAdjunto[]>({
    queryKey: ['archivos', id],
    queryFn: () => archivosApi.getAll(Number(id)).then(r => r.data),
  })

  const { data: empresa } = useQuery({
    queryKey: ['empresa'],
    queryFn: () => empresaApi.get().then(r => r.data),
  })
  const isLumapack = empresa?.slug === 'lumapack'
  const isPrintpack = empresa?.slug === 'printpack'

  useEffect(() => {
    if (!pedido) return
    setNotasAdmin(isLumapack ? '' : (pedido.notasAdmin || ''))
  }, [pedido, isLumapack])

  const { data: tiposCaja = [] } = useQuery({
    queryKey: ['tipos-caja'],
    queryFn: () => api.get('/cotizador-avanzado/tipos-caja').then(r => r.data),
    enabled: isLumapack,
  })
  const { data: proveedoresMat = [] } = useQuery({
    queryKey: ['proveedores-mat'],
    queryFn: () => api.get('/cotizador-avanzado/proveedores').then(r => r.data),
    enabled: isLumapack,
  })
  const { data: costosAdicionales = [] } = useQuery({
    queryKey: ['costos-adicionales'],
    queryFn: () => api.get('/cotizador-avanzado/costos').then(r => r.data),
    enabled: isLumapack,
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

  const deleteMutation = useMutation({
    mutationFn: (archivoId: number) => archivosApi.delete(archivoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['archivos', id] }),
  })

  const mutation = useMutation({
    mutationFn: (data: any) => pedidosApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido', id] })
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    }
  })

  const materialesActivos = materiales.filter(m => m.activo)

  useEffect(() => {
    if (!isEditing) return
    const cant = Number(editCantidad) || 0
    const base = precioConfig?.precioBase ?? 0
    const selectedMat = materiales.find(m => String(m.id) === editMaterialId) || null
    const matPrecio = selectedMat?.precioUnitario || 0
    const result = calcularPrecio(campos, cant, editValoresCampos, base, matPrecio, tramos)
    setEditDescuentoPct(result.descuentoPct)
    setEditPrecioUnitario(result.unitario)
    setEditPrecioTotal(result.total)
    setEditBreakdown(result.breakdown)
  }, [editCantidad, editMaterialId, editValoresCampos, campos, isEditing, precioConfig, materiales, tramos])

  const lumaResultado = useMemo(() => {
    if (!isLumapack) return null
    const tipoCaja = tiposCaja.find((t: any) => t.id === lumaTypoCajaId)
    const provMat = proveedoresMat.find((p: any) => p.id === lumaProveedorMatId)
    const E = Number(lumaE), F = Number(lumaF), G = Number(lumaG)
    const cantidad = Number(editCantidad)
    if (!tipoCaja || !provMat || !E || !F || !G || !cantidad) return null

    const evalFormula = (formula: string) => {
      try {
        const expr = formula.replace(/E/g, String(E)).replace(/F/g, String(F)).replace(/G/g, String(G))
        return Function('"use strict"; return (' + expr + ')')()
      } catch { return 0 }
    }

    const anchoPlancha = evalFormula(tipoCaja.formulaAncho)
    const largoPlancha = evalFormula(tipoCaja.formulaLargo)
    const superficieM2 = (anchoPlancha * largoPlancha) / 1000000
    const costoBase = superficieM2 * provMat.precioM2 * cantidad

    let costosExtra = 0
    lumaCostosSeleccionados.forEach((cid: number) => {
      const c = costosAdicionales.find((x: any) => x.id === cid)
      if (!c) return
      if (c.tipo === 'POR_M2') costosExtra += c.valor * superficieM2 * cantidad
      else costosExtra += c.valor * cantidad
    })

    const costoTotal = costoBase + costosExtra
    const precioUnitario = (costoTotal / cantidad) * (1 + lumaFactor)
    const gananciaUnitaria = precioUnitario - (costoTotal / cantidad)
    const precioTotal = precioUnitario * cantidad

    return { anchoPlancha, largoPlancha, superficieM2, costoBase, costosExtra, costoTotal, precioUnitario, gananciaUnitaria, precioTotal }
  }, [isLumapack, lumaTypoCajaId, lumaE, lumaF, lumaG, lumaProveedorMatId, lumaFactor, lumaCostosSeleccionados, tiposCaja, proveedoresMat, costosAdicionales, editCantidad])

  const lumaDetalle = useMemo(() => {
    if (!isLumapack || !pedido) return null
    try {
      const datos = JSON.parse(pedido.notasAdmin || '{}')
      const tipoCaja = tiposCaja.find((t: any) => t.id === datos.lumapack?.tipoCajaId)
      const provMat = proveedoresMat.find((p: any) => p.id === datos.lumapack?.proveedorMatId)
      const E = pedido.alto || 0
      const F = pedido.ancho || 0
      const G = pedido.largo || 0
      const cantidad = pedido.cantidad || 0
      const factor = datos.lumapack?.factor ?? 0.5
      if (!tipoCaja || !provMat || !E || !F || !G || !cantidad) return null
      const evalFormula = (formula: string) => {
        try {
          const expr = formula.replace(/E/g, String(E)).replace(/F/g, String(F)).replace(/G/g, String(G))
          return Function('"use strict"; return (' + expr + ')')()
        } catch { return 0 }
      }
      const anchoPlancha = evalFormula(tipoCaja.formulaAncho)
      const largoPlancha = evalFormula(tipoCaja.formulaLargo)
      const superficieM2 = (anchoPlancha * largoPlancha) / 1000000
      const costoBase = superficieM2 * provMat.precioM2 * cantidad
      const precioUnitario = (costoBase / cantidad) * (1 + factor)
      const gananciaUnitaria = precioUnitario - (costoBase / cantidad)
      return { anchoPlancha, largoPlancha, superficieM2, costoBase, precioUnitario, gananciaUnitaria, factor, tipoCaja, provMat }
    } catch { return null }
  }, [isLumapack, pedido, tiposCaja, proveedoresMat])

  const printResultado = useMemo(() => {
    if (!isPrintpack) return null
    const unidades = Number(editCantidad)
    const bocas = Number(printBocas)
    const anchoCart = Number(printAnchoCart)
    const altoCart = Number(printAltoCart)
    const gramaje = Number(printGramaje)
    const precioKiloUSD = Number(printPrecioKiloUSD)
    const precioKiloARS = precioKiloUSD * Number(printPrecioDolar)
    const totalTroquelado = Number(printTotalTroquelado)
    const poli = Number(printPoli)
    const relieve = Number(printRelieve)
    const stamping = Number(printStamping)
    const doblado = Number(printDoblado)
    const totalImpresion = Number(printTotalImpresion)
    const cajasPorCaja = Number(printCajasPorCaja)
    const precioPorCaja = Number(printPrecioPorCaja)
    const totalFlete = Number(printTotalFlete)
    const margen = Number(printMargen)

    if (!unidades || !bocas || !anchoCart || !altoCart || !gramaje || !precioKiloUSD) return null

    const cantPliegos = unidades / bocas
    const kilos500 = (anchoCart * altoCart * gramaje) / 20000
    const kilos1000 = kilos500 * 2
    const merma = kilos1000 * 0.10
    const kilosTotales = ((cantPliegos * kilos1000) / 1000) + merma

    const costoCartulinaUnit = (kilosTotales * precioKiloARS) / unidades
    const troqueladoUnit = totalTroquelado / unidades
    const poliUnit = (anchoCart * altoCart * poli) / 10000
    const relieveUnit = relieve
    const stampingUnit = stamping
    const dobladoUnit = doblado / unidades
    const impresionUnit = totalImpresion / unidades
    const cajasTotales = cajasPorCaja > 0 ? unidades / cajasPorCaja : 0
    const unitarioCajas = cajasTotales > 0 ? (cajasTotales * precioPorCaja) / unidades : 0
    const fleteUnit = totalFlete / unidades

    const costoTotal = costoCartulinaUnit + troqueladoUnit + poliUnit + relieveUnit + stampingUnit + dobladoUnit + impresionUnit + unitarioCajas + fleteUnit
    const precioFinal = margen > 0 && margen < 100 ? costoTotal / (1 - margen / 100) : costoTotal
    const precioTotal = precioFinal * unidades

    return { cantPliegos, kilosTotales, costoCartulinaUnit, troqueladoUnit, poliUnit, relieveUnit, stampingUnit, dobladoUnit, impresionUnit, unitarioCajas, fleteUnit, costoTotal, precioFinal, precioTotal }
  }, [isPrintpack, editCantidad, printBocas, printAnchoCart, printAltoCart, printGramaje, printPrecioKiloUSD, printPrecioDolar,
      printTotalTroquelado, printPoli, printRelieve, printStamping, printDoblado, printTotalImpresion,
      printCajasPorCaja, printPrecioPorCaja, printTotalFlete, printMargen])

  const printDetalle = useMemo(() => {
    if (!isPrintpack || !pedido) return null
    try {
      const datos = JSON.parse(pedido.notasAdmin || '{}')
      const pp = datos.printpack
      if (!pp) return null
      const unidades = pedido.cantidad || 0
      const precioKiloUSD = pp.precioKiloUSD ?? pp.precioPorKilo ?? 0
      const precioDolar = pp.precioDolar ?? 1490
      const precioKiloARS = precioKiloUSD * precioDolar
      if (!unidades || !pp.bocas || !pp.anchoCart || !pp.altoCart || !pp.gramaje || !precioKiloUSD) return null

      const cantPliegos = unidades / pp.bocas
      const kilos500 = (pp.anchoCart * pp.altoCart * pp.gramaje) / 20000
      const kilos1000 = kilos500 * 2
      const merma = kilos1000 * 0.10
      const kilosTotales = ((cantPliegos * kilos1000) / 1000) + merma

      const costoCartulinaUnit = (kilosTotales * precioKiloARS) / unidades
      const troqueladoUnit = (pp.totalTroquelado || 0) / unidades
      const poliUnit = (pp.anchoCart * pp.altoCart * (pp.poli || 0)) / 10000
      const relieveUnit = (pp.relieve || 0)
      const stampingUnit = (pp.stamping || 0)
      const dobladoUnit = (pp.doblado || 0) / unidades
      const impresionUnit = (pp.totalImpresion || 0) / unidades
      const cajasTotales = pp.cajasPorCaja > 0 ? unidades / pp.cajasPorCaja : 0
      const unitarioCajas = cajasTotales > 0 ? (cajasTotales * (pp.precioPorCaja || 0)) / unidades : 0
      const fleteUnit = (pp.totalFlete || 0) / unidades

      const costoTotal = costoCartulinaUnit + troqueladoUnit + poliUnit + relieveUnit + stampingUnit + dobladoUnit + impresionUnit + unitarioCajas + fleteUnit
      const margen = pp.margen || 0
      const precioFinal = margen > 0 && margen < 100 ? costoTotal / (1 - margen / 100) : costoTotal
      const precioTotal = precioFinal * unidades

      return { costoCartulinaUnit, troqueladoUnit, poliUnit, relieveUnit, stampingUnit, dobladoUnit, impresionUnit, unitarioCajas, fleteUnit, costoTotal, precioFinal, precioTotal, margen }
    } catch { return null }
  }, [isPrintpack, pedido])

  useEffect(() => {
    if (!isLumapack || !pedido || !isEditing) return

    console.log('=== LUMA EFFECT ===')
    console.log('proveedoresMat:', proveedoresMat)
    console.log('tiposCaja:', tiposCaja)
    console.log('pedido.notasAdmin:', pedido.notasAdmin)
    console.log('pedido.material:', pedido.material)

    if (proveedoresMat.length === 0 && tiposCaja.length === 0) return

    try {
      const datos = JSON.parse(pedido.notasAdmin || '{}')

      if (datos.lumapack?.tipoCajaId) {
        setLumaTipoCajaId(datos.lumapack.tipoCajaId)
      }

      if (datos.lumapack?.factor !== undefined) {
        setLumaFactor(datos.lumapack.factor)
      }

      if (datos.lumapack?.proveedorMatId) {
        setLumaProveedorMatId(datos.lumapack.proveedorMatId)
      } else if (pedido.material && proveedoresMat.length > 0) {
        const parts = pedido.material.split(' — ')
        if (parts.length === 2) {
          const match = proveedoresMat.find((p: any) =>
            p.proveedor === parts[0] && p.material === parts[1]
          )
          if (match) setLumaProveedorMatId(match.id)
        }
      }
    } catch {
      // silently fail
    }

    setLumaE(String(pedido.alto || ''))
    setLumaF(String(pedido.ancho || ''))
    setLumaG(String(pedido.largo || ''))
  }, [isLumapack, isEditing, pedido, proveedoresMat, tiposCaja])

  useEffect(() => {
    if (!isPrintpack || !pedido || !isEditing) return
    try {
      const datos = JSON.parse(pedido.notasAdmin || '{}')
      const pp = datos.printpack
      if (!pp) return
      setPrintBocas(String(pp.bocas ?? ''))
      setPrintAnchoCart(String(pp.anchoCart ?? ''))
      setPrintAltoCart(String(pp.altoCart ?? ''))
      setPrintGramaje(String(pp.gramaje ?? ''))
      setPrintPrecioKiloUSD(String(pp.precioKiloUSD ?? pp.precioPorKilo ?? ''))
      setPrintPrecioDolar(String(pp.precioDolar ?? '1490'))
      setPrintTotalTroquelado(String(pp.totalTroquelado ?? ''))
      setPrintPoli(String(pp.poli ?? ''))
      setPrintRelieve(String(pp.relieve ?? ''))
      setPrintStamping(String(pp.stamping ?? ''))
      setPrintDoblado(String(pp.doblado ?? ''))
      setPrintTotalImpresion(String(pp.totalImpresion ?? ''))
      setPrintCajasPorCaja(String(pp.cajasPorCaja ?? ''))
      setPrintPrecioPorCaja(String(pp.precioPorCaja ?? ''))
      setPrintTotalFlete(String(pp.totalFlete ?? ''))
      setPrintMargen(String(pp.margen ?? '30'))
      setPrintDescripcion(pp.descripcion ?? '')
    } catch { /* silently fail */ }
  }, [isPrintpack, isEditing, pedido])

  const startEditing = () => {
    if (!pedido) return
    setEditLargo(pedido.largo?.toString() ?? '')
    setEditAncho(pedido.ancho?.toString() ?? '')
    setEditAlto(pedido.alto?.toString() ?? '')
    const mat = materiales.find(m => m.nombre === pedido.material)
    setEditMaterialId(mat ? String(mat.id) : '')
    setEditImpresion(pedido.impresion || 'sin_impresion')
    setEditCantidad(pedido.cantidad?.toString() ?? '100')
    setEditEntregaEst(pedido.entregaEst ? pedido.entregaEst.split('T')[0] : '')
    setEditNotasCliente(pedido.notasCliente || '')
    const vc: Record<number, string> = {}
    pedido.valoresCampos?.forEach(v => { vc[v.campoId] = v.valor })
    setEditValoresCampos(vc)
    setIsEditing(true)
    if (isPrintpack) {
      try {
        const datos = JSON.parse(pedido.notasAdmin || '{}')
        const pp = datos.printpack
        if (pp) {
          setPrintBocas(String(pp.bocas ?? ''))
          setPrintAnchoCart(String(pp.anchoCart ?? ''))
          setPrintAltoCart(String(pp.altoCart ?? ''))
          setPrintGramaje(String(pp.gramaje ?? ''))
          setPrintPrecioKiloUSD(String(pp.precioKiloUSD ?? pp.precioPorKilo ?? ''))
          setPrintPrecioDolar(String(pp.precioDolar ?? '1490'))
          setPrintTotalTroquelado(String(pp.totalTroquelado ?? ''))
          setPrintPoli(String(pp.poli ?? ''))
          setPrintRelieve(String(pp.relieve ?? ''))
          setPrintStamping(String(pp.stamping ?? ''))
          setPrintDoblado(String(pp.doblado ?? ''))
          setPrintTotalImpresion(String(pp.totalImpresion ?? ''))
          setPrintCajasPorCaja(String(pp.cajasPorCaja ?? ''))
          setPrintPrecioPorCaja(String(pp.precioPorCaja ?? ''))
          setPrintTotalFlete(String(pp.totalFlete ?? ''))
          setPrintMargen(String(pp.margen ?? '30'))
          setPrintDescripcion(pp.descripcion ?? '')
        }
      } catch { /* silently fail */ }
    }
    if (isLumapack) {
      setLumaE(String(pedido.alto || ''))
      setLumaF(String(pedido.ancho || ''))
      setLumaG(String(pedido.largo || ''))
      try {
        const datos = JSON.parse(pedido.notasAdmin || '{}')
        setLumaFactor(datos.lumapack?.factor ?? 0.5)
        setLumaTipoCajaId(datos.lumapack?.tipoCajaId || null)
        setLumaProveedorMatId(datos.lumapack?.proveedorMatId || null)
      } catch {
        setLumaFactor(0.5)
      }
    }
  }

  const saveEdit = async () => {
    if (!pedido) return
    if (isPrintpack && printResultado) {
      const notasAdminActual = (() => {
        try { return JSON.parse(pedido.notasAdmin || '{}') } catch { return {} }
      })()
      const notasAdminNuevo = JSON.stringify({
        ...notasAdminActual,
        printpack: {
          bocas: Number(printBocas),
          anchoCart: Number(printAnchoCart),
          altoCart: Number(printAltoCart),
          gramaje: Number(printGramaje),
          precioKiloUSD: Number(printPrecioKiloUSD),
          precioDolar: Number(printPrecioDolar),
          totalTroquelado: Number(printTotalTroquelado),
          poli: Number(printPoli),
          relieve: Number(printRelieve),
          stamping: Number(printStamping),
          doblado: Number(printDoblado),
          totalImpresion: Number(printTotalImpresion),
          cajasPorCaja: Number(printCajasPorCaja),
          precioPorCaja: Number(printPrecioPorCaja),
          totalFlete: Number(printTotalFlete),
          margen: Number(printMargen),
          descripcion: printDescripcion,
        }
      })
      await mutation.mutateAsync({
        cantidad: Number(editCantidad),
        entregaEst: editEntregaEst || null,
        notasCliente: editNotasCliente,
        precioBase: Math.round(printResultado.costoTotal * Number(editCantidad)),
        precioTotal: Math.round(printResultado.precioTotal),
        notasAdmin: notasAdminNuevo,
      })
      setIsEditing(false)
      return
    }
    if (isLumapack && lumaResultado) {
      const provMat = proveedoresMat.find((p: any) => p.id === lumaProveedorMatId)
      // Preservar notas internas existentes y agregar datos lumapack
      const notasAdminActual = (() => {
        try { return JSON.parse(pedido.notasAdmin || '{}') } catch { return {} }
      })()
      const notasAdminNuevo = JSON.stringify({
        ...notasAdminActual,
        lumapack: { tipoCajaId: lumaTypoCajaId, proveedorMatId: lumaProveedorMatId, factor: lumaFactor }
      })
      await mutation.mutateAsync({
        largo: Number(lumaG),
        ancho: Number(lumaF),
        alto: Number(lumaE),
        material: provMat ? `${provMat.proveedor} — ${provMat.material}` : '',
        cantidad: Number(editCantidad),
        entregaEst: editEntregaEst || null,
        notasCliente: editNotasCliente,
        precioBase: lumaResultado.costoBase,
        precioTotal: lumaResultado.precioTotal,
        notasAdmin: notasAdminNuevo
      })
      setIsEditing(false)
      return
    }
    const selectedMat = materiales.find(m => String(m.id) === editMaterialId) || null
    await mutation.mutateAsync({
      largo: editLargo ? Number(editLargo) : null,
      ancho: editAncho ? Number(editAncho) : null,
      alto: editAlto ? Number(editAlto) : null,
      material: selectedMat?.nombre || null,
      materialId: selectedMat?.id || null,
      impresion: editImpresion,
      cantidad: Number(editCantidad),
      entregaEst: editEntregaEst || null,
      notasCliente: editNotasCliente || null,
      precioBase: precioConfig?.precioBase ?? 0,
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

  const handleFiles = async (files: FileList | File[]) => {
    const MAX = 10 * 1024 * 1024
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    const valid = Array.from(files).filter(f => ALLOWED.includes(f.type) && f.size <= MAX)
    if (!valid.length) {
      setUploadError('Formato o tamaño no válido. Aceptamos JPG, PNG, WebP, PDF hasta 10MB.')
      setTimeout(() => setUploadError(null), 3000)
      return
    }
    setIsUploading(true)
    try {
      await Promise.all(valid.map(f => archivosApi.upload(Number(id), f)))
      queryClient.invalidateQueries({ queryKey: ['archivos', id] })
    } catch {
      setUploadError('Error al subir el archivo.')
      setTimeout(() => setUploadError(null), 3000)
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) return <div className="p-8 text-[13px] text-slate-400">Cargando...</div>
  if (!pedido) return null

  const estadoIdx = ESTADOS_ORDEN.indexOf(pedido.estado)
  const estadosProgreso = ESTADOS_ORDEN.filter(e => e !== 'CANCELADO')
  const EstadoIcon = ESTADO_ICONS[pedido.estado]

  const ic = 'w-full h-10 px-3 border border-slate-200 rounded-[10px] text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white'
  const lc = 'block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5'

  return (
    <div className="max-w-[1360px] mx-auto px-7 py-7">

      {/* Header */}
      <div className="flex items-start gap-3 mb-7">
        <button onClick={() => navigate('/pedidos')}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0 mt-0.5">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 gap-y-1">
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Pedido #{pedido.numeroPedido}</h1>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-[3px] rounded-full"
              style={{ background: ESTADO_COLORS[pedido.estado] + '1a', color: ESTADO_COLORS[pedido.estado] }}>
              {EstadoIcon && <EstadoIcon size={10} strokeWidth={2.5} />}
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
          <button onClick={() => printQuote(pedido, empresa?.logoUrl, empresa?.nombre)}
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
          {isPrintpack ? (
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-sky-200 ring-1 ring-sky-100 p-5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Cartulina</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><label className={lc}>Bocas</label><input type="number" value={printBocas} onChange={e => setPrintBocas(e.target.value)} placeholder="0" className={ic} /></div>
                  <div><label className={lc}>Gramaje (g/m²)</label><input type="number" value={printGramaje} onChange={e => setPrintGramaje(e.target.value)} placeholder="0" className={ic} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lc}>Ancho (mm)</label><input type="number" value={printAnchoCart} onChange={e => setPrintAnchoCart(e.target.value)} placeholder="0" className={ic} /></div>
                  <div><label className={lc}>Alto (mm)</label><input type="number" value={printAltoCart} onChange={e => setPrintAltoCart(e.target.value)} placeholder="0" className={ic} /></div>
                  <div><label className={lc}>Precio por kg (USD)</label><input type="number" value={printPrecioKiloUSD} onChange={e => setPrintPrecioKiloUSD(e.target.value)} placeholder="0" className={ic} /></div>
                  <div>
                    <label className={lc}>Precio por kg (ARS)</label>
                    <input type="number" value={(Number(printPrecioKiloUSD) * Number(printPrecioDolar)).toFixed(0)} readOnly className={`${ic} bg-slate-50 text-slate-500`} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-sky-200 ring-1 ring-sky-100 p-5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Troquelado e impresión</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lc}>Total troquelado ($)</label><input type="number" value={printTotalTroquelado} onChange={e => setPrintTotalTroquelado(e.target.value)} placeholder="0" className={ic} /></div>
                  <div><label className={lc}>Total impresión ($)</label><input type="number" value={printTotalImpresion} onChange={e => setPrintTotalImpresion(e.target.value)} placeholder="0" className={ic} /></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-sky-200 ring-1 ring-sky-100 p-5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Terminaciones</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lc}>Polipropileno ($)</label><input type="number" value={printPoli} onChange={e => setPrintPoli(e.target.value)} placeholder="0" className={ic} /></div>
                  <div><label className={lc}>Relieve (precio unitario)</label><input type="number" value={printRelieve} onChange={e => setPrintRelieve(e.target.value)} placeholder="0" className={ic} /></div>
                  <div><label className={lc}>Stamping (precio unitario)</label><input type="number" value={printStamping} onChange={e => setPrintStamping(e.target.value)} placeholder="0" className={ic} /></div>
                  <div><label className={lc}>Doblado ($)</label><input type="number" value={printDoblado} onChange={e => setPrintDoblado(e.target.value)} placeholder="0" className={ic} /></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-sky-200 ring-1 ring-sky-100 p-5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Packaging y flete</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className={lc}>Cajas por caja</label><input type="number" value={printCajasPorCaja} onChange={e => setPrintCajasPorCaja(e.target.value)} placeholder="0" className={ic} /></div>
                  <div><label className={lc}>Precio por caja ($)</label><input type="number" value={printPrecioPorCaja} onChange={e => setPrintPrecioPorCaja(e.target.value)} placeholder="0" className={ic} /></div>
                  <div><label className={lc}>Total flete ($)</label><input type="number" value={printTotalFlete} onChange={e => setPrintTotalFlete(e.target.value)} placeholder="0" className={ic} /></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-sky-200 ring-1 ring-sky-100 p-5">
                <div className="grid grid-cols-3 gap-3">
                  <div><label className={lc}>Cantidad</label><input type="number" value={editCantidad} onChange={e => setEditCantidad(e.target.value)} min="1" className={ic} /></div>
                  <div><label className={lc}>Precio dólar</label><input type="number" value={printPrecioDolar} onChange={e => setPrintPrecioDolar(e.target.value)} placeholder="1490" className={ic} /></div>
                  <div><label className={lc}>Entrega estimada</label><input type="date" value={editEntregaEst} onChange={e => setEditEntregaEst(e.target.value)} className={ic} /></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-sky-200 ring-1 ring-sky-100 p-5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Margen de ganancia</p>
                <div className="flex items-center gap-4">
                  <input type="range" min={0} max={80} step={1} value={printMargen} onChange={e => setPrintMargen(e.target.value)} className="flex-1 accent-sky-500" />
                  <span className="text-[15px] font-bold text-sky-600 w-12 text-right">{printMargen}%</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-sky-200 ring-1 ring-sky-100 p-5">
                <label className={lc}>Notas del pedido</label>
                <textarea value={editNotasCliente} onChange={e => setEditNotasCliente(e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-slate-200 rounded-[10px] text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none bg-white" />
              </div>
            </div>
          ) : isLumapack ? (
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-sky-200 ring-1 ring-sky-100 p-5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Caja</p>
                <div className="mb-3">
                  <label className={lc}>Tipo de caja</label>
                  <select value={lumaTypoCajaId || ''} onChange={e => setLumaTipoCajaId(Number(e.target.value))} className={ic}>
                    <option value="">— Seleccionar tipo —</option>
                    {tiposCaja.map((t: any) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className={lc}>Alto (E) mm</label><input type="number" value={lumaE} onChange={e => setLumaE(e.target.value)} placeholder="0" className={ic} /></div>
                  <div><label className={lc}>Ancho (F) mm</label><input type="number" value={lumaF} onChange={e => setLumaF(e.target.value)} placeholder="0" className={ic} /></div>
                  <div><label className={lc}>Largo (G) mm</label><input type="number" value={lumaG} onChange={e => setLumaG(e.target.value)} placeholder="0" className={ic} /></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-sky-200 ring-1 ring-sky-100 p-5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Material</p>
                <select value={lumaProveedorMatId || ''} onChange={e => setLumaProveedorMatId(Number(e.target.value))} className={ic}>
                  <option value="">— Seleccionar proveedor/material —</option>
                  {proveedoresMat.map((p: any) => <option key={p.id} value={p.id}>{p.proveedor} — {p.material} (${p.precioM2}/m²)</option>)}
                </select>
              </div>

              <div className="bg-white rounded-2xl border border-sky-200 ring-1 ring-sky-100 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lc}>Cantidad</label><input type="number" value={editCantidad} onChange={e => setEditCantidad(e.target.value)} min="1" className={ic} /></div>
                  <div><label className={lc}>Entrega estimada</label><input type="date" value={editEntregaEst} onChange={e => setEditEntregaEst(e.target.value)} className={ic} /></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-sky-200 ring-1 ring-sky-100 p-5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Factor de margen</p>
                <div className="flex items-center gap-4">
                  <input type="range" min={0} max={1} step={0.05} value={lumaFactor} onChange={e => setLumaFactor(Number(e.target.value))} className="flex-1 accent-sky-500" />
                  <span className="text-[15px] font-bold text-sky-600 w-12 text-right">{(lumaFactor * 100).toFixed(0)}%</span>
                </div>
              </div>

              {costosAdicionales.length > 0 && (
                <div className="bg-white rounded-2xl border border-sky-200 ring-1 ring-sky-100 p-5">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Costos adicionales</p>
                  <div className="space-y-2">
                    {costosAdicionales.map((c: any) => (
                      <label key={c.id} className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={lumaCostosSeleccionados.includes(c.id)}
                          onChange={e => setLumaCostosSeleccionados(prev => e.target.checked ? [...prev, c.id] : prev.filter((x: number) => x !== c.id))}
                          className="accent-sky-500" />
                        <span className="text-[13px] text-slate-700">{c.nombre}</span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{c.tipo === 'POR_M2' ? 'Por m²' : 'Fijo'}</span>
                        <span className="text-[12px] font-mono text-slate-500 ml-auto">${c.valor}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-sky-200 ring-1 ring-sky-100 p-5">
                <label className={lc}>Notas del pedido</label>
                <textarea value={editNotasCliente} onChange={e => setEditNotasCliente(e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-slate-200 rounded-[10px] text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none bg-white" />
              </div>
            </div>
          ) : (
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
                    <select value={editMaterialId} onChange={e => setEditMaterialId(e.target.value)} className={ic}>
                      <option value="">— Sin material —</option>
                      {materialesActivos.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.nombre}{m.precioUnitario > 0 ? ` (+$${m.precioUnitario}/u)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={lc}>Impresión</label>
                    <select value={editImpresion} onChange={e => setEditImpresion(e.target.value)} className={ic}>
                      {IMPRESIONES.map(i => (
                        <option key={i.value} value={i.value}>{i.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lc}>Cantidad de unidades</label>
                    <input type="number" value={editCantidad} onChange={e => setEditCantidad(e.target.value)} min="1" className={ic} />
                    {editDescuentoPct > 0 && (
                      <p className="text-[11px] text-emerald-600 mt-1 font-medium">✓ Descuento: -{editDescuentoPct}%</p>
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
          )}

          <div>
            {isPrintpack && printResultado ? (
              <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-3 lg:sticky lg:top-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator size={14} className="text-sky-400" />
                  <p className="text-[13px] font-semibold">Cotización en tiempo real</p>
                </div>
                <div className="space-y-1.5 text-[13px]">
                  <div className="flex justify-between"><span className="text-slate-400">Cartulina/u</span><span className="font-mono">${printResultado.costoCartulinaUnit.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span></div>
                  {printResultado.troqueladoUnit > 0 && <div className="flex justify-between"><span className="text-slate-400">Troquelado/u</span><span className="font-mono">${printResultado.troqueladoUnit.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span></div>}
                  {printResultado.impresionUnit > 0 && <div className="flex justify-between"><span className="text-slate-400">Impresión/u</span><span className="font-mono">${printResultado.impresionUnit.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span></div>}
                  {printResultado.poliUnit > 0 && <div className="flex justify-between"><span className="text-slate-400">Polipropileno/u</span><span className="font-mono">${printResultado.poliUnit.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span></div>}
                  {printResultado.relieveUnit > 0 && <div className="flex justify-between"><span className="text-slate-400">Relieve/u</span><span className="font-mono">${printResultado.relieveUnit.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span></div>}
                  {printResultado.stampingUnit > 0 && <div className="flex justify-between"><span className="text-slate-400">Stamping/u</span><span className="font-mono">${printResultado.stampingUnit.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span></div>}
                  {printResultado.dobladoUnit > 0 && <div className="flex justify-between"><span className="text-slate-400">Doblado/u</span><span className="font-mono">${printResultado.dobladoUnit.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span></div>}
                  {printResultado.unitarioCajas > 0 && <div className="flex justify-between"><span className="text-slate-400">Packaging/u</span><span className="font-mono">${printResultado.unitarioCajas.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span></div>}
                  {printResultado.fleteUnit > 0 && <div className="flex justify-between"><span className="text-slate-400">Flete/u</span><span className="font-mono">${printResultado.fleteUnit.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span></div>}
                </div>
                <div className="border-t border-white/10 pt-3 space-y-1.5 text-[13px]">
                  <div className="flex justify-between font-semibold"><span className="text-slate-300">Costo unitario</span><span className="font-mono">${printResultado.costoTotal.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Margen</span><span>{printMargen}%</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Precio unitario</span><span className="font-mono text-sky-400 font-semibold">${printResultado.precioFinal.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span></div>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[13px] font-semibold text-slate-300">TOTAL</span>
                    <span className="text-[24px] font-bold text-sky-400 font-mono">${printResultado.precioTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <button onClick={saveEdit} disabled={mutation.isPending} className="w-full h-10 bg-sky-500 hover:bg-sky-600 text-white rounded-[10px] text-[13px] font-semibold transition-colors disabled:opacity-40">
                    {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button onClick={() => setIsEditing(false)} className="w-full h-10 bg-white/10 hover:bg-white/20 text-white rounded-[10px] text-[13px] font-semibold transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : isPrintpack ? (
              <div className="bg-slate-900 rounded-2xl p-5 text-center text-slate-400 text-[13px] lg:sticky lg:top-6">
                Completá los campos de cartulina para ver la cotización
              </div>
            ) : isLumapack && lumaResultado ? (
              <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-3 lg:sticky lg:top-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator size={14} className="text-sky-400" />
                  <p className="text-[13px] font-semibold">Cotización en tiempo real</p>
                </div>
                <div className="space-y-1.5 text-[13px]">
                  <div className="flex justify-between"><span className="text-slate-400">Ancho plancha</span><span className="font-mono">{lumaResultado.anchoPlancha.toFixed(1)} mm</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Largo plancha</span><span className="font-mono">{lumaResultado.largoPlancha.toFixed(1)} mm</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Superficie</span><span className="font-mono">{lumaResultado.superficieM2.toFixed(4)} m²</span></div>
                </div>
                <div className="border-t border-white/10 pt-3 space-y-1.5 text-[13px]">
                  <div className="flex justify-between"><span className="text-slate-400">Costo cartón</span><span className="font-mono">${lumaResultado.costoBase.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span></div>
                  {lumaResultado.costosExtra > 0 && <div className="flex justify-between"><span className="text-slate-400">Costos adicionales</span><span className="font-mono">${lumaResultado.costosExtra.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span></div>}
                  <div className="flex justify-between font-semibold"><span className="text-slate-300">Costo total</span><span className="font-mono">${lumaResultado.costoTotal.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span></div>
                </div>
                <div className="border-t border-white/10 pt-3 space-y-1.5 text-[13px]">
                  <div className="flex justify-between"><span className="text-slate-400">Factor margen</span><span>{(lumaFactor * 100).toFixed(0)}%</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Precio unitario</span><span className="font-mono text-sky-400 font-semibold">${lumaResultado.precioUnitario.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Ganancia unitaria</span><span className="font-mono text-emerald-400">${lumaResultado.gananciaUnitaria.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span></div>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[13px] font-semibold text-slate-300">TOTAL</span>
                    <span className="text-[24px] font-bold text-sky-400 font-mono">${lumaResultado.precioTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <button onClick={saveEdit} disabled={mutation.isPending} className="w-full h-10 bg-sky-500 hover:bg-sky-600 text-white rounded-[10px] text-[13px] font-semibold transition-colors disabled:opacity-40">
                    {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button onClick={() => setIsEditing(false)} className="w-full h-10 bg-white/10 hover:bg-white/20 text-white rounded-[10px] text-[13px] font-semibold transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : isLumapack ? (
              <div className="bg-slate-900 rounded-2xl p-5 text-center text-slate-400 text-[13px] lg:sticky lg:top-6">
                Completá los campos para ver la cotización
              </div>
            ) : (
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
            )}
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
                {isPrintpack ? (
                  <>
                    {[
                      ['Cantidad', pedido.cantidad != null ? `${pedido.cantidad.toLocaleString('es-AR')} u.` : null],
                      ['Entrega', pedido.entregaEst ? new Date(pedido.entregaEst).toLocaleDateString('es-AR') : null],
                    ].filter(([, v]) => v).map(([label, value]) => (
                      <div key={label as string} className="flex justify-between text-[13px]">
                        <span className="text-slate-400">{label}</span>
                        <span className="font-medium text-slate-900">{value}</span>
                      </div>
                    ))}
                  </>
                ) : isLumapack ? (
                  <>
                    {[
                      ['Tipo de caja', lumaDetalle?.tipoCaja?.nombre ?? null],
                      ['Alto (E)', pedido.alto != null ? `${pedido.alto} mm` : null],
                      ['Ancho (F)', pedido.ancho != null ? `${pedido.ancho} mm` : null],
                      ['Largo (G)', pedido.largo != null ? `${pedido.largo} mm` : null],
                      ['Material', pedido.material],
                      ['Cantidad', pedido.cantidad != null ? `${pedido.cantidad.toLocaleString('es-AR')} u.` : null],
                      ['Entrega', pedido.entregaEst ? new Date(pedido.entregaEst).toLocaleDateString('es-AR') : null],
                    ].filter(([, v]) => v).map(([label, value]) => (
                      <div key={label as string} className="flex justify-between text-[13px]">
                        <span className="text-slate-400">{label}</span>
                        <span className="font-medium text-slate-900">{value}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
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
                  </>
                )}
                {pedido.precioTotal && (
                  <div className="flex justify-between text-[13px] border-t border-slate-100 pt-2.5 mt-2.5">
                    <span className="font-semibold text-slate-900">Total</span>
                    <span className="font-bold text-sky-600 font-mono">${pedido.precioTotal.toLocaleString('es-AR')}</span>
                  </div>
                )}
                {pedido.notasCliente && (
                  <div className="border-t border-slate-100 pt-2.5 mt-2.5">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Notas del pedido</p>
                    <p className="text-[13px] text-slate-700 leading-relaxed">{pedido.notasCliente}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isLumapack && lumaDetalle && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Plancha y costos</p>
              <div className="space-y-2.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-400">Ancho plancha</span>
                  <span className="font-mono font-medium text-slate-900">{lumaDetalle.anchoPlancha.toFixed(1)} mm</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-400">Largo plancha</span>
                  <span className="font-mono font-medium text-slate-900">{lumaDetalle.largoPlancha.toFixed(1)} mm</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-400">Superficie</span>
                  <span className="font-mono font-medium text-slate-900">{lumaDetalle.superficieM2.toFixed(4)} m²</span>
                </div>
                <div className="border-t border-slate-100 pt-2.5 mt-2.5 space-y-1.5">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">Costo cartón</span>
                    <span className="font-mono font-medium text-slate-900">${lumaDetalle.costoBase.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">Factor de margen</span>
                    <span className="font-medium text-slate-900">{(lumaDetalle.factor * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">Precio unitario</span>
                    <span className="font-mono font-semibold text-sky-600">${lumaDetalle.precioUnitario.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">Ganancia unitaria</span>
                    <span className="font-mono font-medium text-emerald-600">${lumaDetalle.gananciaUnitaria.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isPrintpack && printDetalle && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Costos PrintPack</p>
              <div className="space-y-2.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-400">Costo cartulina/u</span>
                  <span className="font-mono font-medium text-slate-900">${printDetalle.costoCartulinaUnit.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span>
                </div>
                {printDetalle.troqueladoUnit > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">Troquelado/u</span>
                    <span className="font-mono font-medium text-slate-900">${printDetalle.troqueladoUnit.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span>
                  </div>
                )}
                {printDetalle.impresionUnit > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">Impresión/u</span>
                    <span className="font-mono font-medium text-slate-900">${printDetalle.impresionUnit.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span>
                  </div>
                )}
                {printDetalle.poliUnit > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">Polipropileno/u</span>
                    <span className="font-mono font-medium text-slate-900">${printDetalle.poliUnit.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span>
                  </div>
                )}
                {printDetalle.relieveUnit > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">Relieve/u</span>
                    <span className="font-mono font-medium text-slate-900">${printDetalle.relieveUnit.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span>
                  </div>
                )}
                {printDetalle.stampingUnit > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">Stamping/u</span>
                    <span className="font-mono font-medium text-slate-900">${printDetalle.stampingUnit.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span>
                  </div>
                )}
                {printDetalle.dobladoUnit > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">Doblado/u</span>
                    <span className="font-mono font-medium text-slate-900">${printDetalle.dobladoUnit.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span>
                  </div>
                )}
                {printDetalle.unitarioCajas > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">Packaging/u</span>
                    <span className="font-mono font-medium text-slate-900">${printDetalle.unitarioCajas.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span>
                  </div>
                )}
                {printDetalle.fleteUnit > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">Flete/u</span>
                    <span className="font-mono font-medium text-slate-900">${printDetalle.fleteUnit.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span>
                  </div>
                )}
                <div className="border-t border-slate-100 pt-2.5 mt-2.5 space-y-1.5">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">Costo unitario</span>
                    <span className="font-mono font-medium text-slate-900">${printDetalle.costoTotal.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">Margen</span>
                    <span className="font-medium text-slate-900">{printDetalle.margen}%</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">Precio unitario</span>
                    <span className="font-mono font-semibold text-sky-600">${printDetalle.precioFinal.toLocaleString('es-AR', { maximumFractionDigits: 4 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
          <div className="mt-4 flex items-start gap-3 bg-sky-50 border border-sky-100 rounded-xl p-3.5">
            <MessageSquare size={14} className="text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-sky-500 uppercase tracking-widest mb-1">Notas del cliente</p>
              <p className="text-[13px] text-slate-700 leading-relaxed">{pedido.notasCliente}</p>
            </div>
          </div>
        )}
      </div>

      {/* Archivos adjuntos */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Archivos adjuntos</p>
          {archivos.length > 0 && (
            <span className="text-[11px] text-slate-400 font-medium">
              {archivos.length} {archivos.length === 1 ? 'archivo' : 'archivos'}
            </span>
          )}
        </div>

        {archivos.length > 0 && (
          <div className="space-y-2 mb-4">
            {archivos.map(archivo => {
              const FIcon = getFileIcon(archivo.tipo)
              return (
                <div key={archivo.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 group">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                    <FIcon size={14} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-slate-900 truncate">{archivo.nombre}</p>
                    <p className="text-[11px] text-slate-400">{formatSize(archivo.tamanio)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <a href={archivo.url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-sky-500 rounded-lg transition-colors">
                      <Download size={13} />
                    </a>
                    <button
                      onClick={() => deleteMutation.mutate(archivo.id)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors disabled:opacity-40">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {uploadError && (
          <p className="text-[12px] text-red-500 mb-3 px-1">{uploadError}</p>
        )}

        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            isDragOver ? 'border-sky-300 bg-sky-50/50' : 'border-slate-200 hover:border-sky-300 hover:bg-sky-50/30'
          } ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}
          onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={e => { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            className="hidden"
            onChange={e => { if (e.target.files) { handleFiles(e.target.files); e.target.value = '' } }}
          />
          {isUploading ? (
            <p className="text-[13px] text-slate-400">Subiendo...</p>
          ) : (
            <>
              <Upload size={20} className="mx-auto text-slate-300 mb-2" />
              <p className="text-[13px] text-slate-400">Arrastrá archivos acá o <span className="text-sky-500 font-medium">seleccioná</span></p>
              <p className="text-[11px] text-slate-300 mt-1">JPG, PNG, WebP, PDF — máx. 10MB</p>
            </>
          )}
        </div>
      </div>

      {/* Historial */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Historial</p>
        {(pedido.eventos || []).length === 0 ? (
          <p className="text-[13px] text-slate-400">Sin eventos</p>
        ) : (
          <div className="space-y-4">
            {(pedido.eventos || []).map(ev => {
              const EvIcon = ESTADO_ICONS[ev.estado]
              return (
                <div key={ev.id} className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: (ESTADO_COLORS[ev.estado] || '#94a3b8') + '18', color: ESTADO_COLORS[ev.estado] || '#94a3b8' }}>
                    {EvIcon ? <EvIcon size={12} strokeWidth={2.5} /> : <div className="w-2 h-2 rounded-full" style={{ background: ESTADO_COLORS[ev.estado] || '#94a3b8' }} />}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-900">{ESTADO_LABELS[ev.estado] || ev.estado}</p>
                    {ev.descripcion && <p className="text-[12px] text-slate-500">{ev.descripcion}</p>}
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{new Date(ev.createdAt).toLocaleString('es-AR')}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
