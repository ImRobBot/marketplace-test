# ADR-001: PostgreSQL y dominio separado de pedidos/pagos

## Estado

Aceptada e implementada

## Fecha

2026-08-11

## Contexto

El marketplace usaba SQLite y `sequelize.sync()` como mecanismo de arranque. Eso limitaba la concurrencia de escrituras, mantenía una cadena de dependencias nativas (`sqlite3`/`node-gyp`) en el runtime y no ofrecía migraciones operativas. Además, el checkout creaba directamente una orden `paid`, aunque no existía un proveedor de pagos y el importe usaba `FLOAT`.

## Decision

Usar PostgreSQL como dialecto por defecto de Sequelize, con migraciones versionadas y una importacion explicita desde la SQLite local. Mantener SQLite solo para tests y como origen de migracion.

Separar `Order` y `Payment`: checkout reserva inventario y crea una orden/pago pendientes; un adaptador simulado permite probar el flujo sin recibir datos de tarjeta. La integracion real llegara despues mediante proveedor y webhooks firmados.

Guardar importes persistentes en `DECIMAL(12,2)` y el importe del pago en centavos enteros. Las claves de idempotencia y `inventoryReleasedAt` protegen reintentos y liberaciones duplicadas.

La sesion se entrega en cookie `HttpOnly`, `SameSite=Lax` y `Secure` en produccion. El soporte Bearer se mantiene temporalmente para clientes existentes, pero el frontend usa cookies.

## Alternativas consideradas

### Continuar con SQLite

Rechazada para produccion: concurrencia limitada, dependencia nativa vulnerable y ausencia de migraciones operativas.

### Marcar checkout como pagado

Rechazada: mezcla reserva de inventario con confirmacion de cobro y no permite reintentos ni conciliacion.

### Integrar Stripe ahora

Aplazada: no hay credenciales, webhook ni requisitos operativos definidos. El adaptador simulado valida el contrato sin inventar una integracion insegura.

### Guardar tarjetas o CVV

Rechazada: aumenta el alcance PCI y no es necesario para preparar el dominio.

## Consecuencias

- Produccion requiere PostgreSQL y migraciones antes de arrancar.
- El equipo obtiene transacciones y concurrencia adecuadas para pedidos.
- El frontend debe manejar `pending_payment`, `paid`, `payment_failed` y `cancelled`.
- La migracion es controlada y no destruye la SQLite original.
- Persisten tareas futuras: proveedor real, webhooks, reembolsos y rate limit distribuido.
