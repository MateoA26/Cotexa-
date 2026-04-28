import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pedidosApi } from '../services/api'
import { ESTADO_COLORS, ESTADO_LABELS } from '../utils/estados'
import { Pedido } from '../types'
import { ClipboardList, Calendar, AlertTriangle } from 'lucide-react'

type Filtro = 'TODOS' | 'CONFIRMADO' | 'EN_PRODUCCION'

function getUrgencia(entregaEst?: string) {
  if (!entregaEst) return 'sin-fecha'
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const entrega = new Date(entregaEst)
  entrega.setHours(0, 0, 0, 0)
  const diffDias = Math.floor((entrega.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDias < 0 || diffDias === 0) return 'rojo'
  if (diffDias <= 3) return 'amarillo'
  return 'verde'
}

const URGENCIA_STYLES = {
  verde: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  amarillo: 'bg-amber-50 text-amber-700 border border-amber-200',
  rojo: 'bg-red-50 text-red-700 border border-red-200',
  'sin-fecha': 'bg-slate-100 text-slate-500 border border-slate-200',
}

function formatFecha(entregaEst?: string) {
  if (!entregaEst) return 'Sin fecha'
  return new Date(entregaEst).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function Produccion() {
  const [filtro, setFiltro] = useState<Filtro>('TODOS')
  const queryClient = useQueryClient()

  const { data: allPedidos = [], isLoading } = useQuery({
    queryKey: ['pedidos'],
    queryFn: async () => {
      const res = await pedidosApi.getAll()
      return res.data as Pedido[]
    }
  })

  const mutation = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      pedidosApi.update(id, { estado }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pedidos'] })
  })

  const pedidosActivos = allPedidos
    .filter(p => p.estado === 'CONFIRMADO' || p.estado === 'EN_PRODUCCION')
    .sort((a, b) => {
      if (!a.entregaEst && !b.entregaEst) return 0
      if (!a.entregaEst) return 1
      if (!b.entregaEst) return -1
      return new Date(a.entregaEst).getTime() - new Date(b.entregaEst).getTime()
    })

  const pedidosFiltrados = filtro === 'TODOS'
    ? pedidosActivos
    : pedidosActivos.filter(p => p.estado === filtro)

  const filtros: { key: Filtro; label: string }[] = [
    { key: 'TODOS', label: 'Todos' },
    { key: 'CONFIRMADO', label: 'Confirmados' },
    { key: 'EN_PRODUCCION', label: 'En producción' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[22px] font-bold text-slate-900 leading-tight">Cola de producción</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          {pedidosActivos.length} pedido{pedidosActivos.length !== 1 ? 's' : ''} activo{pedidosActivos.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {filtros.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
              filtro === f.key
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {f.label}
            {f.key !== 'TODOS' && (
              <span className="ml-1.5 opacity-70">
                {pedidosActivos.filter(p => p.estado === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-slate-400 text-[13px]">Cargando pedidos…</div>
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <ClipboardList size={24} className="text-slate-400" />
          </div>
          <p className="text-slate-600 font-semibold text-[15px]">No hay pedidos en cola</p>
          <p className="text-slate-400 text-[13px] mt-1">Cuando haya pedidos confirmados aparecerán aquí</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pedidosFiltrados.map(pedido => {
            const urgencia = getUrgencia(pedido.entregaEst)
            const specs = [
              pedido.largo && pedido.ancho
                ? `${pedido.largo}×${pedido.ancho}${pedido.alto ? `×${pedido.alto}` : ''} cm`
                : null,
              pedido.material || null,
              pedido.cantidad ? `${pedido.cantidad.toLocaleString('es-AR')} u.` : null,
            ].filter(Boolean)

            return (
              <div key={pedido.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
                {/* Top row: número + badge estado */}
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[20px] font-bold text-slate-900">#{pedido.numeroPedido}</span>
                  <span
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                    style={{
                      background: ESTADO_COLORS[pedido.estado] + '22',
                      color: ESTADO_COLORS[pedido.estado],
                    }}
                  >
                    {ESTADO_LABELS[pedido.estado]}
                  </span>
                </div>

                {/* Cliente */}
                <p className="text-[17px] font-semibold text-slate-800 leading-tight -mt-1">
                  {pedido.cliente.nombre}
                </p>

                {/* Specs */}
                {specs.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {specs.map((spec, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[12px] font-medium rounded-lg">
                        {spec}
                      </span>
                    ))}
                  </div>
                )}

                {/* Campos custom */}
                {pedido.valoresCampos && pedido.valoresCampos.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {pedido.valoresCampos.map(vc => (
                      <span key={vc.id} className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[11px] font-medium rounded-lg">
                        {vc.campo.nombre}: {vc.valor}
                      </span>
                    ))}
                  </div>
                )}

                {/* Fecha entrega */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl w-fit text-[12px] font-medium ${URGENCIA_STYLES[urgencia]}`}>
                  {urgencia === 'rojo' ? <AlertTriangle size={13} /> : <Calendar size={13} />}
                  <span>
                    {pedido.entregaEst ? `Entrega: ${formatFecha(pedido.entregaEst)}` : 'Sin fecha de entrega'}
                  </span>
                </div>

                {/* Notas internas */}
                {pedido.notasAdmin && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-[12px] text-amber-800 leading-relaxed">
                    <span className="font-semibold">Nota: </span>{pedido.notasAdmin}
                  </div>
                )}

                {/* Botón acción */}
                {pedido.estado === 'CONFIRMADO' && (
                  <button
                    onClick={() => mutation.mutate({ id: pedido.id, estado: 'EN_PRODUCCION' })}
                    disabled={mutation.isPending}
                    className="mt-1 w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold text-[14px] transition-colors disabled:opacity-60"
                  >
                    Iniciar producción
                  </button>
                )}
                {pedido.estado === 'EN_PRODUCCION' && (
                  <button
                    onClick={() => mutation.mutate({ id: pedido.id, estado: 'LISTO' })}
                    disabled={mutation.isPending}
                    className="mt-1 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold text-[14px] transition-colors disabled:opacity-60"
                  >
                    Marcar como listo
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
