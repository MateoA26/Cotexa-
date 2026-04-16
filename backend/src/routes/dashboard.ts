import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.use(requireAuth)

router.get('/', async (req: AuthRequest, res: Response) => {
  const eid = req.user!.empresaId!
  const hoy = new Date()
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const inicioMesAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)

  const [totalPedidos, pedidosActivos, totalClientes, facturacionMes, facturacionMesAnt, ultimosPedidos, pedidosPorEstado] =
    await Promise.all([
      prisma.pedido.count({ where: { empresaId: eid } }),
      prisma.pedido.count({ where: { empresaId: eid, estado: { in: ['PENDIENTE', 'CONFIRMADO', 'EN_PRODUCCION'] } } }),
      prisma.cliente.count({ where: { empresaId: eid } }),
      prisma.pedido.aggregate({ where: { empresaId: eid, createdAt: { gte: inicioMes } }, _sum: { precioTotal: true }, _count: true }),
      prisma.pedido.aggregate({ where: { empresaId: eid, createdAt: { gte: inicioMesAnt, lt: inicioMes } }, _sum: { precioTotal: true } }),
      prisma.pedido.findMany({ where: { empresaId: eid }, include: { cliente: true }, orderBy: { createdAt: 'desc' }, take: 6 }),
      prisma.pedido.groupBy({ by: ['estado'], where: { empresaId: eid }, _count: true })
    ])

  res.json({
    totalPedidos,
    pedidosActivos,
    totalClientes,
    facturacionMes: facturacionMes._sum.precioTotal || 0,
    facturacionMesAnt: facturacionMesAnt._sum.precioTotal || 0,
    pedidosMesCount: facturacionMes._count,
    ultimosPedidos,
    pedidosPorEstado
  })
})

export default router
