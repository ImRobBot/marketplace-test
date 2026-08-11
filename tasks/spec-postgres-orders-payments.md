# Especificacion: PostgreSQL, pedidos y cobros

> Estado: implementada en `feature/marketplace-hardening` y validada por las suites/CI descritas en el README.

## Objetivo

Preparar Mercado Uno para un entorno multiusuario con PostgreSQL como base principal, una migracion reproducible desde la SQLite local y un dominio de pedidos/cobros que no almacene tarjetas ni marque una orden como pagada sin un estado de pago explicito.

## Supuestos y limites

1. El proyecto sigue siendo educativo; no se integra una pasarela real en esta entrega.
2. El proveedor simulado solo esta habilitado en desarrollo y tests. Produccion deja el pago simulado deshabilitado.
3. El JWT deja de viajar al navegador: la sesion usa cookie HttpOnly, Secure en produccion y SameSite=Lax.
4. SQLite se conserva solo para tests y para leer la base local durante la importacion.
5. No se elimina ni sobrescribe `backend/data/database.sqlite`.

## Contrato funcional

- `POST /api/checkout` crea una orden `pending_payment`, reserva stock y crea un pago `pending`.
- `POST /api/orders/{orderId}/pay` ejecuta el proveedor simulado en desarrollo/tests y es idempotente.
- `GET /api/orders` lista solamente las ordenes del usuario autenticado.
- `GET /api/orders/{orderId}` devuelve orden, lineas y resumen de pago sin datos sensibles.
- `POST /api/orders/{orderId}/cancel` es idempotente y libera stock una sola vez.
- `Idempotency-Key` opcional en checkout permite reintentos seguros del mismo intento.

## Estados

```text
Order:   pending_payment -> paid -> cancelled
         pending_payment -> payment_failed

Payment: pending -> paid | failed | cancelled | refunded
```

La transicion que libera inventario se protege con `inventoryReleasedAt`.

## Datos

- `Product.price`, `Order.total` y `OrderItem.price` pasan a `DECIMAL(12,2)`.
- `Payment.amountCents` se guarda como entero.
- `Payments` incluye proveedor, referencia externa, estado, importe, moneda, idempotencia y fechas.
- Las migraciones se registran en `SequelizeMeta` y se ejecutan en PostgreSQL fuera de tests.

## Comandos

```powershell
cd backend
pnpm install --frozen-lockfile
pnpm run migrate
pnpm run migrate:sqlite-to-postgres
pnpm run typecheck
pnpm test
pnpm run build
```

## Pruebas

- Integracion para cookies de sesion, migracion/configuracion, checkout pendiente, pago simulado, idempotencia, aislamiento y liberacion de stock.
- Regresion para payloads grandes, redaccion de headers sensibles y respuestas 413/400.
- Tests del frontend actualizados para sesion basada en cookie y checkout pendiente.
- Typecheck, build y auditoria de dependencias en ambos paquetes.

## Criterios de exito

- PostgreSQL arranca con migraciones y no se llama `sequelize.sync()` en produccion.
- La importacion conserva usuarios, productos, carritos, ordenes y lineas, genera pagos de legado y no toca el origen.
- Una orden no queda `paid` al crear checkout; el pago es separado y no duplica efectos al reintentarse.
- Ningun JWT, cookie ni cuerpo crudo de error se escribe en logs.
- Payloads grandes devuelven 413 y errores internos no exponen detalles.
- README, OpenAPI, Docker Compose y variables de entorno describen el mismo contrato.

## Fuera de alcance

- Captura/refund real y webhooks firmados.
- Direcciones, impuestos, envios o panel administrativo.
