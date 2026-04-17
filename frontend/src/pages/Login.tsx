import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../services/api'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'

const FEATURES = [
  'Cotizaciones en tiempo real',
  'Seguimiento de pedidos',
  'Control total del negocio',
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="min-h-screen flex flex-col md:flex-row">
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .login-bg {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #0c2952 70%, #0f172a 100%);
          background-size: 300% 300%;
          animation: gradientShift 10s ease infinite;
        }
      `}</style>

      {/* Left panel */}
      <div className="login-bg md:w-5/12 flex flex-col items-center justify-between p-10 md:min-h-screen">
        <div className="w-full flex flex-col items-center text-center max-w-xs mx-auto mt-4 md:mt-16">
          <img src="/Imagenes/Copia de Logo fondo azul.png" alt="Cotexa"
            className="h-16 md:h-20 w-auto mb-8 md:mb-12" />
          <p className="text-white text-xl md:text-2xl font-semibold leading-snug mb-3">
            De cotización a pedido,<br />sin fricción.
          </p>
          <p className="text-sky-300/80 text-sm mb-8 md:mb-10">
            Gestión integral para tu negocio de packaging
          </p>
          <div className="space-y-3.5 text-left w-full">
            {FEATURES.map(f => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span className="text-white/75 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/25 text-xs text-center mt-10 md:mt-0 pb-2">
          © 2026 Cotexa. Todos los derechos reservados.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full max-w-sm p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Iniciar sesión</h1>
          <p className="text-sm text-gray-400 mb-6">Ingresá con tu cuenta de Cotexa</p>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-3 py-2.5 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@empresa.com"
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full h-11 px-3 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg text-sm font-semibold text-white mt-2 transition-all disabled:opacity-50 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #0ea5e9)' }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
