# Mercado Uno

Marketplace educativo full stack con React, Express, Sequelize y PostgreSQL. La aplicación incluye catálogo, sesión por cookie HttpOnly, carrito, pedidos idempotentes y un proveedor de pagos simulado que nunca recibe datos bancarios.

## Arranque recomendado

Requisitos: Docker Desktop con Compose v2. PostgreSQL 18, API y frontend se levantan juntos.

```powershell
Copy-Item .env.example .env
# Cambia JWT_SECRET y POSTGRES_PASSWORD en .env
docker compose up --build --detach --wait
```

- Aplicación y API por proxy de mismo origen: `http://localhost:3000`
- API directa: `http://localhost:4000/api/health`
- PostgreSQL local: `localhost:5432`

Si una descarga o healthcheck transitorio falla, reintenta una vez:

```powershell
docker compose up --build --detach --wait
docker compose ps
docker compose logs --no-color
```

Para detener sin borrar la base: `docker compose down`. Para eliminar también el volumen local: `docker compose down --volumes` (destructivo).

> El equipo actual donde se preparó esta rama no tiene Docker instalado; el stack completo se valida en el job `Compose smoke test` de CI.

## Desarrollo sin contenedores

Requisitos: Node.js 22, pnpm 11 y PostgreSQL accesible.

```powershell
Copy-Item backend/.env.example backend/.env
cd backend
pnpm install --frozen-lockfile
pnpm run migrate
pnpm run dev
```

En otra terminal:

```powershell
cd frontend
pnpm install --frozen-lockfile
pnpm run dev
```

Vite publica `http://localhost:3000` y redirige `/api` a `http://localhost:4000`. `VITE_API_URL` solo es necesario cuando no existe un proxy de mismo origen.

## Migrar la SQLite anterior

El importador abre el origen en modo de solo lectura, exige un PostgreSQL destino vacío, conserva IDs y ajusta secuencias. No elimina ni modifica `backend/data/database.sqlite`.

```powershell
cd backend
$env:DATABASE_URL='postgresql://marketplace:password@localhost:5432/marketplace'
$env:SQLITE_SOURCE='data/database.sqlite'
pnpm run migrate
pnpm run migrate:sqlite-to-postgres
```

Haz un respaldo del origen y verifica los conteos antes de cambiar tráfico.

## Contrato funcional

- `POST /api/checkout` crea `Order.pending_payment`, reserva stock y crea `Payment.pending`.
- `Idempotency-Key` (8–128 caracteres) permite reintentar checkout sin duplicar orden, pago o reserva.
- `POST /api/orders/{id}/pay` simula `paid` o `failed` solo fuera de producción.
- `GET /api/orders` y `GET /api/orders/{id}` aíslan los datos por propietario.
- Cancelar es idempotente y `inventoryReleasedAt` impide devolver inventario dos veces.
- El frontend usa una cookie HttpOnly; Bearer solo se conserva para clientes compatibles habilitados explícitamente.

No existe cobro real, almacenamiento de tarjeta, CVV, webhook ni reembolso externo.

## Calidad y seguridad

```powershell
cd backend
pnpm run typecheck
pnpm test
pnpm run build
pnpm audit --prod --audit-level moderate

cd ../frontend
pnpm run typecheck
pnpm test
pnpm run build
pnpm audit --audit-level moderate
```

CI añade una instancia PostgreSQL real, ejecuta migraciones, cobertura, builds, auditorías y un smoke test de Compose. Las imágenes excluyen `sqlite3` del runtime, el proxy aplica CSP y la API limita JSON a 10 KiB, redacta cookies/Authorization y no registra cuerpos crudos.

## Documentación

- [Arquitectura y operación](./DOCUMENTACION.md)
- [Guía DevOps](./DEVOPS-GUIA-PRACTICA.md)
- [Backend](./backend/README.md)
- [Frontend](./frontend/README.md)
- [OpenAPI](./openapi.yaml)
- [ADR PostgreSQL/pedidos/pagos](./docs/decisions/ADR-001-postgresql-orders-payments.md)
- [Colección Postman](./postman/MercadoUno.postman_collection.json)
