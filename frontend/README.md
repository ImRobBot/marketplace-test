# Frontend de Mercado Uno

SPA React 18 + React Router 7, TypeScript y Vite 6. La sesión se restaura mediante `GET /api/auth/me`; no se guarda JWT ni usuario en `localStorage`.

## Desarrollo

```powershell
pnpm install --frozen-lockfile
pnpm run dev
```

Vite escucha en `http://localhost:3000` y redirige `/api` al backend local en `http://localhost:4000`. El valor por defecto de `VITE_API_URL` es vacío para mantener las cookies y CSP en el mismo origen. Configúralo solo cuando la infraestructura publique la API en otro origen y ajusta también CSP/CORS.

## Validación

```powershell
pnpm run typecheck
pnpm test
pnpm run test:coverage
pnpm run build
pnpm audit --audit-level moderate
```

## Contenedor

El build genera archivos estáticos y Nginx:

- redirige `/api/` al servicio `backend`;
- soporta rutas SPA con fallback a `index.html`;
- cachea assets con hash;
- aplica CSP, HSTS, `nosniff`, `DENY`, política de permisos y referrer;
- oculta la versión de Nginx.

El checkout del UI crea primero una orden pendiente con clave idempotente y después llama al pago simulado. Si la segunda fase falla, muestra que el pedido existe y que el pago sigue pendiente; nunca presenta un checkout pendiente como compra completada.
