import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.use(requireAuth)

router.get('/', async (req: AuthRequest, res: Response) => {
  const clientes = await prisma.cliente.findMany({
    where: { empresaId: req.user!.empresaId! },
    include: { _count: { select: { pedidos: true } } },
    orderBy: { createdAt: 'desc' }
  })
  res.json(clientes)
})

router.post('/', async (req: AuthRequest, res: Response) => {
  const { nombre, email, telefono, tipo, razonSocial, cuit, notas } = req.body
  const cliente = await prisma.cliente.create({
    data: { empresaId: req.user!.empresaId!, nombre, email, telefono, tipo, razonSocial, cuit, notas }
  })
  res.json(cliente)
})

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const existe = await prisma.cliente.findFirst({
    where: { id: Number(req.params.id), empresaId: req.user!.empresaId! }
  })
  if (!existe) return res.status(404).json({ error: 'No encontrado' })
  const updated = await prisma.cliente.update({ where: { id: Number(req.params.id) }, data: req.body })
  res.json(updated)
})

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const clienteId = Number(req.params.id)
  try {
    const cliente = await prisma.cliente.findFirst({
      where: { id: clienteId, empresaId: req.user!.empresaId! }
    })
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' })

    const pedidosActivos = await prisma.pedido.count({
      where: {
        clienteId,
        estado: { notIn: ['ENTREGADO', 'CANCELADO'] }
      }
    })
    if (pedidosActivos > 0) {
      return res.status(400).json({ error: `No se puede eliminar: el cliente tiene ${pedidosActivos} pedido(s) activo(s)` })
    }

    await prisma.pedido.deleteMany({ where: { clienteId } })
    await prisma.cliente.delete({ where: { id: clienteId } })
    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error al eliminar cliente' })
  }
})

export default router
