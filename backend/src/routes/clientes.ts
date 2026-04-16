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

export default router
