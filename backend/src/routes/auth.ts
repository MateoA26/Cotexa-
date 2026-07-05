import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.get('/empresa', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user?.empresaId) return res.status(404).json({ error: 'Sin empresa' })
  const empresa = await prisma.empresa.findUnique({ where: { id: req.user.empresaId } })
  if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada' })
  res.json(empresa)
})

router.patch('/empresa/me', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user?.empresaId) return res.status(403).json({ error: 'Sin empresa' })
  const { nombre, email, logoUrl } = req.body
  const data: any = {}
  if (nombre !== undefined) data.nombre = nombre
  if (email !== undefined) data.email = email
  if (logoUrl !== undefined) data.logoUrl = logoUrl
  const empresa = await prisma.empresa.update({ where: { id: req.user.empresaId }, data })
  res.json(empresa)
})

router.patch('/cambiar-password', requireAuth, async (req: AuthRequest, res: Response) => {
  const { passwordActual, passwordNuevo } = req.body
  if (!passwordActual || !passwordNuevo) return res.status(400).json({ error: 'Faltan datos' })
  if (passwordNuevo.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
  try {
    const user = await prisma.usuario.findUnique({ where: { id: req.user!.id } })
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
    const valid = await bcrypt.compare(passwordActual, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Contraseña actual incorrecta' })
    const hash = await bcrypt.hash(passwordNuevo, 10)
    await prisma.usuario.update({ where: { id: user.id }, data: { passwordHash: hash } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' })
  }
})

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  try {
    const user = await prisma.usuario.findUnique({ where: { email } })
    if (!user || !user.activo) return res.status(401).json({ error: 'Credenciales incorrectas' })
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' })
    const token = jwt.sign(
      { id: user.id, empresaId: user.empresaId, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
    res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email, role: user.role } })
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  })
  res.json({ ok: true })
})

router.post('/seed', async (_req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' })
  }
  try {
    const hashAdmin = await bcrypt.hash('admin123', 10)
    const hashDemo = await bcrypt.hash('demo123', 10)
    const hashTesting = await bcrypt.hash('testing123', 10)
    const hashProd = await bcrypt.hash('prod123', 10)

    const internalEmpresa = await prisma.empresa.upsert({
      where: { slug: 'cotexa-internal' },
      update: {},
      create: { nombre: 'Cotexa Internal', slug: 'cotexa-internal', email: 'admin@cotexa.com' }
    })

    await prisma.usuario.upsert({
      where: { email: 'admin@cotexa.com' },
      update: { role: 'SUPERADMIN', passwordHash: hashAdmin, empresaId: internalEmpresa.id },
      create: { email: 'admin@cotexa.com', passwordHash: hashAdmin, nombre: 'Super Admin', role: 'SUPERADMIN', empresaId: internalEmpresa.id }
    })

    const demoEmpresa = await prisma.empresa.upsert({
      where: { slug: 'cotexa-demo' },
      update: {},
      create: { nombre: 'Cotexa Demo', slug: 'cotexa-demo', email: 'demo@cotexa.com' }
    })

    await prisma.usuario.upsert({
      where: { email: 'ejemplodemo@cotexa.com' },
      update: { role: 'ADMIN', passwordHash: hashDemo, empresaId: demoEmpresa.id },
      create: { email: 'ejemplodemo@cotexa.com', passwordHash: hashDemo, nombre: 'Usuario Demo', role: 'ADMIN', empresaId: demoEmpresa.id }
    })

    const testingEmpresa = await prisma.empresa.upsert({
      where: { slug: 'testing' },
      update: {},
      create: { nombre: 'Testing', slug: 'testing', email: 'testing@testing.com' }
    })

    await prisma.usuario.upsert({
      where: { email: 'testing@testing.com' },
      update: { role: 'ADMIN', passwordHash: hashTesting, empresaId: testingEmpresa.id },
      create: { email: 'testing@testing.com', passwordHash: hashTesting, nombre: 'Testing User', role: 'ADMIN', empresaId: testingEmpresa.id }
    })

    await prisma.usuario.upsert({
      where: { email: 'produccion@testing.com' },
      update: { role: 'PRODUCCION', passwordHash: hashProd, empresaId: testingEmpresa.id },
      create: { email: 'produccion@testing.com', passwordHash: hashProd, nombre: 'Operario Testing', role: 'PRODUCCION', empresaId: testingEmpresa.id }
    })

    await (prisma.cliente as any).createMany({
      data: [
        { empresaId: demoEmpresa.id, nombre: 'María García', email: 'maria@ejemplo.com', tipo: 'B2C', telefono: '1145001234' },
        { empresaId: demoEmpresa.id, nombre: 'ACME S.A.', email: 'compras@acme.com', tipo: 'B2B', razonSocial: 'ACME S.A.', cuit: '30-12345678-9' }
      ]
    })

    res.json({ ok: true, usuarios: [
      'admin@cotexa.com / admin123 (SUPERADMIN)',
      'ejemplodemo@cotexa.com / demo123 (ADMIN)',
      'testing@testing.com / testing123 (ADMIN)',
      'produccion@testing.com / prod123 (PRODUCCION)'
    ] })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.patch('/usuario/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const { nombre, email } = req.body
  if (!nombre && !email) return res.status(400).json({ error: 'Faltan datos' })
  const data: any = {}
  if (nombre) data.nombre = nombre
  if (email) data.email = email
  try {
    const user = await prisma.usuario.update({ where: { id: req.user!.id }, data })
    res.json({ id: user.id, nombre: user.nombre, email: user.email, role: user.role })
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' })
  }
})

export default router
