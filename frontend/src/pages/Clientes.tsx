import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientesApi } from '../services/api'
import { Cliente } from '../types'
import { Plus, X, Users } from 'lucide-react'

const initForm = { nombre: '', email: '', telefono: '', tipo: 'B2C', razonSocial: '', cuit: '', notas: '' }

export default function Clientes() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(initForm)

  const { data: clientes = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: () => clientesApi.getAll().then(r => r.data)
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

  const ic = "w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
  const lc = "block text-xs font-medium text-gray-500 mb-1.5"

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-400">{clientes.length} cliente(s)</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 h-11 rounded-lg text-sm font-medium transition-colors">
          <Plus size={15} />
          Nuevo cliente
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-gray-400">Cargando...</div>
        ) : clientes.length === 0 ? (
          <div className="p-10 text-center">
            <Users size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No hay clientes todavía</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                  {['Nombre', 'Email', 'Teléfono', 'Tipo', 'Pedidos', 'Alta'].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientes.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-gray-900">{c.nombre}</p>
                      {c.razonSocial && <p className="text-xs text-gray-400">{c.razonSocial}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{c.email || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{c.telefono || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.tipo === 'B2B' ? 'bg-violet-50 text-violet-700' : 'bg-amber-50 text-amber-700'
                      }`}>{c.tipo}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{c._count?.pedidos ?? 0}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Nuevo cliente</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                <X size={17} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              {[['B2C', 'Persona'], ['B2B', 'Empresa']].map(([val, label]) => (
                <button key={val} onClick={() => setForm(f => ({ ...f, tipo: val }))}
                  className={`flex-1 h-11 rounded-lg text-sm font-medium transition-colors ${
                    form.tipo === val ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button onClick={() => mutation.mutate()} disabled={!form.nombre || mutation.isPending}
                className="flex-1 h-11 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40">
                {mutation.isPending ? 'Guardando...' : 'Crear cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
