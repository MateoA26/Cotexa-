import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pedidosApi, archivosApi } from '../services/api'
import { ESTADO_COLORS, ESTADO_LABELS } from '../utils/estados'
import { Pedido, ArchivoAdjunto } from '../types'
import { ClipboardList, Calendar, AlertTriangle, X, FileText, Image, File, Check } from 'lucide-react'

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

function formatHora(updatedAt: string) {
  return new Date(updatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function getArchivoIcon(tipo: string) {
  if (tipo.includes('pdf')) return <FileText size={13} />
  if (tipo.includes('image')) return <Image size={13} />
  return <File size={13} />
}

function getSpecs(pedido: Pedido): string[] {
  return [
    pedido.largo && pedido.ancho
      ? `${pedido.largo}×${pedido.ancho}${pedido.alto ? `×${pedido.alto}` : ''} cm`
      : null,
    pedido.material || null,
    pedido.cantidad ? `${pedido.cantidad.toLocaleString('es-AR')} u.` : null,
  ].filter(Boolean) as string[]
}

function PedidoCard({ pedido, onAccion, isPending }: {
  pedido: Pedido
  onAccion: (id: number, estado: string) => void
  isPending: boolean
}) {
  const [comentario, setComentario] = useState('')
  const [exito, setExito] = useState(false)
  const queryClient = useQueryClient()

  const { data: archivos = [] } = useQuery<ArchivoAdjunto[]>({
    queryKey: ['archivos', pedido.id],
    queryFn: async () => {
      const res = await archivosApi.getAll(pedido.id)
      return res.data
    }
  })

  const comentarioMutation = useMutation({
    mutationFn: () => pedidosApi.update(pedido.id, { notasAdmin: comentario }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      setComentario('')
      setExito(true)
      setTimeout(() => setExito(false), 2000)
    }
  })

  const urgencia = getUrgencia(pedido.entregaEst)
  const specs = getSpecs(pedido)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
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

      <p className="text-[17px] font-semibold text-slate-800 leading-tight -mt-1">
        {pedido.cliente.nombre}
      </p>

      {specs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {specs.map((spec, i) => (
            <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[12px] font-medium rounded-lg">
              {spec}
            </span>
          ))}
        </div>
      )}

      {pedido.valoresCampos && pedido.valoresCampos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pedido.valoresCampos.map(vc => (
            <span key={vc.id} className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[11px] font-medium rounded-lg">
              {vc.campo.nombre}: {vc.valor}
            </span>
          ))}
        </div>
      )}

      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl w-fit text-[12px] font-medium ${URGENCIA_STYLES[urgencia]}`}>
        {urgencia === 'rojo' ? <AlertTriangle size={13} /> : <Calendar size={13} />}
        <span>
          {pedido.entregaEst ? `Entrega: ${formatFecha(pedido.entregaEst)}` : 'Sin fecha de entrega'}
        </span>
      </div>

      {pedido.notasAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-[12px] text-amber-800 leading-relaxed">
          <span className="font-semibold">Nota: </span>{pedido.notasAdmin}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Comentario del operario</span>
        <div className="flex gap-2 items-end">
          <textarea
            rows={2}
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            placeholder="Agregar comentario para el equipo..."
            className="flex-1 px-3 py-2 border border-slate-200 rounded-[10px] text-[13px] text-slate-700 bg-white focus:outline-none focus:border-sky-400 resize-none"
          />
          <button
            onClick={() => comentarioMutation.mutate()}
            disabled={!comentario.trim() || comentarioMutation.isPending || exito}
            className={`h-9 px-3.5 text-white text-[13px] font-semibold rounded-[10px] transition-colors disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0 ${
              exito ? 'bg-emerald-500' : 'bg-sky-500 hover:bg-sky-600'
            }`}
          >
            {exito ? <><Check size={14} /> Enviado</> : 'Enviar'}
          </button>
        </div>
      </div>

      {archivos.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Archivos adjuntos</span>
          <div className="flex flex-wrap gap-2">
            {archivos.map(archivo => (
              <button
                key={archivo.id}
                onClick={() => window.open(archivo.url, '_blank')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[12px] text-slate-600 cursor-pointer transition-colors"
              >
                {getArchivoIcon(archivo.tipo)}
                <span>{archivo.nombre.length > 20 ? archivo.nombre.slice(0, 20) + '…' : archivo.nombre}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {pedido.estado === 'CONFIRMADO' && (
        <button
          onClick={() => onAccion(pedido.id, 'EN_PRODUCCION')}
          disabled={isPending}
          className="mt-1 w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold text-[14px] transition-colors disabled:opacity-60"
        >
          Iniciar producción
        </button>
      )}
      {pedido.estado === 'EN_PRODUCCION' && (
        <button
          onClick={() => onAccion(pedido.id, 'LISTO')}
          disabled={isPending}
          className="mt-1 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold text-[14px] transition-colors disabled:opacity-60"
        >
          Marcar como listo
        </button>
      )}
    </div>
  )
}

function CompletadoCard({ pedido }: { pedido: Pedido }) {
  const specs = getSpecs(pedido)
  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 flex flex-col gap-2 opacity-75">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[18px] font-bold text-slate-900">#{pedido.numeroPedido}</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">{formatHora(pedido.updatedAt)}</span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600">
            Listo
          </span>
        </div>
      </div>
      <p className="text-[15px] font-semibold text-slate-700 leading-tight">{pedido.cliente.nombre}</p>
      {specs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {specs.map((spec, i) => (
            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[11px] font-medium rounded-md">
              {spec}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Produccion() {
  const [filtro, setFiltro] = useState<Filtro>('TODOS')
  const [fechaFiltro, setFechaFiltro] = useState('')
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

  const pedidosFiltrados = pedidosActivos
    .filter(p => filtro === 'TODOS' || p.estado === filtro)
    .filter(p => {
      if (!fechaFiltro) return true
      if (!p.entregaEst) return false
      return p.entregaEst.slice(0, 10) <= fechaFiltro
    })

  const hoy = new Date().toISOString().slice(0, 10)
  const completadosHoy = allPedidos
    .filter(p => p.estado === 'LISTO' && p.updatedAt.slice(0, 10) === hoy)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const filtros: { key: Filtro; label: string }[] = [
    { key: 'TODOS', label: 'Todos' },
    { key: 'CONFIRMADO', label: 'Confirmados' },
    { key: 'EN_PRODUCCION', label: 'En producción' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-[22px] font-bold text-slate-900 leading-tight">Cola de producción</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          {pedidosActivos.length} pedido{pedidosActivos.length !== 1 ? 's' : ''} activo{pedidosActivos.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
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

      <div className="flex items-center gap-2 mb-5">
        <label className="text-[13px] text-slate-500 font-medium whitespace-nowrap">Entregar antes de:</label>
        <div className="relative flex items-center">
          <input
            type="date"
            value={fechaFiltro}
            onChange={e => setFechaFiltro(e.target.value)}
            className={`h-9 border border-slate-200 rounded-[10px] text-[13px] text-slate-700 bg-white focus:outline-none focus:border-sky-400 ${fechaFiltro ? 'pl-3 pr-8' : 'px-3'}`}
          />
          {fechaFiltro && (
            <button
              onClick={() => setFechaFiltro('')}
              className="absolute right-2.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

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
          {pedidosFiltrados.map(pedido => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              onAccion={(id, estado) => mutation.mutate({ id, estado })}
              isPending={mutation.isPending}
            />
          ))}
        </div>
      )}

      {!isLoading && completadosHoy.length > 0 && (
        <>
          <div className="border-t border-slate-200 my-6" />
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-[16px] font-bold text-slate-700">Completados hoy</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
              {completadosHoy.length}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {completadosHoy.map(pedido => (
              <CompletadoCard key={pedido.id} pedido={pedido} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
