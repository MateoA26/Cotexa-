import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.use(requireAuth)

// ── Precio config ─────────────────────────────────────────

router.get('/config', async (req: AuthRequest, res: Response) => {
  const empresaId = req.user!.empresaId
  if (!empresaId) return res.json({ precioBase: 0 })
  const config = await prisma.precioConfig.findUnique({ where: { empresaId } })
  res.json(config ?? { precioBase: 0 })
})

router.patch('/config', async (req: AuthRequest, res: Response) => {
  const empresaId = req.user!.empresaId
  if (!empresaId) return res.status(403).json({ error: 'Sin empresa' })
  const { precioBase } = req.body
  const config = await prisma.precioConfig.upsert({
    where: { empresaId },
    update: { precioBase: Number(precioBase) },
    create: { empresaId, precioBase: Number(precioBase) }
  })
  res.json(config)
})

// ── Materiales ────────────────────────────────────────────

router.get('/materiales', async (req: AuthRequest, res: Response) => {
  const empresaId = req.user!.empresaId
  if (!empresaId) return res.json([])
  const materiales = await prisma.material.findMany({
    where: { empresaId, activo: true },
    orderBy: { nombre: 'asc' }
  })
  res.json(materiales)
})

router.post('/materiales', async (req: AuthRequest, res: Response) => {
  const empresaId = req.user!.empresaId
  if (!empresaId) return res.status(403).json({ error: 'Sin empresa' })
  const { nombre, precioUnitario } = req.body
  if (!nombre) return res.status(400).json({ error: 'nombre es requerido' })
  const material = await prisma.material.create({
    data: { empresaId, nombre, precioUnitario: Number(precioUnitario) || 0 }
  })
  res.json(material)
})

router.patch('/materiales/:id', async (req: AuthRequest, res: Response) => {
  const { nombre, precioUnitario } = req.body
  const data: any = {}
  if (nombre !== undefined) data.nombre = nombre
  if (precioUnitario !== undefined) data.precioUnitario = Number(precioUnitario)
  const material = await prisma.material.update({
    where: { id: Number(req.params.id) },
    data
  })
  res.json(material)
})

router.delete('/materiales/:id', async (req: AuthRequest, res: Response) => {
  await prisma.material.update({
    where: { id: Number(req.params.id) },
    data: { activo: false }
  })
  res.json({ ok: true })
})

// ── Tramos de descuento ───────────────────────────────────

router.get('/tramos', async (req: AuthRequest, res: Response) => {
  const empresaId = req.user!.empresaId
  if (!empresaId) return res.json([])
  const tramos = await prisma.tramoDescuento.findMany({
    where: { empresaId },
    orderBy: { desdeUnidades: 'asc' }
  })
  res.json(tramos)
})

router.post('/tramos', async (req: AuthRequest, res: Response) => {
  const empresaId = req.user!.empresaId
  if (!empresaId) return res.status(403).json({ error: 'Sin empresa' })
  const { desdeUnidades, porcentaje } = req.body
  if (!desdeUnidades || !porcentaje) return res.status(400).json({ error: 'desdeUnidades y porcentaje son requeridos' })
  const tramo = await prisma.tramoDescuento.create({
    data: { empresaId, desdeUnidades: Number(desdeUnidades), porcentaje: Number(porcentaje) }
  })
  res.json(tramo)
})

router.patch('/tramos/:id', async (req: AuthRequest, res: Response) => {
  const { desdeUnidades, porcentaje } = req.body
  const data: any = {}
  if (desdeUnidades !== undefined) data.desdeUnidades = Number(desdeUnidades)
  if (porcentaje !== undefined) data.porcentaje = Number(porcentaje)
  const tramo = await prisma.tramoDescuento.update({
    where: { id: Number(req.params.id) },
    data
  })
  res.json(tramo)
})

router.delete('/tramos/:id', async (req: AuthRequest, res: Response) => {
  await prisma.tramoDescuento.delete({
    where: { id: Number(req.params.id) }
  })
  res.json({ ok: true })
})

export default router
