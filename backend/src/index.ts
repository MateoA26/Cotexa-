import rateLimit from "express-rate-limit"
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import pedidosRoutes from './routes/pedidos'
import clientesRoutes from './routes/clientes'
import dashboardRoutes from './routes/dashboard'
import camposRoutes from './routes/campos'
import notificacionesRoutes from './routes/notificaciones'
import webhookRoutes from './routes/webhook'
import superadminRoutes from './routes/superadmin'
import preciosRoutes from './routes/precios'
import archivosRoutes from './routes/archivos'
import cotizadorAvanzadoRouter from './routes/cotizadorAvanzado'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: true, credentials: true }))
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: "Demasiados intentos" } })
app.use(express.json())
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }))

app.use('/api', webhookRoutes)                // ← NUEVO (va primero, sin auth)
app.use("/api/auth/login", loginLimiter)
app.use("/api/auth", authRoutes)
app.use('/api/pedidos', pedidosRoutes)
app.use('/api/clientes', clientesRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/campos', camposRoutes)
app.use('/api/notificaciones', notificacionesRoutes)
app.use('/api/superadmin', superadminRoutes)
app.use('/api/precios', preciosRoutes)
app.use('/api/archivos', archivosRoutes)
app.use('/api/cotizador-avanzado', cotizadorAvanzadoRouter)

app.listen(PORT, () => {
  console.log(`✅ Cotexa backend corriendo en http://localhost:${PORT}`)
})

export default app
