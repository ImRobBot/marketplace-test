# Backend (Express + TypeScript)

## Desarrollo

```bash
npm install
npm run dev
```

`npm run dev` ejecuta `src/index.ts` con recarga automática mediante `tsx`.

## Compilación y producción

```bash
npm run typecheck
npm run build
npm start
```

TypeScript compila las fuentes de `src` en `dist`; `npm start` ejecuta `dist/index.js`.

## Pruebas

```bash
npm test
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
