# Mercado Uno

Marketplace de demostración construido con React, Express, TypeScript y SQLite. Incluye catálogo, autenticación con JWT, carrito, checkout simulado, control de inventario y cancelación de órdenes mediante una API REST.

> [!IMPORTANT]
> El checkout es una simulación educativa. No solicita datos bancarios ni realiza cargos reales.

## Documentación

- [Documentación integral del proyecto](./DOCUMENTACION.md)
- [Contrato OpenAPI 3.0 en YAML](./openapi.yaml)
- [Guía específica del backend](./backend/README.md)
- [Guía específica del frontend](./frontend/README.md)

## Arquitectura

```text
Navegador
   │
   ▼
React + Vite :3000
   │ HTTP/JSON
   ▼
Express :4000
   │ Sequelize
   ▼
SQLite (backend/data/database.sqlite)
```

El frontend y el backend son módulos independientes: cada uno tiene su propio `package.json`, dependencias y comandos.

## Inicio rápido

### Backend

```powershell
cd backend
npm ci
Copy-Item .env.example .env
npm run seed:products
npm run dev
```

### Frontend

En una segunda terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Servicios locales:

- Aplicación: <http://localhost:3000>
- API: <http://localhost:4000>
- Salud de la API: <http://localhost:4000/api/health>

Si PowerShell bloquea `npm.ps1`, utiliza `npm.cmd` en lugar de `npm`.

## Verificación

Ejecuta estos comandos dentro de `backend` y después dentro de `frontend`:

```powershell
npm run typecheck
npm test
npm run build
```

Consulta [DOCUMENTACION.md](./DOCUMENTACION.md) para instalación detallada, estructura, modelo de datos, rutas, seguridad, resolución de problemas y operación del proyecto.
