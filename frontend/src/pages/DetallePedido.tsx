import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pedidosApi } from '../services/api'
import { Pedido } from '../types'
import { ESTADO_LABELS, ESTADO_COLORS, ESTADOS_ORDEN } from '../utils/estados'
import { ArrowLeft } from 'lucide-react'

export default function DetallePedido() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [notasAdmin, setNotasAdmin] = useState('')
  const [notasSaved, setNotasSaved] = useState(false)

  const { data: pedido, isLoading } = useQuery<Pedido>({
    queryKey: ['pedido', id],
    queryFn: async () => {
      const res = await pedidosApi.getOne(Number(id))
      setNotasAdmin(res.data.notasAdmin || '')
      return res.data
    }
  })

  const mutation = useMutation({
    mutationFn: (data: any) => pedidosApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedido', id] })
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    }
  })

  const saveNotas = async () => {
    await mutation.mutateAsync({ notasAdmin })
    setNotasSaved(true)
    setTimeout(() => setNotasSaved(false), 2000)
  }

  if (isLoading) return <div className="p-8 text-sm text-gray-400">Cargando...</div>
  if (!pedido) return null

  const estadoIdx = ESTADOS_ORDEN.indexOf(pedido.estado)
  const estadosProgreso = ESTADOS_ORDEN.filter(e => e !== 'CANCELADO')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/pedidos')}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={17} />
        </button>
        <div className="flex-1 flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">Pedido #{pedido.numeroPedido}</h1>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: ESTADO_COLORS[pedido.estado] + '20', color: ESTADO_COLORS[pedido.estado] }}>
            {ESTADO_LABELS[pedido.estado]}
          </span>
        </div>
        <p className="text-sm text-gray-400">{pedido.cliente.nombre}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 overflow-x-auto">
        <div className="flex items-start min-w-max gap-0">
          {estadosProgreso.map((estado, i) => {
            const idx = estadosProgreso.indexOf(estado)
            const isDone = idx < estadoIdx
            const isActive = idx === estadoIdx
            return (
              <div key={estado} className="flex items-center">
                <div className="flex flex-col items-center w-20">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${
                    isDone ? 'bg-sky-600 border-sky-600 text-white' :
                    isActive ? 'border-sky-600 text-sky-600 bg-white' :
                    'border-gray-200 text-gray-300 bg-white'
                  }`}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <p className={`text-xs mt-1.5 text-center leading-tight ${isActive ? 'text-sky-600 font-medium' : 'text-gray-400'}`}>
                    {ESTADO_LABELS[estado]}
                  </p>
                </div>
                {i < estadosProgreso.length - 1 && (
                  <div className={`h-0.5 w-8 mb-5 flex-shrink-0 ${idx < estadoIdx ? 'bg-sky-600' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Cliente</p>
          <p className="font-semibold text-gray-900">{pedido.cliente.nombre}</p>
          {pedido.cliente.razonSocial && <p className="text-sm text-gray-500">{pedido.cliente.razonSocial}</p>}
          {pedido.cliente.email && <p className="text-sm text-gray-400 mt-1">{pedido.cliente.email}</p>}
          {pedido.cliente.telefono && <p className="text-sm text-gray-400">{pedido.cliente.telefono}</p>}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-2 inline-block ${
            pedido.cliente.tipo === 'B2B' ? 'bg-violet-50 text-violet-700' : 'bg-amber-50 text-amber-700'
          }`}>{pedido.cliente.tipo}</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Especificaciones</p>
          <div className="space-y-2">
            {[
              ['Medidas', pedido.largo ? `${pedido.largo} × ${pedido.ancho} × ${pedido.alto} cm` : null],
              ['Material', pedido.material],
              ['Impresión', pedido.impresion],
              ['Cantidad', pedido.cantidad ? `${pedido.cantidad.toLocaleString('es-AR')} u.` : null],
              ['Entrega', pedido.entregaEst ? new Date(pedido.entregaEst).toLocaleDateString('es-AR') : null],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label as string} className="flex justify-between text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
            {pedido.precioTotal && (
              <div className="flex justify-between text-sm border-t border-gray-100 pt-2 mt-2">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-sky-600">${pedido.precioTotal.toLocaleString('es-AR')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {pedido.valoresCampos && pedido.valoresCampos.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Opciones adicionales</p>
          <div className="grid grid-cols-3 gap-3">
            {pedido.valoresCampos.map(v => (
              <div key={v.id} className="text-sm">
                <span className="text-gray-400">{v.campo.nombre}: </span>
                <span className="font-medium text-gray-900">
                  {v.valor === 'true' ? 'Sí' : v.valor === 'false' ? 'No' : v.valor}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Gestionar pedido</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Cambiar estado</label>
            <select defaultValue={pedido.estado}
              onChange={e => mutation.mutate({ estado: e.target.value })}
              className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
              {ESTADOS_ORDEN.map(e => (
                <option key={e} value={e}>{ESTADO_LABELS[e]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Notas internas</label>
            <div className="flex gap-2">
              <input value={notasAdmin} onChange={e => setNotasAdmin(e.target.value)}
                placeholder="Notas para el equipo..."
                className="flex-1 h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              <button onClick={saveNotas}
                className={`h-9 px-3 rounded-lg text-xs font-medium transition-colors ${
                  notasSaved ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}>
                {notasSaved ? '✓ Guardado' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
        {pedido.notasCliente && (
          <div className="mt-3 text-sm bg-gray-50 rounded-lg p-3">
            <span className="text-gray-400 text-xs">Notas: </span>
            <span className="text-gray-700">{pedido.notasCliente}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Historial</p>
        {(pedido.eventos || []).length === 0 ? (
          <p className="text-sm text-gray-400">Sin eventos</p>
        ) : (
          <div className="space-y-3">
            {(pedido.eventos || []).map(ev => (
              <div key={ev.id} className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: ESTADO_COLORS[ev.estado] || '#9ca3af' }} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{ESTADO_LABELS[ev.estado] || ev.estado}</p>
                  {ev.descripcion && <p className="text-xs text-gray-500">{ev.descripcion}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(ev.createdAt).toLocaleString('es-AR')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
