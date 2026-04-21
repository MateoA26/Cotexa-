import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import SuperAdminLayout from './components/SuperAdminLayout'
import Dashboard from './pages/Dashboard'
import Pedidos from './pages/Pedidos'
import NuevoPedido from './pages/NuevoPedido'
import DetallePedido from './pages/DetallePedido'
import Clientes from './pages/Clientes'
import Configuracion from './pages/Configuracion'
import SuperAdminEmpresas from './pages/superadmin/Empresas'
import SuperAdminUsuarios from './pages/superadmin/Usuarios'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

const AdminOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role === 'SUPERADMIN') return <Navigate to="/superadmin/empresas" replace />
  return <>{children}</>
}

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'SUPERADMIN') return <Navigate to="/dashboard" replace />
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
        <Route path="usuarios" element={<SuperAdminUsuarios />} />
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
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
