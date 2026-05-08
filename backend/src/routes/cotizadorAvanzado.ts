import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.use(requireAuth)

// ── Tipos de Caja ──────────────────────────────────────────────
router.get('/tipos-caja', async (req: AuthRequest, res: Response) => {
  const items = await prisma.tipoCaja.findMany({
    where: { empresaId: req.user!.empresaId!, activo: true },
    orderBy: { nombre: 'asc' }
  })
  res.json(items)
})

router.post('/tipos-caja', async (req: AuthRequest, res: Response) => {
  const { nombre, formulaAncho, formulaLargo } = req.body
  const item = await prisma.tipoCaja.create({
    data: { empresaId: req.user!.empresaId!, nombre, formulaAncho, formulaLargo }
  })
  res.json(item)
})

router.patch('/tipos-caja/:id', async (req: AuthRequest, res: Response) => {
  const item = await prisma.tipoCaja.updateMany({
    where: { id: Number(req.params.id), empresaId: req.user!.empresaId! },
    data: req.body
  })
  res.json(item)
})

router.delete('/tipos-caja/:id', async (req: AuthRequest, res: Response) => {
  await prisma.tipoCaja.updateMany({
    where: { id: Number(req.params.id), empresaId: req.user!.empresaId! },
    data: { activo: false }
  })
  res.json({ ok: true })
})

// ── Proveedores/Materiales ─────────────────────────────────────
router.get('/proveedores', async (req: AuthRequest, res: Response) => {
  const items = await prisma.proveedorMaterial.findMany({
    where: { empresaId: req.user!.empresaId!, activo: true },
    orderBy: [{ proveedor: 'asc' }, { material: 'asc' }]
  })
  res.json(items)
})

router.post('/proveedores', async (req: AuthRequest, res: Response) => {
  const { proveedor, material, precioM2 } = req.body
  const item = await prisma.proveedorMaterial.create({
    data: { empresaId: req.user!.empresaId!, proveedor, material, precioM2: Number(precioM2) }
  })
  res.json(item)
})

router.patch('/proveedores/:id', async (req: AuthRequest, res: Response) => {
  const item = await prisma.proveedorMaterial.updateMany({
    where: { id: Number(req.params.id), empresaId: req.user!.empresaId! },
    data: req.body
  })
  res.json(item)
})

router.delete('/proveedores/:id', async (req: AuthRequest, res: Response) => {
  await prisma.proveedorMaterial.updateMany({
    where: { id: Number(req.params.id), empresaId: req.user!.empresaId! },
    data: { activo: false }
  })
  res.json({ ok: true })
})

// ── Costos Adicionales ─────────────────────────────────────────
router.get('/costos', async (req: AuthRequest, res: Response) => {
  const items = await prisma.costoAdicional.findMany({
    where: { empresaId: req.user!.empresaId!, activo: true },
    orderBy: { nombre: 'asc' }
  })
  res.json(items)
})

router.post('/costos', async (req: AuthRequest, res: Response) => {
  const { nombre, tipo, valor } = req.body
  const item = await prisma.costoAdicional.create({
    data: { empresaId: req.user!.empresaId!, nombre, tipo, valor: Number(valor) }
  })
  res.json(item)
})

router.patch('/costos/:id', async (req: AuthRequest, res: Response) => {
  const item = await prisma.costoAdicional.updateMany({
    where: { id: Number(req.params.id), empresaId: req.user!.empresaId! },
    data: req.body
  })
  res.json(item)
})

router.delete('/costos/:id', async (req: AuthRequest, res: Response) => {
  await prisma.costoAdicional.updateMany({
    where: { id: Number(req.params.id), empresaId: req.user!.empresaId! },
    data: { activo: false }
  })
  res.json({ ok: true })
})

export default router
