# Backend de Mercado Uno

API Express/TypeScript con Sequelize 6. PostgreSQL es obligatorio fuera de tests; SQLite en memoria se usa únicamente en Jest y el driver `sqlite3` es dependencia de desarrollo.

## Configuración

Copia `.env.example` a `.env` y cambia los secretos.

| Variable | Uso |
|---|---|
| `DATABASE_URL` | URL PostgreSQL; obligatoria si `NODE_ENV != test` |
| `DATABASE_SSL` | `true` para exigir TLS y validar el certificado |
| `JWT_SECRET` | Secreto aleatorio de al menos 32 caracteres |
| `CORS_ORIGIN` | Origen exacto autorizado para navegador |
| `ENABLE_SIMULATED_PAYMENTS` | `true`/`false`; producción siempre los deshabilita |
| `ALLOW_BEARER_AUTH` | Permite devolver JWT con `X-Auth-Transport: bearer` |
| `TRUST_PROXY` | Número de proxies confiables; usa `0` sin proxy y `1` con Nginx |
| `SQLITE_SOURCE` | Ruta del origen para el importador de solo lectura |

En producción usa `NODE_ENV=production`, HTTPS, `DATABASE_SSL=true` cuando el proveedor lo requiera y no habilites el pago simulado.

## Comandos

```powershell
pnpm install --frozen-lockfile
pnpm run migrate
pnpm run dev
pnpm run seed:products
pnpm run typecheck
pnpm test
pnpm run test:coverage
pnpm run build
pnpm audit --prod --audit-level moderate
```

La aplicación autentica PostgreSQL y ejecuta migraciones pendientes al arrancar. `sequelize.sync()` solo se ejecuta en el entorno de test con SQLite en memoria.

## Importación SQLite → PostgreSQL

1. Crea una base PostgreSQL vacía y configura `DATABASE_URL`.
2. Ejecuta `pnpm run migrate`.
3. Configura `SQLITE_SOURCE` y ejecuta `pnpm run migrate:sqlite-to-postgres`.
4. Verifica conteos, IDs y secuencias antes de conmutar tráfico.

El proceso falla si el destino contiene datos de negocio, abre SQLite con `OPEN_READONLY`, normaliza estados heredados y genera pagos de legado. No borra el origen.

## Sesión y protección CSRF

Registro/login emiten `mercado_session` en desarrollo y `__Host-mercado_session` en producción, con `HttpOnly`, `SameSite=Lax`, `Path=/` y `Secure` en producción. Las mutaciones autenticadas por cookie rechazan un header `Origin` distinto de `CORS_ORIGIN`. Los clientes Bearer siguen soportados para una transición controlada.

## Pedidos y pagos

```text
Order:   pending_payment -> paid -> cancelled
         pending_payment -> payment_failed

Payment: pending -> paid | failed | cancelled
         paid -> refunded (al cancelar esta simulación)
```

Checkout usa transacción, bloqueo de filas, precios de base de datos y `Idempotency-Key`. Pago y cancelación vuelven a bloquear el pedido; `inventoryReleasedAt` hace irreversible la liberación de stock dentro del dominio.

Consulta el contrato completo en [`../openapi.yaml`](../openapi.yaml).
