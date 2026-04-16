import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.use(requireAuth)

router.get('/', async (req: AuthRequest, res: Response) => {
  const campos = await prisma.campoCustom.findMany({
    where: { empresaId: req.user!.empresaId!, activo: true },
    orderBy: { orden: 'asc' }
  })
  const parsed = campos.map(c => ({ ...c, opciones: JSON.parse(c.opciones) }))
  res.json(parsed)
})

router.post('/', async (req: AuthRequest, res: Response) => {
  const { nombre, tipo, opciones, impactoTipo, impactoValor } = req.body
  const count = await prisma.campoCustom.count({ where: { empresaId: req.user!.empresaId! } })
  const campo = await prisma.campoCustom.create({
    data: {
      empresaId: req.user!.empresaId!,
      nombre, tipo,
      opciones: JSON.stringify(opciones || []),
      impactoTipo,
      impactoValor: Number(impactoValor) || 0,
      orden: count
    }
  })
  res.json({ ...campo, opciones: JSON.parse(campo.opciones) })
})

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const data = { ...req.body }
  if (data.opciones) data.opciones = JSON.stringify(data.opciones)
  const campo = await prisma.campoCustom.update({ where: { id: Number(req.params.id) }, data })
  res.json({ ...campo, opciones: JSON.parse(campo.opciones) })
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await prisma.campoCustom.update({ where: { id: Number(req.params.id) }, data: { activo: false } })
  res.json({ ok: true })
})

export default router
