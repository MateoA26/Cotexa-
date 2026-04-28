import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { pedidosApi } from '../services/api'
import { Pedido } from '../types'
import { ESTADO_LABELS, ESTADO_COLORS } from '../utils/estados'
import { Plus, Search } from 'lucide-react'

const ESTADOS_FILTRO = ['', 'COTIZACION', 'PENDIENTE', 'CONFIRMADO', 'EN_PRODUCCION', 'LISTO', 'ENVIADO', 'ENTREGADO', 'CANCELADO']

export default function Pedidos() {
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const navigate = useNavigate()

  const { data: pedidos = [], isLoading } = useQuery<Pedido[]>({
    queryKey: ['pedidos', estadoFiltro],
    queryFn: () => pedidosApi.getAll(estadoFiltro ? { estado: estadoFiltro } : undefined).then(r => r.data)
  })

  const filtrados = pedidos.filter(p =>
    !busqueda ||
    p.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    String(p.numeroPedido).includes(busqueda)
  )

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-7">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-7">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Pedidos</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">{pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} en total</p>
        </div>
        <button onClick={() => navigate('/pedidos/nuevo')}
          className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 h-9 rounded-[10px] text-[13px] font-semibold transition-colors shadow-[0_4px_12px_-4px_rgba(14,165,233,0.45)]">
          <Plus size={14} />
          Nuevo pedido
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 min-w-0 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Buscar cliente o #..." value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full h-9 pl-8 pr-3 border border-slate-200 rounded-[10px] text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {ESTADOS_FILTRO.map(e => (
              <button key={e} onClick={() => setEstadoFiltro(e)}
                className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors ${
                  estadoFiltro === e
                    ? 'bg-sky-500 text-white shadow-[0_2px_8px_-2px_rgba(14,165,233,0.5)]'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {e ? ESTADO_LABELS[e] : 'Todos'}
              </button>
            ))}
          </div>
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
            <table className="w-full min-w-[620px]">
              <thead>
                <tr className="border-b border-slate-100">
                  {['#', 'Cliente', 'Specs', 'Estado', 'Total', 'Fecha', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(p => (
                  <tr key={p.id} onClick={() => navigate(`/pedidos/${p.id}`)}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-5 py-3.5 text-[12px] font-mono text-slate-400">#{p.numeroPedido}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-semibold text-slate-900">{p.cliente.nombre}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.cliente.tipo}</p>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500">
                      {p.largo && p.ancho && p.alto ? `${p.largo}×${p.ancho}×${p.alto} cm` : '—'}
                      {p.material && ` · ${p.material}`}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-[3px] rounded-full"
                        style={{ background: ESTADO_COLORS[p.estado] + '1a', color: ESTADO_COLORS[p.estado] }}>
                        {ESTADO_LABELS[p.estado]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-900 font-mono">
                      {p.precioTotal ? `$${p.precioTotal.toLocaleString('es-AR')}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-sky-500 font-semibold">Ver →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
