import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientesApi, pedidosApi } from '../services/api'
import { Cliente, Pedido } from '../types'
import { ESTADO_LABELS, ESTADO_COLORS } from '../utils/estados'
import { Plus, X, Users, Package, ChevronRight } from 'lucide-react'

const initForm = { nombre: '', email: '', telefono: '', tipo: 'B2C', razonSocial: '', cuit: '', notas: '' }

const AVATAR_COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899']
const initials = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
const colorFor = (n: string) => AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length]

export default function Clientes() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(initForm)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)

  const { data: clientes = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: () => clientesApi.getAll().then(r => r.data)
  })

  const { data: clientePedidos = [], isLoading: loadingPedidos } = useQuery<Pedido[]>({
    queryKey: ['pedidos', 'cliente', selectedCliente?.id],
    queryFn: () => pedidosApi.getAll({ clienteId: selectedCliente!.id }).then(r => r.data),
    enabled: !!selectedCliente,
  })

  const mutation = useMutation({
    mutationFn: () => clientesApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      setShowModal(false)
      setForm(initForm)
    }
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const ic = 'w-full h-10 px-3 border border-slate-200 rounded-[10px] text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white'
  const lc = 'block text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5'

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-7">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-7">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Clientes</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 h-9 rounded-[10px] text-[13px] font-semibold transition-colors shadow-[0_4px_12px_-4px_rgba(14,165,233,0.45)]">
          <Plus size={14} />
          Nuevo cliente
        </button>
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-[13px] text-slate-400">Cargando...</div>
      ) : clientes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Users size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-[13px] text-slate-400">No hay clientes todavía</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {clientes.map(c => (
            <div key={c.id} onClick={() => setSelectedCliente(c)}
              className="bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer hover:border-sky-200 hover:shadow-[0_4px_16px_-4px_rgba(14,165,233,0.12)] transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-bold text-white flex-shrink-0"
                  style={{ background: colorFor(c.nombre) }}>
                  {initials(c.nombre)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-slate-900 truncate">{c.nombre}</p>
                  {c.razonSocial && <p className="text-[11px] text-slate-400 truncate">{c.razonSocial}</p>}
                </div>
              </div>
              <div className="space-y-1 mb-4 min-h-[36px]">
                {c.email && <p className="text-[12px] text-slate-500 truncate">{c.email}</p>}
                {c.telefono && <p className="text-[12px] text-slate-500">{c.telefono}</p>}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-[3px] rounded-full ${
                  c.tipo === 'B2B' ? 'bg-sky-50 text-sky-600' : 'bg-purple-50 text-purple-600'
                }`}>{c.tipo}</span>
                <div className="flex items-center gap-1.5 text-[12px]">
                  <Package size={11} className="text-slate-300" />
                  <span className="font-mono font-semibold text-slate-600">{c._count?.pedidos ?? 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client detail drawer */}
      {selectedCliente && (
        <>
          <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setSelectedCliente(null)} />
          <div className="fixed inset-y-0 right-0 z-40 w-full max-w-[400px] bg-white shadow-2xl flex flex-col">

            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-slate-900 text-[15px]">{selectedCliente.nombre}</p>
                  <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-[3px] rounded-full ${
                    selectedCliente.tipo === 'B2B' ? 'bg-sky-50 text-sky-600' : 'bg-purple-50 text-purple-600'
                  }`}>{selectedCliente.tipo}</span>
                </div>
                {selectedCliente.razonSocial && (
                  <p className="text-[13px] text-slate-500">{selectedCliente.razonSocial}</p>
                )}
              </div>
              <button onClick={() => setSelectedCliente(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 border-b border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Información</p>
              <div className="space-y-2.5">
                {selectedCliente.email && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">Email</span>
                    <span className="text-slate-900 font-medium">{selectedCliente.email}</span>
                  </div>
                )}
                {selectedCliente.telefono && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">Teléfono</span>
                    <span className="text-slate-900 font-medium">{selectedCliente.telefono}</span>
                  </div>
                )}
                {selectedCliente.cuit && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-400">CUIT</span>
                    <span className="text-slate-900 font-medium font-mono">{selectedCliente.cuit}</span>
                  </div>
                )}
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-400">Cliente desde</span>
                  <span className="text-slate-900 font-medium">
                    {new Date(selectedCliente.createdAt).toLocaleDateString('es-AR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Historial de pedidos
              </p>
              {loadingPedidos ? (
                <p className="text-[13px] text-slate-400">Cargando pedidos...</p>
              ) : clientePedidos.length === 0 ? (
                <div className="text-center py-8">
                  <Package size={28} className="text-slate-200 mx-auto mb-2" />
                  <p className="text-[13px] text-slate-400">Sin pedidos registrados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clientePedidos.map(p => (
                    <button key={p.id} onClick={() => navigate(`/pedidos/${p.id}`)}
                      className="w-full flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-left">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[13px] font-semibold text-slate-900 font-mono">#{p.numeroPedido}</span>
                          <span className="inline-flex items-center text-[11px] font-semibold px-2 py-[2px] rounded-full"
                            style={{ background: ESTADO_COLORS[p.estado] + '1a', color: ESTADO_COLORS[p.estado] }}>
                            {ESTADO_LABELS[p.estado]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[12px] text-slate-400">
                          <span>{new Date(p.createdAt).toLocaleDateString('es-AR')}</span>
                          {p.precioTotal && (
                            <span className="font-semibold text-slate-700 font-mono">
                              ${p.precioTotal.toLocaleString('es-AR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* New client modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-bold text-slate-900">Nuevo cliente</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              {[['B2C', 'Persona'], ['B2B', 'Empresa']].map(([val, label]) => (
                <button key={val} onClick={() => setForm(f => ({ ...f, tipo: val }))}
                  className={`flex-1 h-10 rounded-[10px] text-[13px] font-semibold transition-colors ${
                    form.tipo === val
                      ? 'bg-sky-500 text-white shadow-[0_4px_12px_-4px_rgba(14,165,233,0.45)]'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>{label}</button>
              ))}
            </div>

            <div className="space-y-3">
              {form.tipo === 'B2B' && (
                <>
                  <div>
                    <label className={lc}>Razón social</label>
                    <input value={form.razonSocial} onChange={set('razonSocial')} className={ic} placeholder="Empresa S.A." />
                  </div>
                  <div>
                    <label className={lc}>CUIT</label>
                    <input value={form.cuit} onChange={set('cuit')} className={ic} placeholder="30-12345678-9" />
                  </div>
                </>
              )}
              <div>
                <label className={lc}>{form.tipo === 'B2C' ? 'Nombre completo' : 'Contacto'} *</label>
                <input value={form.nombre} onChange={set('nombre')} className={ic} placeholder="Juan García" />
              </div>
              <div>
                <label className={lc}>Email</label>
                <input type="email" value={form.email} onChange={set('email')} className={ic} placeholder="juan@empresa.com" />
              </div>
              <div>
                <label className={lc}>Teléfono</label>
                <input value={form.telefono} onChange={set('telefono')} className={ic} placeholder="11 4500 1234" />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => { setShowModal(false); setForm(initForm) }}
                className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[10px] text-[13px] font-semibold transition-colors">
                Cancelar
              </button>
              <button onClick={() => mutation.mutate()} disabled={!form.nombre || mutation.isPending}
                className="flex-1 h-10 bg-sky-500 hover:bg-sky-600 text-white rounded-[10px] text-[13px] font-semibold transition-colors disabled:opacity-40 shadow-[0_4px_12px_-4px_rgba(14,165,233,0.45)]">
                {mutation.isPending ? 'Guardando...' : 'Crear cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
