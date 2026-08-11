# Documentación técnica de Mercado Uno

## 1. Descripción

Mercado Uno es un marketplace full stack de demostración. Permite registrar usuarios, iniciar sesión, consultar productos, administrar un carrito, completar una compra simulada y cancelar una orden desde la API.

El proyecto tiene fines educativos y de desarrollo local. El checkout marca las órdenes como pagadas sin conectarse a una pasarela de pago y la interfaz comunica que no se realizan cargos reales.

## 2. Alcance funcional

La versión actual incluye:

- Catálogo y detalle de productos.
- Búsqueda por texto y categorías visuales.
- Registro e inicio de sesión con JWT.
- Carrito persistido por usuario.
- Modificación y eliminación de artículos.
- Verificación de inventario durante el checkout.
- Creación transaccional de órdenes e ítems de orden.
- Cancelación de órdenes desde la API con restauración de inventario.
- Interfaz responsive inspirada en un marketplace de gran escala.
- Pruebas automatizadas de los flujos principales.
- Contrato [OpenAPI 3.0](./openapi.yaml).

No incluye pagos reales, direcciones, cálculo de envío, impuestos, historial de órdenes en la interfaz ni administración de productos.

## 3. Arquitectura

```text
┌──────────────────────────────┐
│ Navegador                    │
│ React + React Router + Axios │
└──────────────┬───────────────┘
               │ http://localhost:3000
               │ HTTP/JSON + JWT Bearer
               ▼
┌──────────────────────────────┐
│ API REST                     │
│ Express + TypeScript         │
└──────────────┬───────────────┘
               │ http://localhost:4000
               │ Sequelize
               ▼
┌──────────────────────────────┐
│ SQLite                       │
│ data/database.sqlite         │
└──────────────────────────────┘
```

El repositorio no usa un `package.json` raíz ni workspaces. `backend` y `frontend` se instalan, ejecutan y validan por separado.

### Tecnologías

| Capa | Tecnologías principales |
|---|---|
| Frontend | React 18, TypeScript, Vite 5, React Router 6, Axios |
| Estilos | CSS responsive por capas en `src/styles/legacy` y `src/styles/theme` |
| Backend | Express 4, TypeScript, JWT, bcryptjs |
| Persistencia | Sequelize 6 y SQLite 3 |
| Pruebas backend | Jest, ts-jest y Supertest |
| Pruebas frontend | Vitest, Testing Library y jsdom |

## 4. Estructura del repositorio

```text
marketplace/
├── README.md
├── DOCUMENTACION.md
├── openapi.yaml
├── backend/
│   ├── data/
│   │   ├── .gitkeep
│   │   └── database.sqlite       # local, ignorada por Git
│   ├── src/
│   │   ├── app.ts                # Express, rutas públicas y seed
│   │   ├── data/productCatalog.ts # catálogo local de 100 productos
│   │   ├── index.ts              # inicialización y listener HTTP
│   │   ├── middleware/auth.ts     # autenticación JWT
│   │   ├── models/                # modelos y relaciones Sequelize
│   │   ├── routes/auth.ts         # registro e inicio de sesión
│   │   ├── routes/cart.ts         # carrito, checkout y cancelación
│   │   └── scripts/seedProducts.ts # sincronización transaccional del catálogo
│   ├── tests/
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── app/                   # providers, shell y definición de rutas
    │   ├── components/
    │   │   ├── auth/              # formularios y presentación de acceso
    │   │   ├── cart/              # artículos, cantidad y resumen de compra
    │   │   ├── common/            # marca, avisos y estados vacíos
    │   │   ├── home/              # hero, departamentos, catálogo y tarjetas
    │   │   ├── layout/            # header, búsqueda, navegación y footer
    │   │   └── product/           # detalle, compra y visual del producto
    │   ├── context/AuthContext.tsx
    │   ├── data/                  # constantes tipadas de navegación y catálogo
    │   ├── hooks/                 # estado reutilizable sin marcado JSX
    │   ├── lib/                   # funciones puras de catálogo, carrito y auth
    │   ├── pages/                 # contenedores de estado y llamadas a la API
    │   ├── styles/
    │   │   ├── legacy/            # base estructural separada por dominio
    │   │   ├── theme/             # capa visual separada por dominio
    │   │   └── index.css          # entrada única; preserva el orden de cascada
    │   └── main.tsx               # montaje mínimo de React
    ├── index.html                 # único documento HTML host
    ├── vite.config.ts
    └── package.json
```

El marcado de cada componente React vive en su archivo `.tsx`; `index.html` solo contiene el documento host y el elemento `#root`. La lógica que no genera interfaz se mantiene en archivos `.ts`. Los estilos se cargan desde `styles/index.css`: primero la base estructural completa y después el tema visual completo para conservar la cascada original.

## 5. Requisitos

- Node.js y pnpm instalados. El entorno usado durante el desarrollo ejecuta Node.js 24.
- pnpm 9, activado mediante Corepack (`corepack enable`).
- Dos terminales para trabajar con frontend y backend simultáneamente.
- Un navegador moderno.
- Opcional: una herramienta compatible con SQLite para inspeccionar la base de datos.

No se requiere instalar un servidor de base de datos externo.

## 6. Instalación

Desde la raíz del proyecto:

### Backend

```powershell
cd backend
pnpm install --frozen-lockfile
Copy-Item .env.example .env
```

En Linux o macOS, sustituye `Copy-Item` por:

```bash
cp .env.example .env
```

Edita `.env` y reemplaza `JWT_SECRET` antes de compartir o desplegar la aplicación.

### Frontend

```powershell
cd ..\frontend
pnpm install --frozen-lockfile
```

## 7. Configuración

### Variables del backend

| Variable | Valor predeterminado | Uso |
|---|---:|---|
| `PORT` | `4000` | Puerto HTTP de Express. |
| `JWT_SECRET` | Sin valor predeterminado | Firma y validación de JWT. Debe configurarse con al menos 32 caracteres; la API rechaza una configuración ausente o débil. |
| `CORS_ORIGIN` | `http://localhost:3000` | Origen permitido por CORS. La comparación se hace contra el origen configurado. |
| `DB_STORAGE` | `data/database.sqlite` | Ruta del archivo SQLite. Acepta `:memory:` para una base efímera. |

Archivo de ejemplo: [`backend/.env.example`](./backend/.env.example).

El frontend consume `VITE_API_URL` desde `AuthContext.tsx`; si no se define, usa `http://localhost:4000` en desarrollo.

## 8. Ejecución local

### Terminal 1: backend

```powershell
cd backend
pnpm run dev
```

Para cargar los 100 productos realistas antes de iniciar la API por primera vez:

```powershell
pnpm run seed:products
```

El comando puede repetirse: conserva IDs y stock de los productos existentes, completa los faltantes y valida que el catálogo administrado contenga exactamente 100 registros.

### Terminal 2: frontend

```powershell
cd frontend
pnpm run dev
```

Direcciones:

| Servicio | URL |
|---|---|
| Frontend | <http://localhost:3000> |
| API | <http://localhost:4000> |
| Salud | <http://localhost:4000/api/health> |
| Catálogo JSON | <http://localhost:4000/api/products> |

En Windows, si pnpm no está disponible, ejecuta `corepack enable` y vuelve a abrir la terminal.

## 9. Scripts disponibles

### Backend

| Comando | Descripción |
|---|---|
| `pnpm run dev` | Ejecuta `src/index.ts` con recarga automática mediante `tsx watch`. |
| `pnpm run seed:products` | Sincroniza de forma transaccional los 100 productos del catálogo local. |
| `pnpm run typecheck` | Valida TypeScript sin generar archivos. |
| `pnpm test` | Ejecuta Jest en serie y usa SQLite en memoria. |
| `pnpm run build` | Compila `src` hacia `dist`. |
| `pnpm start` | Ejecuta `dist/index.js`. Requiere un build previo. |

### Frontend

| Comando | Descripción |
|---|---|
| `pnpm run dev` | Inicia Vite en el puerto 3000. |
| `pnpm run typecheck` | Valida TypeScript sin generar archivos. |
| `pnpm test` | Ejecuta Vitest una vez. |
| `pnpm run build` | Valida TypeScript y genera `dist`. |
| `pnpm run preview` | Sirve localmente el build de Vite. |

## 10. Rutas del frontend

| Ruta | Página | Acceso |
|---|---|---|
| `/` | Inicio, categorías, búsqueda y catálogo | Público |
| `/product/:id` | Detalle de producto y selector de cantidad | Público; comprar requiere sesión |
| `/cart` | Carrito y checkout simulado | La página es pública; los datos requieren sesión |
| `/login` | Inicio de sesión | Público |
| `/register` | Registro | Público |
| Cualquier otra | Estado 404 del frontend | Público |

La búsqueda global utiliza el parámetro `q`, por ejemplo `/?q=Producto`.

## 11. API REST

La especificación completa y procesable se encuentra en [`openapi.yaml`](./openapi.yaml).

Resumen de endpoints:

| Método | Ruta | Autenticación | Descripción |
|---|---|---|---|
| `GET` | `/api/health` | No | Estado de la API. |
| `GET` | `/api/products` | No | Lista el catálogo. |
| `GET` | `/api/products/{id}` | No | Obtiene un producto. |
| `POST` | `/api/auth/register` | No | Crea un usuario y devuelve JWT. |
| `POST` | `/api/auth/login` | No | Valida credenciales y devuelve JWT. |
| `GET` | `/api/cart` | Bearer JWT | Consulta el carrito. |
| `POST` | `/api/cart` | Bearer JWT | Añade o acumula un producto. |
| `PUT` | `/api/cart` | Bearer JWT | Reemplaza una cantidad. |
| `DELETE` | `/api/cart/{productId}` | Bearer JWT | Elimina un producto. |
| `POST` | `/api/checkout` | Bearer JWT | Completa el checkout simulado. |
| `POST` | `/api/orders/{orderId}/cancel` | Bearer JWT | Cancela una orden y restaura stock. |

### Autenticación

Registro e inicio de sesión devuelven un token con una vigencia de siete días:

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "username": "demo"
  }
}
```

En rutas protegidas se envía:

```http
Authorization: Bearer <jwt>
```

El frontend conserva el token y el usuario en `localStorage`; el interceptor de Axios añade la cabecera.

## 12. Persistencia y modelo de datos

La base local se guarda en:

```text
backend/data/database.sqlite
```

El archivo está ignorado por Git. En `NODE_ENV=test` el backend usa SQLite en memoria y no modifica la base local.

Sequelize ejecuta `sync()` al iniciar. Si no existen productos, inserta dos registros de demostración.

### Entidades

| Entidad | Campos principales |
|---|---|
| `User` | `id`, `username` único, `passwordHash`, timestamps |
| `Product` | `id`, `title`, `description`, `price`, `stock`, timestamps |
| `CartItem` | `id`, `qty`, `UserId`, `ProductId`, timestamps |
| `Order` | `id`, `status`, `total`, `UserId`, timestamps |
| `OrderItem` | `id`, `qty`, `price`, `OrderId`, `ProductId`, timestamps |

Relaciones:

```text
User    1 ── N Order
User    1 ── N CartItem
Product 1 ── N CartItem
Product 1 ── N OrderItem
Order   1 ── N OrderItem
```

`OrderItem.price` conserva el precio utilizado al crear la orden, aunque el producto cambie después.

## 13. Flujos principales

### Registro e inicio de sesión

1. El frontend envía usuario y contraseña.
2. El backend crea o localiza el usuario.
3. bcrypt genera o compara el hash de contraseña.
4. El backend firma un JWT con `sub`, `username` y expiración de siete días.
5. El frontend guarda sesión y añade el token a las solicitudes protegidas.

### Carrito

1. Un usuario autenticado añade un producto.
2. Si ya existe en el carrito, `POST /api/cart` acumula la cantidad.
3. `PUT /api/cart` reemplaza la cantidad.
4. `DELETE /api/cart/{productId}` elimina el registro y es idempotente.

### Checkout simulado

1. El backend abre una transacción SQLite.
2. Carga el carrito y sus productos.
3. Comprueba el stock y recalcula el total desde la base de datos.
4. Descuenta inventario.
5. Crea una orden con estado `paid` y sus `OrderItem`.
6. Vacía el carrito y confirma la transacción.

No existe integración con tarjetas ni proveedor de pagos.

### Cancelación

`POST /api/orders/{orderId}/cancel` solo opera sobre una orden del usuario autenticado. Restaura inventario, cambia el estado a `cancelled` y devuelve éxito si la orden ya estaba cancelada.

## 14. Pruebas

### Backend

La suite contiene pruebas de integración para:

- Registro e inicio de sesión.
- Checkout, creación de orden y descuento de stock.
- Cancelación y restauración de stock.

### Frontend

La suite verifica:

- Renderizado de productos obtenidos desde la API.
- Filtrado del catálogo a partir de `?q=`.

Validación recomendada antes de confirmar cambios:

```powershell
# Dentro de backend
pnpm run typecheck
pnpm test
pnpm run build

# Dentro de frontend
pnpm run typecheck
pnpm test
pnpm run build
```

## 15. Build y ejecución compilada

### Backend

```powershell
cd backend
pnpm run build
pnpm start
```

### Frontend

```powershell
cd frontend
pnpm run build
pnpm run preview
```

Vite genera el frontend en `frontend/dist`; TypeScript genera el backend en `backend/dist`. Ambos directorios están ignorados por Git.

## 16. Seguridad y limitaciones conocidas

Antes de utilizar el proyecto con usuarios o dinero reales se debe considerar lo siguiente:

- El checkout es simulado y crea órdenes directamente como `paid`.
- `JWT_SECRET` debe gestionarse fuera del repositorio y rotarse con una estrategia operativa.
- El frontend guarda el JWT en `localStorage`, lo que exige una estrategia estricta contra XSS.
- CORS permite el origen configurado en `CORS_ORIGIN`; para despliegues reales debe establecerse explícitamente.
- Las cantidades del carrito se validan como enteros positivos y cada línea está limitada a 100 unidades.
- Los precios y totales usan números de punto flotante; producción debería usar enteros en centavos o un tipo decimal.
- SQLite y `sequelize.sync()` son apropiados para la demo, pero no sustituyen migraciones y una base preparada para concurrencia.
- La API limita las solicitudes generales y aplica un límite más estricto a autenticación; producción debería usar un almacén distribuido para rate limiting.
- No existe recuperación de contraseña, verificación de correo ni rotación de tokens.
- La cancelación serializa solicitudes concurrentes por orden dentro del proceso y usa transacciones; varios procesos requieren una estrategia de coordinación en la base de datos.

Para pagos reales se requiere una pasarela tokenizada, órdenes con estados intermedios, idempotencia, webhooks firmados, reservas de inventario y reembolsos.

## 17. Solución de problemas

### El catálogo no carga

1. Confirma que el backend responde en <http://localhost:4000/api/health>.
2. Revisa que el frontend esté usando el puerto 3000.
3. Consulta los logs del backend.

### El puerto está ocupado

En PowerShell:

```powershell
Get-NetTCPConnection -State Listen | Where-Object LocalPort -in 3000,4000
```

Cierra únicamente el proceso que corresponda al proyecto o configura otro puerto.

### Error de autenticación

- Comprueba que frontend y backend utilicen la misma sesión.
- Revisa la vigencia del JWT.
- Si cambiaste `JWT_SECRET`, los tokens firmados previamente dejan de ser válidos.

### Reiniciar los datos locales

Detén primero el backend. El archivo `backend/data/database.sqlite` contiene todos los usuarios, carritos, órdenes y productos locales. Haz una copia antes de reemplazarlo o eliminarlo.

## 18. Mantenimiento del contrato API

Cuando cambie una ruta, petición, respuesta o código HTTP:

1. Actualiza la implementación y sus pruebas.
2. Actualiza [`openapi.yaml`](./openapi.yaml).
3. Valida el YAML con una herramienta compatible con OpenAPI 3.0.
4. Actualiza esta documentación si cambia un flujo público.

El contrato describe el comportamiento actual; no documenta endpoints de pagos futuros ni validaciones que todavía no estén implementadas.
