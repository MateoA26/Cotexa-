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
    queryFn: () => pedidosApi.getAll(estadoFiltro || undefined).then(r => r.data)
  })

  const filtrados = pedidos.filter(p =>
    !busqueda ||
    p.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    String(p.numeroPedido).includes(busqueda)
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-400">{pedidos.length} pedido(s) en total</p>
        </div>
        <button onClick={() => navigate('/pedidos/nuevo')}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Plus size={15} />
          Nuevo pedido
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Buscar cliente o número..." value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full h-9 pl-8 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {ESTADOS_FILTRO.map(e => (
              <button key={e} onClick={() => setEstadoFiltro(e)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  estadoFiltro === e ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {e ? ESTADO_LABELS[e] : 'Todos'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-gray-400">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            {busqueda || estadoFiltro ? 'Sin resultados' : 'No hay pedidos todavía'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                {['#', 'Cliente', 'Specs', 'Estado', 'Total', 'Fecha', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(p => (
                <tr key={p.id} onClick={() => navigate(`/pedidos/${p.id}`)}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-5 py-3.5 text-xs text-gray-400">#{p.numeroPedido}</td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-900">{p.cliente.nombre}</p>
                    <p className="text-xs text-gray-400">{p.cliente.tipo}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">
                    {p.largo && p.ancho && p.alto ? `${p.largo}×${p.ancho}×${p.alto} cm` : '—'}
                    {p.material && ` · ${p.material}`}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: ESTADO_COLORS[p.estado] + '18', color: ESTADO_COLORS[p.estado] }}>
                      {ESTADO_LABELS[p.estado]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">
                    {p.precioTotal ? `$${p.precioTotal.toLocaleString('es-AR')}` : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {new Date(p.createdAt).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-sky-500 font-medium">Ver →</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
