# Backend (Express + TypeScript)

## Desarrollo

```bash
pnpm install --frozen-lockfile
pnpm run dev
```

`pnpm run dev` ejecuta `src/index.ts` con recarga automática mediante `tsx`.

## Catálogo de demostración

Para cargar o sincronizar los 100 productos realistas del catálogo local:

```bash
pnpm run seed:products
```

El seed es idempotente, conserva los IDs usados por carritos y órdenes y no reinicia el stock de productos existentes. Los productos nuevos reciben su inventario inicial. No elimina registros ni recrea la base.

## Compilación y producción

```bash
pnpm run typecheck
pnpm run build
pnpm start
```

TypeScript compila las fuentes de `src` en `dist`; `pnpm start` ejecuta `dist/index.js`.

## Pruebas

```bash
pnpm test
pnpm run test:coverage
```

Jest usa una base SQLite en memoria (`DB_STORAGE=:memory:`). Las pruebas no leen ni modifican
`data/database.sqlite`.

## Configuración

- `PORT`: puerto HTTP, por defecto `4000`.
- `JWT_SECRET`: clave para firmar los tokens.
- `DB_STORAGE`: ruta del archivo SQLite; por defecto `data/database.sqlite`. Puede usar
  `:memory:` para una base efímera.

## API

- `GET /api/health`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/cart` (requiere JWT)
- `POST /api/cart` (requiere JWT)
- `PUT /api/cart` (requiere JWT)
- `DELETE /api/cart/:productId` (requiere JWT)
- `POST /api/checkout` (requiere JWT)
- `POST /api/orders/:orderId/cancel` (requiere JWT)

Checkout y cancelación de órdenes usan transacciones para mantener la consistencia.
