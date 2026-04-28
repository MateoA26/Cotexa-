import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

const BUCKET = 'pedidos-archivos'

let _supabase: SupabaseClient | null = null
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  }
  return _supabase
}

// GET /archivos/:pedidoId — lista archivos con signed URLs frescas
router.get('/:pedidoId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const pedidoId = Number(req.params.pedidoId)
    const pedido = await prisma.pedido.findFirst({
      where: { id: pedidoId, empresaId: req.user!.empresaId! },
    })
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' })

    const archivos = await prisma.archivoAdjunto.findMany({
      where: { pedidoId },
      orderBy: { createdAt: 'desc' },
    })

    const supabase = getSupabase()
    const archivosConUrls = await Promise.all(
      archivos.map(async (archivo) => {
        const { data } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(archivo.storagePath, 3600)
        return { ...archivo, url: data?.signedUrl || archivo.url }
      })
    )

    res.json(archivosConUrls)
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error al obtener archivos' })
  }
})

// POST /archivos/:pedidoId — sube un archivo a Supabase Storage
router.post('/:pedidoId', requireAuth, upload.single('archivo'), async (req: AuthRequest, res: Response) => {
  try {
    const pedidoId = Number(req.params.pedidoId)
    const file = req.file
    if (!file) return res.status(400).json({ error: 'No se recibió archivo' })

    const pedido = await prisma.pedido.findFirst({
      where: { id: pedidoId, empresaId: req.user!.empresaId! },
    })
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' })

    const supabase = getSupabase()
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${pedido.empresaId}/${pedidoId}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false })

    if (uploadError) throw uploadError

    const { data: signedData } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 3600)

    const archivo = await prisma.archivoAdjunto.create({
      data: {
        pedidoId,
        nombre: file.originalname,
        url: signedData?.signedUrl || '',
        tipo: file.mimetype,
        tamanio: file.size,
        storagePath,
      },
    })

    res.json(archivo)
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error al subir archivo' })
  }
})

// DELETE /archivos/:archivoId — elimina de Storage y de la DB
router.delete('/:archivoId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const archivoId = Number(req.params.archivoId)
    const archivo = await prisma.archivoAdjunto.findUnique({
      where: { id: archivoId },
      include: { pedido: true },
    })
    if (!archivo) return res.status(404).json({ error: 'Archivo no encontrado' })
    if (archivo.pedido.empresaId !== req.user!.empresaId) {
      return res.status(403).json({ error: 'No autorizado' })
    }

    const supabase = getSupabase()
    const { error: deleteError } = await supabase.storage.from(BUCKET).remove([archivo.storagePath])
    if (deleteError) throw deleteError

    await prisma.archivoAdjunto.delete({ where: { id: archivoId } })
    res.json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error al eliminar archivo' })
  }
})

export default router
