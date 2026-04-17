import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../services/api'
import { Boxes } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('admin@cotexa.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login(email, password)
      login(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch {
      setError('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full max-w-sm p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="bg-sky-500 rounded-lg p-2">
            <Boxes size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Cotexa</span>
        </div>

        <h1 className="text-lg font-semibold text-gray-900 mb-1">Iniciar sesión</h1>
        <p className="text-sm text-gray-400 mb-6">Ingresá con tu cuenta</p>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-3 py-2.5 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 mt-2">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
