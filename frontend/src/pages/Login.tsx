import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../services/api'
import {
  Eye,
  EyeOff,
  CheckCircle2,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react'

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
  const [focused, setFocused] = useState<'email' | 'password' | null>(null)
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
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <style>{`
        @keyframes floatBox1 { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-14px) rotate(2deg)} }
        @keyframes floatBox2 { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(12px) rotate(-2deg)} }
        @keyframes fadeSlide  { from{opacity:0; transform:translateY(8px)} to{opacity:1; transform:translateY(0)} }
        @keyframes errorShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        .box-float-1 { animation: floatBox1 9s ease-in-out infinite; transform-origin: center; }
        .box-float-2 { animation: floatBox2 11s ease-in-out infinite; transform-origin: center; }
        .fade-slide-in { animation: fadeSlide 0.6s both ease-out; }
        .error-shake   { animation: errorShake 0.35s ease-in-out; }
      `}</style>

      {/* ==================== LEFT PANEL ==================== */}
      <div className="relative md:w-5/12 md:min-h-screen min-h-[520px] overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, #0a1628 0%, #0f172a 40%, #0c2952 75%, #0a1628 100%)',
          }}
        />

        {/* Fine grid */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.08]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="cotexa-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#7dd3fc" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cotexa-grid)" />
        </svg>

        {/* Isometric packaging box — top right */}
        <svg
          className="absolute"
          style={{ right: '-60px', top: '8%', width: 420, height: 420, opacity: 0.22 }}
          viewBox="0 0 200 200"
        >
          <g transform="translate(100 100)">
            <g className="box-float-1">
              <polygon
                points="0,-40 50,-15 50,45 0,70 -50,45 -50,-15"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="1.2"
              />
              <line x1="0" y1="-40" x2="0" y2="70" stroke="#0ea5e9" strokeWidth="0.8" opacity="0.7" />
              <line x1="-50" y1="-15" x2="50" y2="-15" stroke="#0ea5e9" strokeWidth="0.8" opacity="0.7" />
            </g>
          </g>
        </svg>

        {/* Isometric packaging box — bottom left */}
        <svg
          className="absolute"
          style={{ left: '-40px', bottom: '18%', width: 300, height: 300, opacity: 0.18 }}
          viewBox="0 0 200 200"
        >
          <g transform="translate(100 100)">
            <g className="box-float-2">
              <polygon
                points="0,-30 40,-10 40,35 0,55 -40,35 -40,-10"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.2"
              />
              <line x1="0" y1="-30" x2="0" y2="55" stroke="#38bdf8" strokeWidth="0.7" opacity="0.6" />
              <line x1="-40" y1="-10" x2="40" y2="-10" stroke="#38bdf8" strokeWidth="0.7" opacity="0.6" />
            </g>
          </g>
        </svg>

        {/* Glow blobs */}
        <div
          className="absolute rounded-full"
          style={{
            width: 500,
            height: 500,
            left: '-180px',
            top: '-120px',
            background: 'radial-gradient(circle, rgba(14,165,233,0.25), transparent 65%)',
            filter: 'blur(10px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 460,
            height: 460,
            right: '-160px',
            bottom: '-140px',
            background: 'radial-gradient(circle, rgba(16,185,129,0.14), transparent 65%)',
            filter: 'blur(10px)',
          }}
        />

        {/* Right edge accent */}
        <div
          className="absolute top-0 bottom-0 right-0 w-px"
          style={{
            background:
              'linear-gradient(to bottom, transparent, rgba(14,165,233,0.5), transparent)',
          }}
        />

        {/* Foreground content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-between px-10 pt-4 pb-10 text-center min-h-[520px] md:min-h-screen">
          <div className="h-4 md:h-8" />
          <div className="w-full max-w-xl mx-auto flex flex-col items-center">
            <img
              src="/Imagenes/logo-cotexa-final.png"
              alt="Cotexa"
              className="w-[560px] md:w-[720px] max-w-[110%] h-auto -mt-10 md:-mt-16 -mb-14 md:-mb-20 -ml-10 md:-ml-16 drop-shadow-[0_10px_40px_rgba(14,165,233,0.45)]"
            />

            <h2 className="text-white text-2xl md:text-[30px] font-semibold leading-[1.15] mb-3 tracking-tight">
              De cotización a pedido,
              <br />
              <span
                style={{
                  background: 'linear-gradient(90deg,#7dd3fc 0%, #ffffff 60%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                sin fricción.
              </span>
            </h2>
            <p className="text-sky-300/85 text-sm mb-9">
              Gestión integral para tu negocio de packaging
            </p>

            <div className="w-full space-y-3 text-left">
              {FEATURES.map((f, i) => (
                <div
                  key={f}
                  className="fade-slide-in flex items-center gap-3 px-3 py-2 rounded-lg border border-white/5 bg-white/[0.03] backdrop-blur-[2px] hover:bg-white/[0.06] transition-all"
                  style={{ animationDelay: `${0.1 + i * 0.08}s` }}
                >
                  <span
                    className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
                    style={{
                      background: 'rgba(16,185,129,0.15)',
                      boxShadow: '0 0 0 1px rgba(16,185,129,0.35)',
                    }}
                  >
                    <CheckCircle2 size={11} className="text-emerald-400" strokeWidth={3} />
                  </span>
                  <span className="text-white/85 text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1" />
          <p className="text-white/30 text-[11px] mt-6">
            © 2026 Cotexa. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* ==================== RIGHT PANEL ==================== */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(15,23,42,0.05) 1px, transparent 0)',
            backgroundSize: '22px 22px',
            maskImage:
              'radial-gradient(ellipse at center, black 40%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at center, black 40%, transparent 75%)',
          }}
        />

        <div className="relative w-full max-w-[400px]">
          {/* Glow behind card */}
          <div
            className="absolute -inset-[1px] rounded-[20px] opacity-60"
            style={{
              background:
                'linear-gradient(135deg, rgba(14,165,233,0.35), rgba(16,185,129,0.25), transparent 60%)',
              filter: 'blur(14px)',
            }}
          />

          <div
            className="relative bg-white rounded-[18px] border border-gray-200/80 p-8 md:p-9"
            style={{
              boxShadow:
                '0 20px 50px -20px rgba(15,23,42,0.25), 0 8px 16px -8px rgba(15,23,42,0.12)',
            }}
          >
            {/* Top accent bar */}
            <div
              className="absolute top-0 left-8 right-8 h-[3px] rounded-b-full"
              style={{
                background: 'linear-gradient(90deg, #0f172a, #0ea5e9 60%, #10b981)',
              }}
            />

            <div className="mb-7">
              <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">
                Iniciar sesión
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Ingresá con tu cuenta de Cotexa
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50/80 border border-red-100 text-red-700 text-[13px] rounded-lg px-3 py-2.5 mb-4 error-shake">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Email
                </label>
                <div
                  className={`relative rounded-lg transition-all ${
                    focused === 'email' ? 'ring-2 ring-sky-500/30' : ''
                  }`}
                >
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    required
                    placeholder="tu@empresa.com"
                    className="w-full h-11 pl-9 pr-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Contraseña
                  </label>
                </div>
                <div
                  className={`relative rounded-lg transition-all ${
                    focused === 'password' ? 'ring-2 ring-sky-500/30' : ''
                  }`}
                >
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    required
                    placeholder="••••••••"
                    className="w-full h-11 pl-9 pr-10 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full h-11 rounded-lg text-sm font-semibold text-white mt-2 overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  background:
                    'linear-gradient(135deg, #0f172a 0%, #1e3a5f 35%, #0284c7 80%, #0ea5e9 100%)',
                  boxShadow:
                    '0 8px 20px -8px rgba(14,165,233,0.55), inset 0 1px 0 rgba(255,255,255,0.15)',
                }}
              >
                {/* Shine sweep */}
                <span
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms] ease-out"
                  style={{
                    background:
                      'linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
                  }}
                />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Ingresando...
                    </>
                  ) : (
                    <>
                      Ingresar
                      <ArrowRight
                        size={14}
                        strokeWidth={2.5}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
