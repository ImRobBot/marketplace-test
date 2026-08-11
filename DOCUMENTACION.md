# Documentación técnica de Mercado Uno

## Arquitectura

```text
Navegador/Postman
       |
       v
Nginx :3000  -- /api -->  Express :4000  --> PostgreSQL 18
       |                     |
       +-- React SPA         +-- migraciones SequelizeMeta
                             +-- importador SQLite (solo lectura)
```

El proxy de mismo origen simplifica cookies y permite una CSP `connect-src 'self'`. En desarrollo, Vite realiza el mismo proxy. La API directa en `:4000` se conserva para diagnóstico.

## Persistencia

Fuera de tests, `DATABASE_URL` es obligatoria y el dialecto siempre es PostgreSQL. El arranque autentica la conexión y ejecuta, en orden, las migraciones registradas en `SequelizeMeta`. No se usa sincronización automática de esquema en producción.

Tablas principales:

- `Users`: credenciales con bcrypt (coste 12).
- `Products`: catálogo, precio `DECIMAL(12,2)` y stock.
- `CartItems`: líneas únicas por usuario/producto.
- `Orders`: estado, total decimal, clave idempotente e `inventoryReleasedAt`.
- `OrderItems`: snapshot de cantidad/precio por pedido.
- `Payments`: un registro por pedido, importe entero en centavos y estado separado.

SQLite queda limitada a Jest (`:memory:`) y al origen del importador. El driver no forma parte de la imagen de runtime.

## Checkout transaccional

1. Valida `Idempotency-Key`; si ya existe para el usuario, devuelve el pedido previo.
2. Bloquea las líneas y productos del carrito.
3. Verifica stock y calcula centavos desde precios persistidos.
4. Descuenta inventario, crea `Order.pending_payment`, sus líneas y `Payment.pending`.
5. Vacía el carrito y confirma la transacción.

Una violación concurrente de la clave única revierte toda la segunda transacción y reutiliza la primera orden. El alias `orderId` se conserva en checkout, pero el objeto `order` es el contrato principal.

## Pago y cancelación

El pago simulado bloquea pedido y pago. Solo `pending_payment/pending` puede transicionar a `paid/paid` o `payment_failed/failed`; repetir una transición terminal devuelve el mismo resultado. En `NODE_ENV=production` el endpoint responde 503.

Cancelar bloquea pedido, líneas, pago y productos. La primera solicitud repone inventario y escribe `inventoryReleasedAt`; las siguientes no repiten efectos. Un pago pendiente/fallido pasa a `cancelled`; uno pagado se representa como `refunded` dentro de la simulación.

## Autenticación

- JWT firmado exclusivamente con HS256, vigencia de siete días.
- Cookie HttpOnly `mercado_session`; en producción, `__Host-mercado_session` + `Secure`.
- `SameSite=Lax`, `Path=/` y CORS con credenciales/origen exacto.
- Mutaciones con cookie validan `Origin` cuando el navegador lo envía.
- Bearer se prioriza si está presente, para clientes existentes.
- El frontend borra tokens heredados y restaura sesión con `/api/auth/me`.

## Controles de seguridad

- JSON estricto limitado a 10 KiB y 413 uniforme.
- Rate limit global antes del parser y límite reforzado en autenticación.
- IDs, credenciales, cantidades y estados validados.
- Errores internos genéricos; logs sin cuerpo, stack, Authorization ni cookies.
- `X-Powered-By` deshabilitado; API y frontend aplican headers defensivos.
- CSP del frontend restringida a recursos/conexiones del mismo origen.
- Auditoría de dependencias bloquea severidad moderada o superior en CI.

El rate limit en memoria no coordina réplicas; para escalar debe sustituirse por un almacén compartido.

## CI

GitHub Actions instala con lockfile congelado, audita dependencias, migra un PostgreSQL 18 real, ejecuta typecheck/cobertura/build, construye ambos contenedores y hace smoke tests de API, frontend y CSP. SonarCloud solo se ejecuta cuando existe `SONAR_TOKEN`.

## Límites explícitos

No hay proveedor de pago real, captura de tarjeta/CVV, webhooks, conciliación, direcciones, impuestos ni envíos. Para producción se necesita integrar un proveedor externo mediante tokens y webhooks firmados, observabilidad, backups y rate limit distribuido.
