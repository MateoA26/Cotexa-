import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi, pedidosApi } from '../services/api'
import { DashboardData, Pedido } from '../types'
import { ESTADO_LABELS, ESTADO_COLORS } from '../utils/estados'
import {
  Package, Users, TrendingUp, Clock,
  ArrowUpRight, ArrowDownRight,
  FileText, CheckCircle2, Truck, XCircle,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts'

// ── Helpers ──────────────────────────────────────────────────────────────────

const SPARKS: Record<string, number[]> = {
  totalPedidos:    [0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 3],
  pedidosActivos:  [0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 2, 2],
  totalClientes:   [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3],
  facturacionMes:  [120, 180, 240, 220, 310, 380, 420, 500, 560, 640, 720, 803],
}

const ESTADO_ICONS: Record<string, any> = {
  COTIZACION: FileText,
  CONFIRMADO: CheckCircle2,
  EN_PRODUCCION: Package,
  ENTREGADO: Truck,
  CANCELADO: XCircle,
}

const AVATAR_COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899']
const initials = (n: string) =>
  n.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
const colorFor = (n: string) => AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length]

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const id = `spark-${color.replace('#', '')}`
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={data.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} fill={`url(#${id})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function Delta({ value, light }: { value: number; light?: boolean }) {
  const up = value >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  const cls = light
    ? 'text-white bg-white/20'
    : up ? 'text-emerald-600 bg-emerald-100' : 'text-red-600 bg-red-100'
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${cls}`}>
      <Icon size={10} strokeWidth={2.5} />{Math.abs(value).toFixed(1)}%
    </span>
  )
}

function formatValue(value: string, mobile?: boolean): string {
  if (!mobile) return value
  // Si empieza con $ y tiene más de 10 caracteres, abreviarlo
  if (value.startsWith('$')) {
    const num = Number(value.replace(/\$|\.|\s/g, '').replace(',', '.'))
    if (!isNaN(num)) {
      if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`
      if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`
      if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`
    }
  }
  return value
}

function MetricCard({ label, value, icon: Icon, tint, delta, spark }: {
  label: string; value: string; icon: any; tint: string; delta?: number; spark: number[]
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: tint + '1a', color: tint }}>
          <Icon size={14} strokeWidth={2.2} />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2.5 flex-wrap">
        <div className="text-[22px] font-bold text-slate-900 tracking-tight tabular-nums leading-none font-mono">
          <span className="hidden sm:inline">{value}</span>
          <span className="sm:hidden">{formatValue(value, true)}</span>
        </div>
        {delta !== undefined && <Delta value={delta} />}
      </div>
      <div className="mt-3.5 -mx-1.5 h-9">
        <Sparkline data={spark} color={tint} />
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get().then(r => r.data),
  })

  const { data: allPedidos = [] } = useQuery<Pedido[]>({
    queryKey: ['pedidos-trend'],
    queryFn: () => pedidosApi.getAll().then(r => r.data),
  })

  const trendData = useMemo(() => {
    const now = new Date()
    const dateMap: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      dateMap[d.toISOString().split('T')[0]] = 0
    }
    allPedidos.forEach(p => {
      const date = p.createdAt.split('T')[0]
      if (dateMap[date] !== undefined) dateMap[date]++
    })
    return Object.entries(dateMap).map(([date, pedidos]) => ({
      fecha: new Date(date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
      pedidos,
    }))
  }, [allPedidos])

  if (isLoading) return (
    <div className="max-w-[1360px] mx-auto px-7 py-7">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 h-32 animate-pulse" />
        ))}
      </div>
    </div>
  )
  if (!data) return null

  const diff = data.facturacionMesAnt > 0
    ? (data.facturacionMes - data.facturacionMesAnt) / data.facturacionMesAnt * 100
    : null

  const pieData = data.pedidosPorEstado.map(p => ({
    name: ESTADO_LABELS[p.estado] || p.estado,
    value: p._count,
    color: ESTADO_COLORS[p.estado] || '#94a3b8',
    estado: p.estado,
  }))

  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="max-w-[1360px] mx-auto px-7 py-7">

      {/* Header */}
      <div className="mb-7">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-1.5">{today}</p>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Resumen de tu operación</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <MetricCard
          label="Total pedidos"
          value={String(data.totalPedidos)}
          icon={Package}
          tint="#0ea5e9"
          spark={SPARKS.totalPedidos}
        />
        <MetricCard
          label="En proceso"
          value={String(data.pedidosActivos)}
          icon={Clock}
          tint="#f59e0b"
          spark={SPARKS.pedidosActivos}
        />
        <MetricCard
          label="Clientes"
          value={String(data.totalClientes)}
          icon={Users}
          tint="#8b5cf6"
          spark={SPARKS.totalClientes}
        />
        <MetricCard
          label="Facturación del mes"
          value={`$${(data.facturacionMes || 0).toLocaleString('es-AR')}`}
          icon={TrendingUp}
          tint="#10b981"
          delta={diff !== null ? diff : undefined}
          spark={SPARKS.facturacionMes}
        />
      </div>

      {/* Main row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* Últimos pedidos */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 tracking-tight">Últimos pedidos</p>
            <span className="text-[11px] text-slate-400 font-medium">{data.ultimosPedidos.length} recientes</span>
          </div>
          {data.ultimosPedidos.length === 0 ? (
            <div className="p-10 text-center text-[13px] text-slate-400">No hay pedidos todavía</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[440px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['#', 'Cliente', 'Estado', 'Total', 'Fecha'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.ultimosPedidos.map(p => {
                    const EstIcon = ESTADO_ICONS[p.estado]
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3.5 text-[12px] font-mono text-slate-400 tabular-nums">#{p.numeroPedido}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 text-white"
                              style={{ background: colorFor(p.cliente.nombre) }}>
                              {initials(p.cliente.nombre)}
                            </div>
                            <span className="text-[13px] font-semibold text-slate-900">{p.cliente.nombre}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
                            style={{ background: ESTADO_COLORS[p.estado] + '18', color: ESTADO_COLORS[p.estado] }}>
                            {EstIcon && <EstIcon size={10} strokeWidth={2.5} />}
                            {ESTADO_LABELS[p.estado]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[13px] font-semibold text-slate-900 font-mono tabular-nums">
                          {p.precioTotal ? `$${p.precioTotal.toLocaleString('es-AR')}` : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-[12px] text-slate-400">
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

        {/* Por estado */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-900 tracking-tight mb-5">Por estado</p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={38} outerRadius={60} strokeWidth={0}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px -4px rgba(0,0,0,0.1)' }}
                    formatter={(v: any) => [v, 'pedidos']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map(p => {
                  const Icon = ESTADO_ICONS[p.estado]
                  return (
                    <div key={p.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                        <span className="text-[12px] text-slate-500">{p.name}</span>
                      </div>
                      <span className="text-[12px] font-semibold text-slate-900 font-mono tabular-nums">{p.value}</span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-32 text-[12px] text-slate-400">Sin datos todavía</div>
          )}
        </div>
      </div>

      {/* Trend chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold text-slate-900 tracking-tight">Tendencia de pedidos</p>
          <span className="text-[11px] text-slate-400 font-medium">Últimos 30 días</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="fecha"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px -4px rgba(0,0,0,0.1)' }}
              formatter={(v: any) => [v, 'pedidos']}
              labelStyle={{ color: '#334155', fontWeight: 600 }}
              cursor={{ stroke: '#0ea5e9', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Line
              type="monotone"
              dataKey="pedidos"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
