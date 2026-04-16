import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.use(requireAuth)

router.get('/', async (req: AuthRequest, res: Response) => {
  const { estado } = req.query
  const where: any = { empresaId: req.user!.empresaId! }
  if (estado) where.estado = estado
  const pedidos = await prisma.pedido.findMany({
    where,
    include: { cliente: true },
    orderBy: { createdAt: 'desc' }
  })
  res.json(pedidos)
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const pedido = await prisma.pedido.findFirst({
    where: { id: Number(req.params.id), empresaId: req.user!.empresaId! },
    include: {
      cliente: true,
      eventos: { orderBy: { createdAt: 'desc' } },
      valoresCampos: { include: { campo: true } }
    }
  })
  if (!pedido) return res.status(404).json({ error: 'No encontrado' })
  res.json(pedido)
})

router.post('/', async (req: AuthRequest, res: Response) => {
  const {
    clienteId, largo, ancho, alto, material, impresion,
    cantidad, notasCliente, precioBase, precioTotal,
    entregaEst, valoresCampos, estado
  } = req.body
  const count = await prisma.pedido.count({ where: { empresaId: req.user!.empresaId! } })
  const pedido = await prisma.pedido.create({
    data: {
      empresaId: req.user!.empresaId!,
      clienteId: Number(clienteId),
      numeroPedido: count + 1,
      estado: estado || 'COTIZACION',
      largo: largo ? Number(largo) : null,
      ancho: ancho ? Number(ancho) : null,
      alto: alto ? Number(alto) : null,
      material: material || null,
      impresion: impresion || null,
      cantidad: cantidad ? Number(cantidad) : null,
      notasCliente: notasCliente || null,
      precioBase: precioBase ? Number(precioBase) : null,
      precioTotal: precioTotal ? Number(precioTotal) : null,
      entregaEst: entregaEst ? new Date(entregaEst) : null,
      eventos: { create: { estado: estado || 'COTIZACION', descripcion: 'Pedido creado' } },
      valoresCampos: valoresCampos?.length ? {
        create: valoresCampos.map((v: any) => ({ campoId: v.campoId, valor: String(v.valor) }))
      } : undefined
    },
    include: { cliente: true }
  })
  res.json(pedido)
})

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const { estado, notasAdmin, precioTotal, entregaEst } = req.body
  const pedido = await prisma.pedido.findFirst({
    where: { id: Number(req.params.id), empresaId: req.user!.empresaId! }
  })
  if (!pedido) return res.status(404).json({ error: 'No encontrado' })
  const updated = await prisma.pedido.update({
    where: { id: Number(req.params.id) },
    data: {
      ...(estado && { estado }),
      ...(notasAdmin !== undefined && { notasAdmin }),
      ...(precioTotal !== undefined && { precioTotal: Number(precioTotal) }),
      ...(entregaEst && { entregaEst: new Date(entregaEst) }),
      ...(estado && { eventos: { create: { estado, descripcion: `Estado actualizado a ${estado}` } } })
    },
    include: { cliente: true, eventos: { orderBy: { createdAt: 'desc' } } }
  })
  res.json(updated)
})

export default router
