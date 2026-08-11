# Tareas de `feature/marketplace-hardening`

- [x] Establecer línea base, tests, typecheck, build y auditoría.
- [x] Validar entradas, IDs, credenciales y cantidades.
- [x] Configurar PostgreSQL por defecto y SQLite solo para tests/importación.
- [x] Añadir migraciones versionadas y runner con `SequelizeMeta`.
- [x] Añadir importación SQLite → PostgreSQL de solo lectura.
- [x] Separar pedidos y pagos con estados e idempotencia.
- [x] Añadir listado/detalle aislado, pago simulado y cancelación segura.
- [x] Migrar la sesión del navegador a cookie HttpOnly.
- [x] Corregir logs, payloads sobredimensionados, rate limits y headers.
- [x] Retirar `sqlite3` del runtime y corregir dependencias auditadas.
- [x] Actualizar Compose, Dockerfiles y CI con PostgreSQL real.
- [x] Actualizar README, guías, ADR, OpenAPI y Postman.
- [x] Ejecutar suite completa, builds, auditoría y revisión final.
