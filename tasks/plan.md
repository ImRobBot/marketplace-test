# Plan de mejora del marketplace

## Objetivo

Endurecer los límites de la API y proteger los flujos de carrito, checkout y cancelación sin cambiar el flujo de autenticación del frontend en esta primera iteración.

## Diagnóstico priorizado

1. Las rutas aceptan cuerpos JSON nulos o con tipos inesperados y convierten parámetros con `Number(...)` sin comprobar que sean enteros positivos.
2. `POST /api/cart` valida la cantidad agregada, pero no valida el total acumulado del artículo; un cliente puede hacer crecer indefinidamente una línea del carrito.
3. La cancelación consulta el estado fuera de la transacción y después restaura inventario. Dos solicitudes concurrentes pueden restaurar el mismo inventario más de una vez.
4. El backend no tiene un manejador uniforme para 404 y errores asíncronos, por lo que una excepción de una ruta puede producir respuestas inconsistentes.
5. La protección de autenticación usa bcrypt con coste 8 y comparte únicamente el límite global de la API.

## Decisiones

- Mantener el contrato Bearer JWT en esta tanda. Migrar el token a cookies `httpOnly` requiere cambiar el flujo frontend/backend y se mantiene como tarea de seguridad separada.
- Reutilizar validadores pequeños y tipados, sin añadir una dependencia de esquemas para un conjunto reducido de endpoints.
- Mantener respuestas de error compatibles (`{ error: string }`) para no romper el frontend ni el contrato OpenAPI.
- Hacer que cada incremento tenga una prueba de regresión y una verificación independiente.

## Tareas

### Fase 1: límites de entrada

- [x] Validar cuerpos y parámetros de autenticación, productos, carrito y órdenes en el borde de la API.
- [x] Impedir que una línea del carrito supere el máximo permitido después de acumular cantidades.
- [x] Añadir pruebas para cuerpos nulos, IDs inválidos y acumulación por encima del límite.

### Fase 2: consistencia y errores

- [x] Hacer la cancelación idempotente dentro de la misma transacción que restaura inventario.
- [x] Añadir manejadores de 404 y errores JSON uniformes; evitar filtrar detalles internos.
- [x] Añadir pruebas para cancelación repetida y respuestas de error.

### Fase 3: autenticación y documentación

- [x] Elevar el coste de bcrypt a 12 y aplicar un límite específico a autenticación.
- [x] Actualizar OpenAPI y documentación para reflejar los límites reales y las limitaciones pendientes.

## Trabajo futuro deliberadamente fuera de alcance

- Migrar el JWT de `localStorage` a cookies `httpOnly`, `secure` y `sameSite`.
- Sustituir precios `FLOAT` por centavos enteros o `DECIMAL` y añadir migraciones.
- Sustituir el rate limiting en memoria por un almacén compartido cuando haya más de un proceso.
- Añadir paginación al catálogo y preparar SQLite para una base de datos de producción.
- Migrar React Router desde 6.30.4 a una línea parcheada compatible; la versión 6.30.5 indicada por la auditoría no está publicada.
- Revisar la cadena transitiva `sqlite3 → node-gyp → tar` y `sequelize → uuid`; la auditoría actual reporta vulnerabilidades de build/transitivas que no deben resolverse con `audit fix --force`.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Cambiar errores de validación rompe clientes | Medio | Conservar `{ error: string }` y probar respuestas existentes |
| SQLite bloquea transacciones concurrentes | Medio | Mantener la transacción corta y comprobar el estado dentro de ella |
| bcrypt ralentiza la suite | Bajo | Usar coste 12 y medir tests antes de cerrar la rama |
| Migración de JWT requiere cambios de sesión | Alto | No tocarla en esta tanda; dejarla documentada como tarea separada |

## Criterios de aceptación

- Todas las entradas de las rutas modificadas se validan antes de acceder a la base de datos.
- El carrito no puede acumular cantidades fuera de `1..100`.
- Una orden cancelada solo restaura su inventario una vez, incluso con reintentos.
- Las rutas desconocidas y errores internos devuelven JSON estable sin stack traces.
- Backend y frontend conservan sus pruebas, typecheck y build en verde.
