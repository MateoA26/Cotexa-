import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../services/api'
import { DashboardData } from '../types'
import { ESTADO_LABELS, ESTADO_COLORS } from '../utils/estados'
import { Package, Users, TrendingUp, Clock } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get().then(r => r.data)
  })

  if (isLoading) return <div className="p-8 text-sm text-gray-400">Cargando...</div>
  if (!data) return null

  const diff = data.facturacionMesAnt > 0
    ? ((data.facturacionMes - data.facturacionMesAnt) / data.facturacionMesAnt * 100).toFixed(1)
    : null

  const pieData = data.pedidosPorEstado.map(p => ({
    name: ESTADO_LABELS[p.estado] || p.estado,
    value: p._count,
    color: ESTADO_COLORS[p.estado] || '#9ca3af'
  }))

  const metricas = [
    { label: 'Total pedidos', value: data.totalPedidos, icon: Package, color: 'text-sky-500' },
    { label: 'En proceso', value: data.pedidosActivos, icon: Clock, color: 'text-amber-500' },
    { label: 'Clientes', value: data.totalClientes, icon: Users, color: 'text-violet-500' },
    {
      label: 'Facturación este mes',
      value: `$${(data.facturacionMes || 0).toLocaleString('es-AR')}`,
      icon: TrendingUp,
      color: 'text-emerald-500',
      sub: diff ? `${Number(diff) >= 0 ? '▲' : '▼'} ${Math.abs(Number(diff))}% vs mes anterior` : undefined
    }
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Resumen de tu operación</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {metricas.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400">{label}</p>
              <Icon size={15} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className={`text-xs mt-1 ${diff && Number(diff) >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>{sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">Últimos pedidos</p>
          </div>
          {data.ultimosPedidos.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No hay pedidos todavía</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-50">
                  {['#', 'Cliente', 'Estado', 'Total', 'Fecha'].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.ultimosPedidos.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-gray-400">#{p.numeroPedido}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700 font-medium">{p.cliente.nombre}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: ESTADO_COLORS[p.estado] + '20', color: ESTADO_COLORS[p.estado] }}>
                        {ESTADO_LABELS[p.estado]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">
                      {p.precioTotal ? `$${p.precioTotal.toLocaleString('es-AR')}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {new Date(p.createdAt).toLocaleDateString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-900 mb-4">Por estado</p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [v, 'pedidos']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {pieData.map(p => (
                  <div key={p.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                      <span className="text-xs text-gray-500">{p.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900">{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-32 text-xs text-gray-400">Sin datos todavía</div>
          )}
        </div>
      </div>
    </div>
  )
}
