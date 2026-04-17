import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

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
    res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email, role: user.role } })
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' })
  }
})

router.post('/seed', async (_req: Request, res: Response) => {
  try {
    const hash = await bcrypt.hash('admin123', 10)
    const empresa = await prisma.empresa.upsert({
      where: { slug: 'cotexa-demo' },
      update: {},
      create: { nombre: 'Cotexa Demo', slug: 'cotexa-demo', email: 'demo@cotexa.com' }
    })
    await prisma.usuario.upsert({
      where: { email: 'admin@cotexa.com' },
      update: {},
      create: { email: 'admin@cotexa.com', passwordHash: hash, nombre: 'Admin Demo', role: 'ADMIN', empresaId: empresa.id }
    })
    await (prisma.cliente as any).createMany({
      data: [
        { empresaId: empresa.id, nombre: 'María García', email: 'maria@ejemplo.com', tipo: 'B2C', telefono: '1145001234' },
        { empresaId: empresa.id, nombre: 'ACME S.A.', email: 'compras@acme.com', tipo: 'B2B', razonSocial: 'ACME S.A.', cuit: '30-12345678-9' }
      ]
    })
    res.json({ ok: true, mensaje: 'admin@cotexa.com / admin123' })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.get('/empresa', requireAuth, async (req: AuthRequest, res: Response) => {
  const empresa = await prisma.empresa.findFirst({ where: { id: req.user!.empresaId! } })
  res.json(empresa || {})
})

export default router