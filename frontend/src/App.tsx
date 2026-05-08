import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import SuperAdminLayout from './components/SuperAdminLayout'
import ProduccionLayout from './components/ProduccionLayout'
import Dashboard from './pages/Dashboard'
import Pedidos from './pages/Pedidos'
import NuevoPedido from './pages/NuevoPedido'
import DetallePedido from './pages/DetallePedido'
import Clientes from './pages/Clientes'
import Configuracion from './pages/Configuracion'
import Cotizador from './pages/Cotizador'
import SuperAdminEmpresas from './pages/superadmin/Empresas'
import SuperAdminUsuarios from './pages/superadmin/Usuarios'
import SuperAdminEmpresaDetalle from './pages/superadmin/EmpresaDetalle'
import Produccion from './pages/Produccion'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

const AdminOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role === 'SUPERADMIN') return <Navigate to="/superadmin/empresas" replace />
  if (user?.role === 'PRODUCCION') return <Navigate to="/produccion" replace />
  return <>{children}</>
}

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'SUPERADMIN') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

const ProduccionRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'PRODUCCION') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* SuperAdmin area */}
      <Route path="/superadmin" element={<SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>}>
        <Route index element={<Navigate to="/superadmin/empresas" replace />} />
        <Route path="empresas" element={<SuperAdminEmpresas />} />
        <Route path="empresas/:id" element={<SuperAdminEmpresaDetalle />} />
        <Route path="usuarios" element={<SuperAdminUsuarios />} />
      </Route>

      {/* Produccion area */}
      <Route path="/produccion" element={<ProduccionRoute><ProduccionLayout /></ProduccionRoute>}>
        <Route index element={<Produccion />} />
      </Route>

      {/* Regular app */}
      <Route path="/" element={<AdminOnlyRoute><Layout /></AdminOnlyRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="pedidos/nuevo" element={<NuevoPedido />} />
        <Route path="pedidos/:id" element={<DetallePedido />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="configuracion/cotizador" element={<Cotizador />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
