import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { pedidosApi } from '../services/api'
import { Pedido } from '../types'
import { ESTADO_LABELS, ESTADO_COLORS } from '../utils/estados'
import { Plus, Search, Package, FileText, CheckCircle2, Truck, XCircle, Clock } from 'lucide-react'

const ESTADOS_FILTRO = ['', 'COTIZACION', 'PENDIENTE', 'CONFIRMADO', 'EN_PRODUCCION', 'LISTO', 'ENVIADO', 'ENTREGADO', 'CANCELADO']

const ESTADO_ICONS: Record<string, any> = {
  COTIZACION: FileText, PENDIENTE: Clock, CONFIRMADO: CheckCircle2,
  EN_PRODUCCION: Package, LISTO: CheckCircle2, ENVIADO: Truck,
  ENTREGADO: Truck, CANCELADO: XCircle,
}

const AVATAR_COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899']
const initials = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
const colorFor = (n: string) => AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length]

export default function Pedidos() {
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const navigate = useNavigate()

  const { data: pedidos = [], isLoading } = useQuery<Pedido[]>({
    queryKey: ['pedidos', estadoFiltro],
    queryFn: () => pedidosApi.getAll(estadoFiltro ? { estado: estadoFiltro } : undefined).then(r => r.data),
  })

  const filtrados = pedidos.filter(p =>
    !busqueda ||
    p.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    String(p.numeroPedido).includes(busqueda)
  )

  // Count per state across all loaded pedidos (unfiltered)
  const countPorEstado = (e: string) =>
    e ? pedidos.filter(p => p.estado === e).length : pedidos.length

  return (
    <div className="max-w-[1360px] mx-auto px-7 py-7">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-7">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pedidos</h1>
          <p className="text-sm text-slate-500 mt-1">{pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} en total</p>
        </div>
        <button onClick={() => navigate('/pedidos/nuevo')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-[10px] text-[13px] font-semibold shadow-[0_4px_12px_-4px_rgba(14,165,233,0.4)] transition-colors self-start sm:self-auto">
          <Plus size={14} strokeWidth={2.5} />
          Nuevo pedido
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-5">
        {/* Search */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] bg-white border border-slate-200 min-w-0 w-full sm:max-w-xs">
          <Search size={13} className="text-slate-400 flex-shrink-0" />
          <input placeholder="Buscar cliente o #..." value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="flex-1 text-[13px] bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-400 min-w-0" />
        </div>

        {/* State pills */}
        <div className="flex gap-1.5 flex-wrap">
          {ESTADOS_FILTRO.map(e => {
            const cnt = countPorEstado(e)
            return (
              <button key={e} onClick={() => setEstadoFiltro(e)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap ${
                  estadoFiltro === e
                    ? 'bg-sky-500 text-white shadow-[0_2px_8px_-2px_rgba(14,165,233,0.5)]'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {e ? ESTADO_LABELS[e] : 'Todos'}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  estadoFiltro === e ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
                }`}>{cnt}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-[13px] text-slate-400">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="p-12 text-center text-[13px] text-slate-400">
            {busqueda || estadoFiltro ? 'Sin resultados para esta búsqueda' : 'No hay pedidos todavía'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px]">
              <thead>
                <tr className="border-b border-slate-100">
                  {['#', 'Cliente', 'Estado', 'Specs', 'Total', 'Fecha'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(p => {
                  const EstIcon = ESTADO_ICONS[p.estado]
                  return (
                    <tr key={p.id} onClick={() => navigate(`/pedidos/${p.id}`)}
                      className="hover:bg-slate-50/70 transition-colors border-b border-slate-100 last:border-0 cursor-pointer">
                      <td className="px-4 py-3.5 text-[12px] font-mono text-slate-400 tabular-nums whitespace-nowrap">
                        #{p.numeroPedido}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 text-white"
                            style={{ background: colorFor(p.cliente.nombre) }}>
                            {initials(p.cliente.nombre)}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-slate-900">{p.cliente.nombre}</p>
                            <p className="text-[11px] text-slate-400">{p.cliente.tipo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
                          style={{ background: ESTADO_COLORS[p.estado] + '18', color: ESTADO_COLORS[p.estado] }}>
                          {EstIcon && <EstIcon size={10} strokeWidth={2.5} />}
                          {ESTADO_LABELS[p.estado]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[12px] text-slate-500">
                        {p.largo && p.ancho && p.alto ? `${p.largo}×${p.ancho}×${p.alto} cm` : '—'}
                        {p.material && ` · ${p.material}`}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-semibold text-slate-900 font-mono tabular-nums whitespace-nowrap">
                        {p.precioTotal ? `$${p.precioTotal.toLocaleString('es-AR')}` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-[12px] text-slate-400 whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString('es-AR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
