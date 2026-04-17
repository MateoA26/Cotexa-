import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { notificacionesApi } from '../services/api'
import { Notificacion } from '../types'
import { Bell } from 'lucide-react'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  return `Hace ${Math.floor(hrs / 24)}d`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: notifs = [] } = useQuery<Notificacion[]>({
    queryKey: ['notificaciones'],
    queryFn: () => notificacionesApi.getAll().then(r => r.data),
    refetchInterval: 30000,
  })

  const leerMut = useMutation({
    mutationFn: (id: number) => notificacionesApi.leer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificaciones'] }),
  })

  const leerTodasMut = useMutation({
    mutationFn: () => notificacionesApi.leerTodas(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificaciones'] }),
  })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = notifs.filter(n => !n.leida).length

  const handleClick = (n: Notificacion) => {
    if (!n.leida) leerMut.mutate(n.id)
    setOpen(false)
    if (n.pedidoId) navigate(`/pedidos/${n.pedidoId}`)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-1.5 text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/10"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
          style={{ maxHeight: '420px' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Notificaciones</p>
            {unread > 0 && (
              <button
                onClick={() => leerTodasMut.mutate()}
                className="text-xs text-sky-500 hover:text-sky-700 font-medium transition-colors"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
            {notifs.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Sin notificaciones
              </div>
            ) : (
              notifs.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                    !n.leida ? 'bg-sky-50/60' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-1.5">
                    <div className={`w-2 h-2 rounded-full ${!n.leida ? 'bg-sky-500' : 'bg-transparent'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.leida ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                      {n.mensaje}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.creadaEn)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
