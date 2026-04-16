export type Role = 'SUPERADMIN' | 'ADMIN' | 'PRODUCCION'
export type EstadoPedido = 'COTIZACION' | 'PENDIENTE' | 'CONFIRMADO' | 'EN_PRODUCCION' | 'LISTO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO'
export type TipoCliente = 'B2C' | 'B2B'
export type TipoCampo = 'BOOLEAN' | 'SELECT' | 'NUMBER'
export type ImpactoTipo = 'PORCENTAJE' | 'FIJO' | 'POR_UNIDAD'

export interface User {
  id: number
  nombre: string
  email: string
  role: Role
}

export interface Cliente {
  id: number
  nombre: string
  email?: string
  telefono?: string
  tipo: TipoCliente
  razonSocial?: string
  cuit?: string
  notas?: string
  createdAt: string
  _count?: { pedidos: number }
}

export interface CampoCustom {
  id: number
  nombre: string
  tipo: TipoCampo
  opciones: string[]
  impactoTipo: ImpactoTipo
  impactoValor: number
  activo: boolean
  orden: number
}

export interface ValorCampo {
  id: number
  campoId: number
  valor: string
  campo: CampoCustom
}

export interface EventoTracking {
  id: number
  estado: string
  descripcion?: string
  createdAt: string
}

export interface Pedido {
  id: number
  numeroPedido: number
  clienteId: number
  cliente: Cliente
  estado: EstadoPedido
  largo?: number
  ancho?: number
  alto?: number
  material?: string
  impresion?: string
  cantidad?: number
  notasCliente?: string
  notasAdmin?: string
  precioBase?: number
  precioTotal?: number
  entregaEst?: string
  createdAt: string
  updatedAt: string
  eventos?: EventoTracking[]
  valoresCampos?: ValorCampo[]
}

export interface DashboardData {
  totalPedidos: number
  pedidosActivos: number
  totalClientes: number
  facturacionMes: number
  facturacionMesAnt: number
  pedidosMesCount: number
  ultimosPedidos: Pedido[]
  pedidosPorEstado: { estado: string; _count: number }[]
}
