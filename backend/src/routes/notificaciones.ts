import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.use(requireAuth)

router.get('/', async (req: AuthRequest, res: Response) => {
  const notifs = await prisma.notificacion.findMany({
    where: { empresaId: req.user!.empresaId! },
    orderBy: { creadaEn: 'desc' },
    take: 50,
  })
  res.json(notifs)
})

router.patch('/leer-todas', async (req: AuthRequest, res: Response) => {
  await prisma.notificacion.updateMany({
    where: { empresaId: req.user!.empresaId!, leida: false },
    data: { leida: true },
  })
  res.json({ ok: true })
})

router.patch('/:id/leer', async (req: AuthRequest, res: Response) => {
  const notif = await prisma.notificacion.findFirst({
    where: { id: Number(req.params.id), empresaId: req.user!.empresaId! },
  })
  if (!notif) return res.status(404).json({ error: 'No encontrado' })
  const updated = await prisma.notificacion.update({
    where: { id: Number(req.params.id) },
    data: { leida: true },
  })
  res.json(updated)
})

export default router
