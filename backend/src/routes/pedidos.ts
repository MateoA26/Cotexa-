import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { Resend } from 'resend'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

const ESTADOS_EMAIL: Record<string, string> = {
  CONFIRMADO: 'Confirmado',
  EN_PRODUCCION: 'En producción',
  LISTO: 'Listo para despacho',
  ENVIADO: 'Despachado',
}

async function enviarEmailEstado(pedido: any) {
  const emailCliente = pedido.cliente?.email
  const estadoLabel = ESTADOS_EMAIL[pedido.estado]
  if (!emailCliente || !estadoLabel) return

  const fecha = new Date().toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:#0f172a;border-radius:12px 12px 0 0;padding:24px 32px">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px">Cotexa</p>
            <p style="margin:4px 0 0;font-size:12px;color:#94a3b8">Gestión de pedidos y packaging</p>
          </td>
        </tr>

        <!-- Estado badge -->
        <tr>
          <td style="background:#0ea5e9;padding:14px 32px">
            <p style="margin:0;font-size:13px;font-weight:600;color:#ffffff">
              Pedido #${pedido.numeroPedido} — ${estadoLabel}
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:32px">
            <p style="margin:0 0 8px;font-size:16px;color:#0f172a">Hola ${pedido.cliente.nombre},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6">
              Tu pedido <strong>#${pedido.numeroPedido}</strong> avanzó al estado:
              <span style="display:inline-block;margin-left:6px;background:#dcfce7;color:#16a34a;font-size:13px;font-weight:600;padding:3px 10px;border-radius:20px">${estadoLabel}</span>
            </p>

            <!-- Detalles -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px">
              <tr style="background:#f8fafc">
                <td style="padding:10px 16px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Detalle</td>
                <td style="padding:10px 16px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Valor</td>
              </tr>
              ${pedido.material ? `
              <tr style="border-top:1px solid #e2e8f0">
                <td style="padding:10px 16px;font-size:14px;color:#64748b">Material</td>
                <td style="padding:10px 16px;font-size:14px;font-weight:500;color:#0f172a">${pedido.material}</td>
              </tr>` : ''}
              ${pedido.cantidad ? `
              <tr style="border-top:1px solid #e2e8f0">
                <td style="padding:10px 16px;font-size:14px;color:#64748b">Cantidad</td>
                <td style="padding:10px 16px;font-size:14px;font-weight:500;color:#0f172a">${pedido.cantidad.toLocaleString('es-AR')} unidades</td>
              </tr>` : ''}
              ${pedido.precioTotal ? `
              <tr style="border-top:1px solid #e2e8f0">
                <td style="padding:10px 16px;font-size:14px;color:#64748b">Total</td>
                <td style="padding:10px 16px;font-size:14px;font-weight:700;color:#0ea5e9">$${pedido.precioTotal.toLocaleString('es-AR')}</td>
              </tr>` : ''}
              <tr style="border-top:1px solid #e2e8f0">
                <td style="padding:10px 16px;font-size:14px;color:#64748b">Actualizado</td>
                <td style="padding:10px 16px;font-size:14px;font-weight:500;color:#0f172a">${fecha}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f1f5f9;border-radius:0 0 12px 12px;padding:16px 32px">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6">
              Este es un mensaje automático de Cotexa.<br>Para consultas, contactá a tu proveedor.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    await resend.emails.send({
      from: 'Cotexa <onboarding@resend.dev>',
      to: emailCliente,
      subject: `Tu pedido #${pedido.numeroPedido} avanzó a ${estadoLabel}`,
      html,
    })
    console.log(`✉️  Email enviado a ${emailCliente} — pedido #${pedido.numeroPedido} → ${pedido.estado}`)
  } catch (err) {
    console.error(`⚠️  Error enviando email a ${emailCliente}:`, err)
  }
}

router.use(requireAuth)

router.get('/', async (req: AuthRequest, res: Response) => {
  const { estado, clienteId } = req.query
  const where: any = { empresaId: req.user!.empresaId! }
  if (estado) where.estado = estado
  if (clienteId) where.clienteId = Number(clienteId)
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
    clienteId, largo, ancho, alto, material, impresion, materialId,
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
      materialId: materialId ? Number(materialId) : null,
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

  const estadoPedido = estado || 'COTIZACION'
  const mensaje = estadoPedido === 'COTIZACION'
    ? `Nueva cotización de ${pedido.cliente.nombre}`
    : `Nuevo pedido de ${pedido.cliente.nombre}`
  await prisma.notificacion.create({
    data: { empresaId: req.user!.empresaId!, mensaje, pedidoId: pedido.id }
  })

  res.json(pedido)
})

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const {
    estado, notasAdmin, precioTotal, entregaEst,
    largo, ancho, alto, material, impresion, cantidad,
    notasCliente, precioBase, valoresCampos
  } = req.body
  const pedidoId = Number(req.params.id)

  if (req.user!.role === 'PRODUCCION') {
    const camposPermitidos = ['estado']
    const camposEnviados = Object.keys(req.body)
    const camposNoPermitidos = camposEnviados.filter(c => !camposPermitidos.includes(c))
    if (camposNoPermitidos.length > 0) {
      return res.status(403).json({ error: 'Solo podés cambiar el estado del pedido' })
    }
    const estadosPermitidos = ['EN_PRODUCCION', 'LISTO']
    if (!estado || !estadosPermitidos.includes(estado)) {
      return res.status(403).json({ error: 'Solo podés cambiar el estado a EN_PRODUCCION o LISTO' })
    }
  }

  const pedido = await prisma.pedido.findFirst({
    where: { id: pedidoId, empresaId: req.user!.empresaId! }
  })
  if (!pedido) return res.status(404).json({ error: 'No encontrado' })

  if (valoresCampos !== undefined) {
    await prisma.valorCampo.deleteMany({ where: { pedidoId } })
  }

  const updated = await prisma.pedido.update({
    where: { id: pedidoId },
    data: {
      ...(estado && { estado }),
      ...(notasAdmin !== undefined && { notasAdmin }),
      ...(precioTotal !== undefined && { precioTotal: Number(precioTotal) }),
      ...(precioBase !== undefined && { precioBase: Number(precioBase) }),
      ...(entregaEst !== undefined && { entregaEst: entregaEst ? new Date(entregaEst) : null }),
      ...(largo !== undefined && { largo: largo !== null ? Number(largo) : null }),
      ...(ancho !== undefined && { ancho: ancho !== null ? Number(ancho) : null }),
      ...(alto !== undefined && { alto: alto !== null ? Number(alto) : null }),
      ...(material !== undefined && { material }),
      ...(impresion !== undefined && { impresion }),
      ...(cantidad !== undefined && { cantidad: cantidad !== null ? Number(cantidad) : null }),
      ...(notasCliente !== undefined && { notasCliente }),
      ...(estado && { eventos: { create: { estado, descripcion: `Estado actualizado a ${estado}` } } }),
      ...(valoresCampos !== undefined && valoresCampos.length > 0 && {
        valoresCampos: {
          create: valoresCampos.map((v: any) => ({ campoId: v.campoId, valor: String(v.valor) }))
        }
      })
    },
    include: {
      cliente: true,
      eventos: { orderBy: { createdAt: 'desc' } },
      valoresCampos: { include: { campo: true } }
    }
  })
  if (estado && estado !== pedido.estado) {
    let mensaje: string | null = null
    if (estado === 'CONFIRMADO') mensaje = `Pedido #${updated.numeroPedido} confirmado`
    else if (estado === 'COTIZACION') mensaje = `Nueva cotización lista para ${updated.cliente.nombre}`
    else if (estado === 'ENTREGADO') mensaje = `Pedido #${updated.numeroPedido} entregado`
    if (mensaje) {
      await prisma.notificacion.create({
        data: { empresaId: req.user!.empresaId!, mensaje, pedidoId: pedidoId }
      })
    }

    if (ESTADOS_EMAIL[estado]) {
      enviarEmailEstado(updated)
    }
  }

  res.json(updated)
})

export default router
