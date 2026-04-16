# Cotexa

Plataforma SaaS de gestión de pedidos y cotizaciones para empresas de packaging.

## Stack
- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Backend:** Node.js + Express + TypeScript
- **Base de datos:** SQLite (dev) → Supabase/PostgreSQL (prod)
- **ORM:** Prisma

## Arrancar en local

### Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Seed (una sola vez)
Abrí en el browser:
```
http://localhost:3001/api/auth/seed
```

## Login
- URL: http://localhost:5173
- Email: admin@cotexa.com
- Password: admin123

## Estructura
- `/dashboard` — métricas y resumen
- `/pedidos` — lista de pedidos con filtros
- `/pedidos/nuevo` — crear pedido + cotización en tiempo real
- `/pedidos/:id` — detalle y gestión del pedido
- `/clientes` — gestión de clientes
