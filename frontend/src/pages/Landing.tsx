import React, { useState, useEffect } from 'react'
import './Landing.css'

// ── Icons ─────────────────────────────────────────────────────────────────────

interface IconProps {
  size?: number
  stroke?: number
  className?: string
}

const Icon = ({
  children,
  className = '',
  size = 24,
  stroke = 1.75,
}: IconProps & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
)

const IconChat        = (p: IconProps) => <Icon {...p}><path d="M21 12a8 8 0 1 1-3.1-6.3L21 5l-.8 3.1A8 8 0 0 1 21 12Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/></Icon>
const IconSpreadsheet = (p: IconProps) => <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></Icon>
const IconQuestion    = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.8-2.5 2-2.5 3.5"/><path d="M12 17h.01"/></Icon>
const IconCalc        = (p: IconProps) => <Icon {...p}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/></Icon>
const IconBox         = (p: IconProps) => <Icon {...p}><path d="M21 8 12 3 3 8l9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="m12 13 0 8"/></Icon>
const IconUsers       = (p: IconProps) => <Icon {...p}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M17.5 20a6.5 6.5 0 0 0-1.9-4.6"/></Icon>
const IconBell        = (p: IconProps) => <Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/></Icon>
const IconCheck       = (p: IconProps) => <Icon {...p}><path d="m5 12 5 5L20 7"/></Icon>
const IconArrow       = (p: IconProps) => <Icon {...p}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></Icon>
const IconBuilding    = (p: IconProps) => <Icon {...p}><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M10 21v-4h4v4"/></Icon>
const IconShield      = (p: IconProps) => <Icon {...p}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></Icon>
const IconSliders     = (p: IconProps) => <Icon {...p}><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="white"/><circle cx="16" cy="12" r="2" fill="white"/><circle cx="10" cy="18" r="2" fill="white"/></Icon>
const IconMail        = (p: IconProps) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></Icon>
const IconSparkle     = (p: IconProps) => <Icon {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></Icon>
const IconQuote       = (p: IconProps) => <Icon {...p}><path d="M7 7h4v4H7zM7 11c0 3 1 5 4 6"/><path d="M15 7h4v4h-4zM15 11c0 3 1 5 4 6"/></Icon>
const IconPlay        = (p: IconProps) => <Icon {...p}><path d="M7 5v14l12-7L7 5Z"/></Icon>
const IconMenu        = (p: IconProps) => <Icon {...p}><path d="M4 7h16M4 12h16M4 17h16"/></Icon>
const IconX           = (p: IconProps) => <Icon {...p}><path d="M6 6l12 12M6 18 18 6"/></Icon>
const IconInstagram   = (p: IconProps) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor"/></Icon>
const IconLinkedin    = (p: IconProps) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/></Icon>
const IconTwitter     = (p: IconProps) => <Icon {...p}><path d="M4 4l7 9-7 7h3l5.5-5.5L17 20h4l-7.5-9.5L20 4h-3l-5 5L8 4H4Z"/></Icon>

// ── Logo ──────────────────────────────────────────────────────────────────────

function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/Imagenes/isotipo.png"
      alt="Cotexa"
      style={{ height: `${size}px`, width: `${size}px`, objectFit: 'contain', display: 'block' }}
    />
  )
}

// ── Dashboard Mockup ──────────────────────────────────────────────────────────

function DashboardMockup() {
  const orders = [
    { id: '#8', initials: 'MA', color: '#f59e0b', client: 'Mateo Ambroggio',         status: 'Confirmado',    tone: 'emerald', total: '$51.688.000', date: '6/5/2026'  },
    { id: '#7', initials: 'MA', color: '#f59e0b', client: 'Mateo Ambroggio',         status: 'En producción', tone: 'violet',  total: '$200.000',    date: '30/4/2026' },
    { id: '#6', initials: 'MA', color: '#f59e0b', client: 'Mateo Ambroggio',         status: 'Listo',         tone: 'teal',    total: '$97.200.000', date: '30/4/2026' },
    { id: '#5', initials: 'WW', color: '#0ea5e9', client: 'WhatsApp +5491131646098', status: 'Cotización',    tone: 'slate',   total: '$8.580.000',  date: '29/4/2026' },
    { id: '#4', initials: 'LV', color: '#a78bfa', client: 'Laura Vidal',             status: 'Confirmado',    tone: 'emerald', total: '$3.420.000',  date: '28/4/2026' },
  ]

  const toneMap: Record<string, string> = {
    emerald: 'bg-emerald-50  text-emerald-600  ring-emerald-200',
    violet:  'bg-violet-50   text-violet-600   ring-violet-200',
    teal:    'bg-teal-50     text-teal-600     ring-teal-200',
    slate:   'bg-slate-100   text-slate-600    ring-slate-200',
  }

  const statusIcons: Record<string, React.ReactNode> = {
    emerald: <IconCheck size={12} />,
    violet:  <IconBox   size={12} />,
    teal:    <IconCheck size={12} />,
    slate:   <IconSpreadsheet size={12} />,
  }

  const kpis = [
    {
      label: 'TOTAL PEDIDOS', value: '8', badge: null,
      icon: <IconBox size={16} />, iconBg: 'bg-sky-100 text-sky-600',
      spark: { color: '#0ea5e9', d: 'M0 40 L20 38 L40 32 L60 36 L80 28 L100 30 L120 22 L140 10 L160 6 L180 2', fill: 'url(#sparkBlue)' },
    },
    {
      label: 'EN PROCESO', value: '4', badge: null,
      icon: <IconBell size={16} />, iconBg: 'bg-amber-100 text-amber-600',
      spark: { color: '#f59e0b', d: 'M0 28 L20 22 L40 30 L60 24 L80 30 L100 22 L120 26 L140 24 L160 22 L180 22', fill: 'url(#sparkAmber)' },
    },
    {
      label: 'CLIENTES', value: '4', badge: null,
      icon: <IconUsers size={16} />, iconBg: 'bg-violet-100 text-violet-600',
      spark: { color: '#a78bfa', d: 'M0 36 L40 36 L80 30 L120 24 L160 18 L180 18', fill: 'url(#sparkViolet)' },
    },
    {
      label: 'FACTURACIÓN DEL MES', value: '$51.688.000', badge: '↓ 95.5%',
      icon: <IconSparkle size={16} />, iconBg: 'bg-emerald-100 text-emerald-600',
      spark: { color: '#10b981', d: 'M0 32 L30 30 L60 28 L90 24 L120 20 L150 18 L180 12', fill: 'url(#sparkEmerald)' },
    },
  ]

  return (
    <div className="w-full rounded-2xl overflow-hidden ring-1 ring-slate-200 shadow-[0_40px_80px_-20px_rgba(2,6,23,0.4)] bg-slate-50">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 border-b border-slate-200">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400"></span>
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
        <div className="ml-3 text-[11px] font-mono text-slate-500">app.cotexa.io/dashboard</div>
      </div>

      <div className="grid grid-cols-[200px_1fr] min-h-[600px]">
        {/* Sidebar */}
        <aside className="bg-[#0a1226] text-white flex flex-col">
          <div className="px-4 py-5 border-b border-white/5">
            <img src="/Imagenes/logo-cotexa-final.png" alt="Cotexa" style={{ height: 300 }} />
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
            {[
              { label: 'Dashboard',     active: true,  Ico: IconSpreadsheet },
              { label: 'Pedidos',       active: false, Ico: IconBox },
              { label: 'Clientes',      active: false, Ico: IconUsers },
              { label: 'Configuración', active: false, Ico: IconSliders },
              { label: 'Cotizador',     active: false, Ico: IconCalc },
            ].map(({ label, active, Ico }) => (
              <div
                key={label}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${
                  active
                    ? 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Ico size={16} /> {label}
              </div>
            ))}
          </nav>
          <div className="px-3 pb-4 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-400">
              <IconArrow size={16} /> Cerrar sesión
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex flex-col bg-white">
          <div className="flex items-center gap-4 px-6 py-3.5 border-b border-slate-200 bg-[#0a1226] text-white">
            <div className="flex-1 max-w-md">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] ring-1 ring-white/10 text-slate-400 text-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
                </svg>
                <span>Buscar pedidos, clientes…</span>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="relative">
                <IconBell size={18} className="text-slate-300" />
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-rose-500 text-[10px] flex items-center justify-center font-semibold">5</span>
              </div>
              <div className="text-right leading-tight">
                <div className="text-xs font-medium">Demo Usuario</div>
                <div className="text-[10px] text-slate-400 font-mono">ejemplodemo@cotexa.com</div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 bg-slate-50">
            <div className="text-[10px] font-semibold tracking-[0.18em] text-sky-500">MARTES, 19 DE MAYO DE 2026</div>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">Dashboard</h3>
            <p className="text-xs text-slate-500">Resumen de tu operación</p>

            <div className="mt-5 grid grid-cols-4 gap-3">
              {kpis.map((k) => (
                <div key={k.label} className="rounded-xl bg-white ring-1 ring-slate-200/80 p-3.5 relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className="text-[9px] font-semibold tracking-wider text-slate-400">{k.label}</div>
                    <div className={`h-6 w-6 rounded-md flex items-center justify-center ${k.iconBg}`}>{k.icon}</div>
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <div className="text-lg font-bold text-slate-900 truncate">{k.value}</div>
                    {k.badge && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-rose-50 text-rose-600">{k.badge}</span>
                    )}
                  </div>
                  <svg viewBox="0 0 180 48" className="mt-1 w-full h-8" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="sparkBlue"    x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4"/><stop offset="100%" stopColor="#0ea5e9" stopOpacity="0"/></linearGradient>
                      <linearGradient id="sparkAmber"   x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4"/><stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/></linearGradient>
                      <linearGradient id="sparkViolet"  x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4"/><stop offset="100%" stopColor="#a78bfa" stopOpacity="0"/></linearGradient>
                      <linearGradient id="sparkEmerald" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.4"/><stop offset="100%" stopColor="#10b981" stopOpacity="0"/></linearGradient>
                    </defs>
                    <path d={`${k.spark.d} L180 48 L0 48 Z`} fill={k.spark.fill} />
                    <path d={k.spark.d} fill="none" stroke={k.spark.color} strokeWidth="1.5" />
                  </svg>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-[1.7fr_1fr] gap-3">
              <div className="rounded-xl bg-white ring-1 ring-slate-200/80 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">Últimos pedidos</h4>
                  <div className="text-[10px] text-slate-400 font-mono">6 recientes</div>
                </div>
                <div className="mt-3 grid grid-cols-[40px_1fr_120px_100px_70px] gap-2 text-[9px] font-semibold tracking-wider text-slate-400 pb-2 border-b border-slate-100">
                  <div>#</div><div>CLIENTE</div><div>ESTADO</div><div>TOTAL</div><div>FECHA</div>
                </div>
                {orders.map((o, i) => (
                  <div key={i} className="grid grid-cols-[40px_1fr_120px_100px_70px] gap-2 items-center py-2 text-[11px] border-b border-slate-50 last:border-0">
                    <div className="font-mono text-slate-400">{o.id}</div>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-semibold text-white shrink-0" style={{ background: o.color }}>{o.initials}</div>
                      <span className="text-slate-800 truncate">{o.client}</span>
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ring-1 ${toneMap[o.tone]}`}>
                        {statusIcons[o.tone]} {o.status}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900">{o.total}</div>
                    <div className="font-mono text-slate-400">{o.date}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-white ring-1 ring-slate-200/80 p-4">
                <h4 className="text-sm font-semibold text-slate-900">Por estado</h4>
                <div className="mt-3 flex items-center justify-center">
                  <svg width="120" height="120" viewBox="0 0 42 42">
                    <circle cx="21" cy="21" r="15.9" fill="none" stroke="#a78bfa" strokeWidth="6" strokeDasharray="33 67" strokeDashoffset="25" transform="rotate(-90 21 21)" />
                    <circle cx="21" cy="21" r="15.9" fill="none" stroke="#14b8a6" strokeWidth="6" strokeDasharray="50 50" strokeDashoffset="-8" transform="rotate(-90 21 21)" />
                    <circle cx="21" cy="21" r="15.9" fill="none" stroke="#94a3b8" strokeWidth="6" strokeDasharray="17 83" strokeDashoffset="-58" transform="rotate(-90 21 21)" />
                  </svg>
                </div>
                <div className="mt-3 space-y-1.5 text-[11px]">
                  {[
                    ['#a78bfa', 'En producción', '2'],
                    ['#14b8a6', 'Listo',          '3'],
                    ['#94a3b8', 'Cotización',     '1'],
                    ['#10b981', 'Confirmado',     '2'],
                  ].map(([c, l, n]) => (
                    <div key={l} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: c }}></span>
                      <span className="text-slate-700 flex-1">{l}</span>
                      <span className="font-semibold text-slate-500">{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Navbar ────────────────────────────────────────────────────────────────────

function Navbar() {
  const [open, setOpen] = useState(false)

  const links: [string, string][] = [
    ['Producto',       '#producto'],
    ['Cómo funciona',  '#como-funciona'],
    ['Contacto',       '#contacto'],
  ]

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto pl-2 md:pl-4 pr-5 md:pr-8 h-28 md:h-32 flex items-center justify-between gap-10">
        <a href="#top" className="shrink-0">
          <img src="/Imagenes/logo-cotexa-final.png" alt="Cotexa" style={{ height: 250, width: "auto" }} />
        </a>
        <nav className="hidden md:flex items-center gap-10 text-sm text-slate-300 ml-auto mr-6">
          {links.map(([label, href]) => (
            <a key={label} href={href} className="hover:text-white transition whitespace-nowrap">{label}</a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-5">
          <a href="/login" className="text-sm text-slate-300 hover:text-white transition whitespace-nowrap">Iniciar sesión</a>
          <a href="#contacto" className="btn-primary text-sm px-5 py-2.5 rounded-lg whitespace-nowrap">Solicitar demo</a>
        </div>
        <button className="md:hidden text-white" onClick={() => setOpen(!open)} aria-label="menu">
          {open ? <IconX /> : <IconMenu />}
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-navy-900 border-t border-white/10 px-5 py-4 space-y-3">
          {links.map(([label, href]) => (
            <a key={label} href={href} onClick={() => setOpen(false)} className="block text-slate-200 py-1">{label}</a>
          ))}
          <a href="/login" className="block text-slate-200 py-1">Iniciar sesión</a>
          <a href="#contacto" className="btn-primary text-sm px-4 py-2 rounded-lg inline-block">Solicitar demo</a>
        </div>
      )}
    </header>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section id="top" className="relative hero-bg noise overflow-hidden pt-40 md:pt-48 pb-24">
      <div className="orb bg-sky-500"     style={{ width: 420, height: 420, top: '5%',    left: '-6%',  animation: 'landing-float 9s ease-in-out infinite' }}></div>
      <div className="orb bg-emerald-500" style={{ width: 360, height: 360, bottom: '10%', right: '-6%', opacity: .35, animation: 'landing-float 11s ease-in-out infinite reverse' }}></div>

      <div className="absolute inset-0 grid-bg opacity-60"></div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#0f172a]"></div>

      <div className="relative max-w-6xl w-full mx-auto px-5 md:px-8 text-center">
        <div data-reveal="" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 font-medium">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
          </span>
          Beta abierta · Para equipos comerciales
        </div>

        <h1 data-reveal="" data-delay="1" className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-[4.6rem] leading-[1.04] font-semibold tracking-tight text-white">
          De cotización a pedido,<br />
          <span className="bg-gradient-to-r from-sky-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">sin fricción.</span>
        </h1>

        <p data-reveal="" data-delay="2" className="mt-6 text-lg text-slate-300/90 max-w-2xl mx-auto leading-relaxed">
          Cotexa ordena, conecta y acelera el flujo comercial de tu empresa — desde la primera cotización hasta el pedido final.
        </p>

        <div data-reveal="" data-delay="3" className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
          <a href="#contacto" className="btn-primary px-6 py-3.5 rounded-xl inline-flex items-center justify-center gap-2">
            Solicitar demo <IconArrow size={18} />
          </a>
          <a href="#como-funciona" className="btn-ghost px-6 py-3.5 rounded-xl inline-flex items-center justify-center gap-2">
            <IconPlay size={16} /> Ver cómo funciona
          </a>
        </div>

        <div data-reveal="" data-delay="4" className="mt-8 flex flex-wrap gap-x-8 gap-y-3 justify-center text-xs text-slate-400">
          <div className="flex items-center gap-2"><IconCheck size={14} className="text-emerald-400" /> Sin tarjeta de crédito</div>
          <div className="flex items-center gap-2"><IconCheck size={14} className="text-emerald-400" /> Setup en 48 hs</div>
          <div className="flex items-center gap-2"><IconCheck size={14} className="text-emerald-400" /> Soporte dedicado</div>
        </div>

        <div data-reveal="" data-delay="3" className="mt-16 md:mt-20 relative">
          <DashboardMockup />
        </div>
      </div>

      <a href="#producto" className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 hover:text-slate-300 transition">
        <span className="text-[10px] uppercase tracking-widest font-mono">scroll</span>
        <span className="h-8 w-[1px] bg-gradient-to-b from-slate-500/0 via-slate-400 to-slate-500/0"></span>
      </a>
    </section>
  )
}

// ── Problem ───────────────────────────────────────────────────────────────────

function Problem() {
  const items = [
    {
      Icon: IconChat,
      title: 'Cotizaciones por WhatsApp y mail que se pierden',
      body: 'Mensajes dispersos, archivos adjuntos que nadie encuentra, clientes esperando respuesta.',
    },
    {
      Icon: IconSpreadsheet,
      title: 'Pedidos en Excel que nadie actualiza',
      body: 'Planillas desactualizadas, versiones duplicadas y un estado real que solo conoce una persona.',
    },
    {
      Icon: IconQuestion,
      title: 'Clientes que preguntan el estado y no sabés qué responder',
      body: 'Llamadas interminables para rastrear un pedido que debería estar a un clic de distancia.',
    },
  ]

  return (
    <section id="producto" className="relative py-28 bg-navy-900 text-white overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40"></div>
      <div className="relative max-w-7xl mx-auto px-5 md:px-8">
        <div className="max-w-2xl">
          <div data-reveal="" className="text-xs uppercase tracking-[0.2em] font-mono text-sky-400">El problema</div>
          <h2 data-reveal="" data-delay="1" className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight">¿Te suena familiar?</h2>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {items.map(({ Icon: Ico, title, body }, i) => (
            <div
              key={i}
              data-reveal=""
              data-delay={`${i + 1}`}
              className="group tilt relative rounded-2xl bg-white/[0.03] ring-1 ring-white/10 p-7 hover:ring-white/20"
            >
              <div className="absolute top-6 right-6 text-[11px] font-mono text-slate-600">0{i + 1}</div>
              <div className="h-12 w-12 rounded-xl bg-rose-500/10 ring-1 ring-rose-500/30 flex items-center justify-center text-rose-300 group-hover:scale-110 transition">
                <Ico size={22} />
              </div>
              <h3 className="mt-6 text-xl font-semibold leading-snug">{title}</h3>
              <p className="mt-3 text-slate-400 leading-relaxed text-[15px]">{body}</p>
            </div>
          ))}
        </div>

        <div data-reveal="" data-delay="4" className="mt-16 flex items-center justify-center gap-3 text-slate-400">
          <span className="h-[1px] w-10 bg-slate-700"></span>
          <span className="text-sm">Existe una mejor manera.</span>
          <IconArrow size={18} className="text-sky-400" />
        </div>
      </div>
    </section>
  )
}

// ── Solution ──────────────────────────────────────────────────────────────────

function Solution() {
  const feats = [
    { Icon: IconCalc,  title: 'Cotizador en tiempo real',    body: 'Generá cotizaciones precisas al instante con campos configurables por producto, material y cliente.', tag: 'Cotizador'  },
    { Icon: IconBox,   title: 'Gestión de pedidos',          body: 'Seguí cada pedido desde la cotización hasta la entrega, con estados claros para todo el equipo.',       tag: 'Pedidos'    },
    { Icon: IconUsers, title: 'Historial de clientes',       body: 'Todos tus clientes y su historial en un solo lugar: precios acordados, pedidos pasados y notas.',        tag: 'CRM'        },
    { Icon: IconBell,  title: 'Notificaciones automáticas',  body: 'Tu equipo y tus clientes siempre informados de cada cambio de estado, sin mover un dedo.',              tag: 'Automations' },
  ]

  return (
    <section className="relative py-28 bg-slate-50 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
      <div className="relative max-w-7xl mx-auto px-5 md:px-8">
        <div className="max-w-3xl">
          <div data-reveal="" className="text-xs uppercase tracking-[0.2em] font-mono text-sky-600">La solución</div>
          <h2 data-reveal="" data-delay="1" className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-navy-900">
            Una plataforma que conecta todo tu proceso comercial.
          </h2>
          <p data-reveal="" data-delay="2" className="mt-5 text-lg text-slate-600 leading-relaxed">
            Cuatro módulos pensados para una sola cosa: que nada se pierda entre la primera consulta y la entrega final.
          </p>
        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-5">
          {feats.map(({ Icon: Ico, title, body, tag }, i) => (
            <div
              key={i}
              data-reveal=""
              data-delay={`${(i % 2) + 1}`}
              className="tilt group relative rounded-2xl bg-white ring-1 ring-slate-200 p-7 overflow-hidden"
            >
              <div className="absolute top-0 left-0 h-[3px] w-14 bg-gradient-to-r from-sky-500 to-emerald-500 opacity-0 group-hover:opacity-100 group-hover:w-24 transition-all duration-500"></div>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 group-hover:shadow-sky-500/40 transition">
                  <Ico size={22} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-navy-900">{title}</h3>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{tag}</span>
                  </div>
                  <p className="mt-2.5 text-slate-600 leading-relaxed text-[15px]">{body}</p>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-slate-50 ring-1 ring-slate-200/70 p-3">
                {i === 0 && (
                  <div className="flex items-center justify-between text-[12px]">
                    <div className="font-mono text-slate-500">Caja corrugada · 24×18×10</div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white ring-1 ring-slate-200 text-slate-700">500 u</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-medium">$ 128.400</span>
                    </div>
                  </div>
                )}
                {i === 1 && (
                  <div className="flex items-center gap-1.5">
                    {['Cotización', 'Aprobada', 'Producción', 'Entregada'].map((s, j) => (
                      <React.Fragment key={s}>
                        <div className={`px-2 py-1 rounded text-[11px] ${j <= 1 ? 'bg-emerald-500 text-white' : 'bg-white ring-1 ring-slate-200 text-slate-500'}`}>{s}</div>
                        {j < 3 && <div className={`flex-1 h-[2px] ${j < 1 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>}
                      </React.Fragment>
                    ))}
                  </div>
                )}
                {i === 2 && (
                  <div className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-sky-400 to-emerald-400"></div>
                      <div>
                        <div className="font-medium text-navy-900">Laboratorios Andina</div>
                        <div className="font-mono text-[10px] text-slate-500">42 pedidos · $ 1.2M</div>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-emerald-600">activo</div>
                  </div>
                )}
                {i === 3 && (
                  <div className="space-y-1.5">
                    {[
                      ['Pedido aprobado',    'producción'],
                      ['Entrega programada', 'cliente'],
                    ].map(([a, b]) => (
                      <div key={a} className="flex items-center gap-2 text-[11.5px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
                        <span className="text-slate-700">{a}</span>
                        <span className="ml-auto font-mono text-slate-400">→ {b}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── How It Works ──────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { n: '01', title: 'El cliente consulta',   body: 'Por WhatsApp, mail o directo desde el portal. Toda consulta entra al mismo lugar.' },
    { n: '02', title: 'Generás la cotización', body: 'En segundos, con precio automático según producto, volumen y cliente.' },
    { n: '03', title: 'El cliente acepta',     body: 'Recibe la cotización por mail, la aprueba online y queda registrada.' },
    { n: '04', title: 'El pedido fluye',       body: 'Producción recibe la orden automáticamente y el estado se actualiza en vivo.' },
  ]

  return (
    <section id="como-funciona" className="relative py-28 bg-navy-900 text-white overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40"></div>
      <div className="orb bg-sky-500" style={{ width: 500, height: 500, top: '20%', right: '-10%', opacity: .15 }}></div>

      <div className="relative max-w-7xl mx-auto px-5 md:px-8">
        <div className="max-w-2xl">
          <div data-reveal="" className="text-xs uppercase tracking-[0.2em] font-mono text-sky-400">Flujo</div>
          <h2 data-reveal="" data-delay="1" className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight">Así funciona Cotexa.</h2>
          <p data-reveal="" data-delay="2" className="mt-5 text-lg text-slate-300/90">Cuatro pasos que antes tomaban días. Ahora, minutos.</p>
        </div>

        <div className="mt-16 relative">
          <div className="hidden lg:block absolute top-[3.25rem] left-8 right-8 h-[2px] step-line opacity-50"></div>
          <div className="grid lg:grid-cols-4 gap-6 relative">
            {steps.map((s, i) => (
              <div key={s.n} data-reveal="" data-delay={`${i + 1}`} className="relative">
                <div className="relative z-10 h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center font-mono font-semibold text-lg shadow-lg shadow-sky-500/30">
                  {s.n}
                  <span className="absolute inset-0 rounded-2xl ring-2 ring-sky-400 animate-pulse-ring"></span>
                </div>
                <h3 className="mt-6 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-slate-400 text-[15px] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Scale ─────────────────────────────────────────────────────────────────────

function Scale() {
  const props = [
    { Icon: IconBuilding, title: 'Multi-empresa',    body: 'Cada cliente tiene sus propios datos completamente separados. Datos, usuarios y configuración aislados.' },
    { Icon: IconShield,   title: 'Roles y permisos', body: 'Admin, producción y superadmin con accesos diferenciados. Controlá quién ve y hace qué.' },
    { Icon: IconSliders,  title: 'Configurable',     body: 'Adaptá los campos del cotizador a tu negocio: materiales, dimensiones, descuentos, reglas.' },
  ]

  return (
    <section className="relative py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="max-w-2xl">
          <div data-reveal="" className="text-xs uppercase tracking-[0.2em] font-mono text-sky-600">Escalabilidad</div>
          <h2 data-reveal="" data-delay="1" className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-navy-900">Diseñado para crecer con vos.</h2>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {props.map(({ Icon: Ico, title, body }, i) => (
            <div key={i} data-reveal="" data-delay={`${i + 1}`} className="tilt rounded-2xl bg-white ring-1 ring-slate-200 p-7">
              <div className="h-11 w-11 rounded-xl bg-navy-900 text-white flex items-center justify-center">
                <Ico size={20} />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-navy-900">{title}</h3>
              <p className="mt-2 text-slate-600 text-[15px] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Social Proof ──────────────────────────────────────────────────────────────

function SocialProof() {
  const stats = [
    { v: '50+',  l: 'pedidos gestionados en beta' },
    { v: '3',    l: 'roles de usuario integrados'  },
    { v: '100%', l: 'configurable a tu negocio'    },
  ]

  return (
    <section className="relative py-28 bg-white">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <div data-reveal="" className="text-xs uppercase tracking-[0.2em] font-mono text-sky-600">Confianza</div>
          <h2 data-reveal="" data-delay="1" className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-navy-900">
            Construido para equipos que cotizan todos los días.
          </h2>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-0 rounded-2xl ring-1 ring-slate-200 overflow-hidden">
          {stats.map((s, i) => (
            <div
              key={i}
              data-reveal=""
              data-delay={`${i + 1}`}
              className={`p-10 text-center ${i < 2 ? 'md:border-r border-slate-200' : ''}`}
            >
              <div className="text-5xl md:text-6xl font-semibold tracking-tight bg-gradient-to-b from-navy-900 to-slate-700 bg-clip-text text-transparent">{s.v}</div>
              <div className="mt-2 text-slate-500 text-sm">{s.l}</div>
            </div>
          ))}
        </div>

        <div data-reveal="" data-delay="2" className="mt-14 max-w-3xl mx-auto rounded-2xl bg-gradient-to-br from-navy-900 to-navy-800 text-white p-10 md:p-12 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 text-sky-500/20">
            <IconQuote size={160} />
          </div>
          <div className="relative">
            <p className="text-xl md:text-2xl font-medium leading-snug text-slate-100">
              "Pasamos de perder cotizaciones en mails a tener un panel donde vemos el estado de cada pedido en vivo. Nuestro equipo comercial ahorra muchas horas por semana."
            </p>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center text-navy-900 font-semibold">PP</div>
              <div>
                <div className="font-medium">PrintPack</div>
                <div className="text-sm text-slate-400 font-mono">cliente beta</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Pricing ───────────────────────────────────────────────────────────────────

function Pricing() {
  const plans = [
    {
      name: 'Free',       price: '$0',         cadence: 'para empezar',
      features: ['Hasta 20 pedidos / mes', '1 usuario', 'Cotizador básico', 'Historial de clientes', 'Soporte por mail'],
      cta: 'Crear cuenta',    highlight: false,
    },
    {
      name: 'Pro',        price: '$49',        cadence: 'por mes',
      features: ['Pedidos ilimitados', 'Hasta 5 usuarios', 'Cotizador configurable', 'Notificaciones automáticas', 'Soporte prioritario'],
      cta: 'Solicitar demo',  highlight: true,
    },
    {
      name: 'Enterprise', price: 'A consultar', cadence: '',
      features: ['Multi-empresa', 'Usuarios ilimitados', 'API access', 'Integraciones a medida', 'Onboarding dedicado'],
      cta: 'Contactar ventas', highlight: false,
    },
  ]

  return (
    <section id="precios" className="relative py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <div data-reveal="" className="text-xs uppercase tracking-[0.2em] font-mono text-sky-600">Precios</div>
          <h2 data-reveal="" data-delay="1" className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-navy-900">Planes simples y transparentes.</h2>
          <p data-reveal="" data-delay="2" className="mt-5 text-lg text-slate-600">Empezá gratis. Escalá cuando lo necesites.</p>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-5 items-stretch">
          {plans.map((p, i) => (
            <div
              key={p.name}
              data-reveal=""
              data-delay={`${i + 1}`}
              className={`relative rounded-2xl p-8 flex flex-col transition ${
                p.highlight
                  ? 'bg-navy-900 text-white ring-1 ring-sky-500/40 shadow-2xl shadow-sky-500/10 md:-translate-y-3 md:scale-[1.02]'
                  : 'bg-white ring-1 ring-slate-200 text-navy-900'
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider bg-gradient-to-r from-sky-500 to-emerald-500 text-white whitespace-nowrap">
                  Más elegido
                </div>
              )}
              <div className="text-sm font-medium opacity-70">{p.name}</div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-tight">{p.price}</span>
                {p.cadence && <span className={`text-sm ${p.highlight ? 'text-slate-400' : 'text-slate-500'}`}>{p.cadence}</span>}
              </div>
              <div className={`mt-6 h-px ${p.highlight ? 'bg-white/10' : 'bg-slate-200'}`}></div>
              <ul className="mt-6 space-y-3 flex-1">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-[14.5px]">
                    <IconCheck size={18} className={p.highlight ? 'text-emerald-400 shrink-0 mt-0.5' : 'text-sky-600 shrink-0 mt-0.5'} />
                    <span className={p.highlight ? 'text-slate-200' : 'text-slate-700'}>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#contacto"
                className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl py-3 font-medium transition ${
                  p.highlight
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-navy-900 hover:bg-navy-800 text-white'
                }`}
              >
                {p.cta} <IconArrow size={16} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Final CTA ─────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section id="contacto" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-[#0b1226] to-sky-600"></div>
      <div className="absolute inset-0 grid-bg opacity-30"></div>
      <div className="orb bg-sky-400"     style={{ width: 500, height: 500, top: '-20%',   right: '10%',  opacity: .25 }}></div>
      <div className="orb bg-emerald-500" style={{ width: 380, height: 380, bottom: '-30%', left: '-5%',  opacity: .2  }}></div>

      <div className="relative max-w-4xl mx-auto px-5 md:px-8 text-center text-white">
        <div data-reveal="" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs">
          <IconSparkle size={14} className="text-emerald-300" /> Acceso anticipado
        </div>
        <h2 data-reveal="" data-delay="1" className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
          ¿Listo para ordenar<br />tu proceso comercial?
        </h2>
        <p data-reveal="" data-delay="2" className="mt-6 text-lg md:text-xl text-slate-200/90">
          Empezá hoy. Sin tarjeta de crédito.
        </p>
        <div data-reveal="" data-delay="3" className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <a href="#" className="btn-primary px-7 py-4 rounded-xl inline-flex items-center justify-center gap-2 text-base">
            Solicitar acceso gratuito <IconArrow size={18} />
          </a>
          <a href="/login" className="btn-ghost px-7 py-4 rounded-xl inline-flex items-center justify-center gap-2 text-base">
            Iniciar sesión
          </a>
        </div>
        <div data-reveal="" data-delay="4" className="mt-10 text-sm text-slate-300/80 flex items-center justify-center gap-2">
          <IconMail size={16} /> hola@cotexa.io
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  const cols: [string, string[]][] = [
    ['Producto',  ['Cotizador', 'Pedidos', 'Clientes', 'Notificaciones']],
    ['Compañía',  ['Precios', 'Contacto', 'Acerca de', 'Privacidad']],
    ['Recursos',  ['Documentación', 'Changelog', 'Estado', 'Soporte']],
  ]

  return (
    <footer className="bg-navy-950 text-slate-400 py-14 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-10">
          <div>
            <img src="/Imagenes/logo-cotexa-final.png" alt="Cotexa" style={{ height: 300 }} />
            <p className="mt-5 text-sm max-w-xs leading-relaxed">
              De cotización a pedido, sin fricción. La plataforma comercial para tu equipo.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[IconLinkedin, IconInstagram, IconTwitter].map((I, i) => (
                <a key={i} href="#" className="h-9 w-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] ring-1 ring-white/5 flex items-center justify-center text-slate-400 hover:text-white transition">
                  <I size={16} />
                </a>
              ))}
            </div>
          </div>
          {cols.map(([title, items]) => (
            <div key={title}>
              <div className="text-white font-medium text-sm">{title}</div>
              <ul className="mt-4 space-y-2.5 text-sm">
                {items.map(item => (
                  <li key={item}><a href="#" className="hover:text-white transition">{item}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div>© 2025 Cotexa. Todos los derechos reservados.</div>
          <div className="font-mono text-slate-600">COT · EXA · v1.0</div>
        </div>
      </div>
    </footer>
  )
}

// ── Landing Page ──────────────────────────────────────────────────────────────

export default function Landing() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )

    document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el))

    return () => {
      io.disconnect()
      document.documentElement.style.scrollBehavior = ''
    }
  }, [])

  return (
    <div>
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <SocialProof />
      <FinalCTA />
      <Footer />
    </div>
  )
}

export { LogoMark, Scale, Pricing }
