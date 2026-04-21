import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

const requireSuperAdmin = (req: AuthRequest, res: Response, next: any) => {
  if (req.user?.role !== 'SUPERADMIN') return res.status(403).json({ error: 'Acceso denegado' })
  next()
}

router.use(requireAuth, requireSuperAdmin)

// ── Empresas ──────────────────────────────────────────────

router.get('/empresas', async (_req: AuthRequest, res: Response) => {
  const empresas = await prisma.empresa.findMany({
    where: { slug: { not: 'cotexa-internal' } },
    include: {
      _count: { select: { usuarios: true, pedidos: true } }
    },
    orderBy: { createdAt: 'asc' }
  })
  res.json(empresas)
})

router.get('/empresas/:id/usuarios', async (req: AuthRequest, res: Response) => {
  const usuarios = await prisma.usuario.findMany({
    where: { empresaId: Number(req.params.id), role: { not: 'SUPERADMIN' } },
    orderBy: { nombre: 'asc' }
  })
  res.json(usuarios.map(u => ({ ...u, passwordHash: undefined })))
})

router.post('/empresas/:id/usuarios', async (req: AuthRequest, res: Response) => {
  const { nombre, email, password, role } = req.body
  if (!nombre || !email || !password) return res.status(400).json({ error: 'nombre, email y password son requeridos' })
  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.usuario.create({
    data: { nombre, email, passwordHash: hash, role: role || 'ADMIN', empresaId: Number(req.params.id) }
  })
  res.json({ ...user, passwordHash: undefined })
})

router.patch('/empresas/:id/usuarios/:userId', async (req: AuthRequest, res: Response) => {
  const { nombre, email, password, role, activo } = req.body
  const data: any = {}
  if (nombre !== undefined) data.nombre = nombre
  if (email !== undefined) data.email = email
  if (role !== undefined) data.role = role
  if (activo !== undefined) data.activo = activo
  if (password) data.passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.usuario.update({
    where: { id: Number(req.params.userId) },
    data
  })
  res.json({ ...user, passwordHash: undefined })
})

router.post('/empresas', async (req: AuthRequest, res: Response) => {
  const { nombre, email, slug } = req.body
  if (!nombre || !slug) return res.status(400).json({ error: 'nombre y slug son requeridos' })
  const empresa = await prisma.empresa.create({
    data: { nombre, email: email || null, slug }
  })
  res.json(empresa)
})

router.patch('/empresas/:id', async (req: AuthRequest, res: Response) => {
  const { nombre, email } = req.body
  const empresa = await prisma.empresa.update({
    where: { id: Number(req.params.id) },
    data: {
      ...(nombre !== undefined && { nombre }),
      ...(email !== undefined && { email })
    }
  })
  res.json(empresa)
})

// ── Usuarios ─────────────────────────────────────────────

router.get('/usuarios', async (_req: AuthRequest, res: Response) => {
  const usuarios = await prisma.usuario.findMany({
    include: { empresa: { select: { id: true, nombre: true } } },
    orderBy: [{ empresaId: 'asc' }, { nombre: 'asc' }]
  })
  res.json(usuarios.map(u => ({ ...u, passwordHash: undefined })))
})

router.post('/usuarios', async (req: AuthRequest, res: Response) => {
  const { nombre, email, password, role, empresaId } = req.body
  if (!nombre || !email || !password) return res.status(400).json({ error: 'nombre, email y password son requeridos' })
  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.usuario.create({
    data: { nombre, email, passwordHash: hash, role: role || 'ADMIN', empresaId: empresaId ? Number(empresaId) : null },
    include: { empresa: { select: { id: true, nombre: true } } }
  })
  res.json({ ...user, passwordHash: undefined })
})

router.patch('/usuarios/:id', async (req: AuthRequest, res: Response) => {
  const { nombre, email, password, role, activo } = req.body
  const data: any = {}
  if (nombre !== undefined) data.nombre = nombre
  if (email !== undefined) data.email = email
  if (role !== undefined) data.role = role
  if (activo !== undefined) data.activo = activo
  if (password) data.passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.usuario.update({
    where: { id: Number(req.params.id) },
    data,
    include: { empresa: { select: { id: true, nombre: true } } }
  })
  res.json({ ...user, passwordHash: undefined })
})

export default router
