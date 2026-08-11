# Guía práctica DevOps

## Stack local reproducible

```powershell
Copy-Item .env.example .env
# Edita .env y reemplaza los secretos
docker compose config
docker compose up --build --detach --wait
docker compose ps
```

Comprobaciones:

```powershell
Invoke-RestMethod http://localhost:4000/api/health
Invoke-RestMethod http://localhost:3000/api/products
(Invoke-WebRequest http://localhost:3000).Headers['Content-Security-Policy']
```

Si el primer arranque falla por descarga o readiness, ejecuta una segunda vez `docker compose up --build --detach --wait` y consulta `docker compose logs --no-color`.

## Servicios y persistencia

- `postgres:18-alpine`: volumen `postgres_data` montado en `/var/lib/postgresql`. PostgreSQL 18 cambió la ruta recomendada; no uses la ruta histórica `/var/lib/postgresql/data`.
- `backend`: espera a que `pg_isready` esté saludable, ejecuta migraciones al iniciar y corre como usuario `node`.
- `frontend`: espera a la API, publica Nginx en `:3000` y redirige `/api` al backend.

`docker compose down` conserva datos. `docker compose down --volumes` borra la base local y requiere intención explícita.

## Configuración de producción

No despliegues los defaults de Compose como producción. Configura como mínimo:

- `NODE_ENV=production`;
- un `JWT_SECRET` generado por un CSPRNG y almacenado en un gestor de secretos;
- PostgreSQL administrado con backups, restauración probada y TLS;
- `DATABASE_SSL=true` cuando corresponda;
- `CORS_ORIGIN` con el dominio HTTPS exacto;
- `TRUST_PROXY` acorde al número real de proxies;
- `ENABLE_SIMULATED_PAYMENTS=false`;
- terminación TLS y HSTS en el borde.

Evita contraseñas con caracteres que deban escaparse dentro de `DATABASE_URL`, o codifícalas como URL. No publiques PostgreSQL a Internet.

## Migraciones y despliegue

Antes de desplegar una versión:

```powershell
cd backend
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm test
pnpm run build
pnpm audit --prod --audit-level moderate
pnpm run migrate
```

Las migraciones son forward-only durante el despliegue normal. Haz snapshot/backup antes de cambios de esquema y no ejecutes `down` sobre producción sin un plan validado. Para rollback de aplicación, conserva compatibilidad con el esquema ya migrado.

## Migración desde SQLite

1. Respalda `backend/data/database.sqlite`.
2. Crea PostgreSQL vacío y ejecuta migraciones.
3. Ejecuta el importador con `SQLITE_SOURCE`.
4. Compara conteos de usuarios, productos, carritos, pedidos, líneas y pagos.
5. Verifica IDs/secuencias y realiza una prueba de escritura.
6. Mantén el archivo origen sin cambios hasta superar la ventana de rollback.

El importador se niega a escribir sobre un destino con datos de negocio.

## CI/CD

El workflow `.github/workflows/ci.yml` contiene cuatro gates:

1. Backend: auditoría, migración PostgreSQL, typecheck, cobertura y build.
2. Frontend: auditoría, typecheck, cobertura y build.
3. Contenedores: `docker compose up --build --wait` y smoke tests.
4. SonarCloud opcional cuando existe `SONAR_TOKEN`.

Protege `main/master` exigiendo los tres primeros jobs. El workflow cancela ejecuciones obsoletas de la misma rama.

## Operación

- Salud: `/api/health` comprueba proceso HTTP; añade chequeo profundo de DB si el orquestador lo necesita.
- Logs: JSON estructurado, sin credenciales ni cuerpos de error.
- Backups: automatiza snapshots y prueba restauraciones periódicamente.
- Alertas: latencia/error rate, saturación de pool, bloqueos, almacenamiento y fallos de migración.
- Escalado: mueve el rate limit a Redis o equivalente antes de usar múltiples réplicas.
- Pagos reales: usa tokens del proveedor y webhooks firmados; nunca persistas tarjeta o CVV.

## Rollback

1. Detén el rollout y conserva logs/evidencia.
2. Revierte la imagen a una versión compatible con el esquema actual.
3. Si el incidente es de datos, restaura en una base separada y valida antes de conmutar.
4. No borres volúmenes ni ejecutes migraciones `down` como respuesta automática.
