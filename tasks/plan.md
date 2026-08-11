# Plan de mejora del marketplace

## Objetivo

Endurecer la API y el frontend, migrar producción a PostgreSQL y separar la reserva de inventario del estado de cobro. La especificación está en [spec-postgres-orders-payments.md](./spec-postgres-orders-payments.md).

## Decisiones completadas

- [x] PostgreSQL como base por defecto; SQLite solo para Jest e importación.
- [x] Migraciones versionadas en lugar de `sequelize.sync()` fuera de tests.
- [x] Importador de solo lectura que conserva IDs y reajusta secuencias.
- [x] Dinero en `DECIMAL(12,2)` y pagos en centavos enteros.
- [x] `Order` y `Payment` separados, con checkout `pending_payment`.
- [x] `Idempotency-Key`, bloqueos y `inventoryReleasedAt` para reintentos.
- [x] Sesión por cookie HttpOnly y Bearer de compatibilidad.
- [x] CSP/proxy de mismo origen, logs redactados y JSON limitado.
- [x] Dependencias sin advisories conocidos en auditoría moderada.
- [x] CI con migración PostgreSQL y smoke test de Compose.

## Checkpoints verificados

- [x] Checkout no marca pagado sin una transición de `Payment`.
- [x] Se cubren `pending → paid`, `pending → failed` y cancelación.
- [x] Una clave repetida no duplica orden, pago ni stock reservado.
- [x] Un usuario no puede leer, pagar o cancelar pedidos ajenos.
- [x] Cookie, Authorization y cuerpos crudos no llegan a logs.
- [x] Backend y frontend pasan tests, typecheck y build.
- [x] README, OpenAPI, Postman, Compose y variables describen el mismo contrato.

## Trabajo futuro

- Proveedor de pagos real con tokens y webhooks firmados.
- Rate limit distribuido para múltiples réplicas.
- Paginación del catálogo en la API.
- Observabilidad, backups/restores automatizados y rollout gradual.
- Mantener React Router, Vite, Vitest y el resto de dependencias en versiones corregidas.

## Riesgo local conocido

El host usado para esta entrega no dispone de Docker/PostgreSQL, por lo que la ejecución real del stack se delega al job `Compose smoke test` de CI. Las suites locales usan SQLite en memoria por diseño.
