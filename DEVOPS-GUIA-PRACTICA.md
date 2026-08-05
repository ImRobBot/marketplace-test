# DevOps aplicado a Mercado Uno — Guía práctica por fases

Este documento explica **qué es cada práctica de DevOps, por qué importa, y cómo se implementó concretamente en este repositorio**. Está pensado para aprender haciendo: cada fase tiene teoría breve + los archivos reales que se crearon + cómo verificarlo tú mismo.

Repositorio: `github.com/ImRobBot/marketplace-test`

---

## Índice

1. [Fase 1 — Integración Continua (CI)](#fase-1--integración-continua-ci)
2. [Fase 2 — Quality Gate con SonarCloud](#fase-2--quality-gate-con-sonarcloud)
3. [Fase 3 — Containerización (Dockerfiles + docker-compose)](#fase-3--containerización-dockerfiles--docker-compose)
4. [Fase 4 — Despliegue continuo (CD)](#fase-4--despliegue-continuo-cd)
5. [Fase 5 — Observabilidad básica](#fase-5--observabilidad-básica)
6. [Glosario rápido](#glosario-rápido)

---

## Fase 1 — Integración Continua (CI)

### Teoría

CI (Continuous Integration) significa: **cada vez que alguien sube código, una máquina automatizada lo valida** — sin depender de que un humano recuerde correr los tests antes de mergear. El principio detrás es simple: *detectar errores lo antes posible es exponencialmente más barato que detectarlos en producción*.

Un pipeline de CI típico corre en orden:
1. **Instalar dependencias** (siempre desde el lockfile, nunca "lo que haya" — reproducibilidad).
2. **Lint / typecheck** (errores de sintaxis y tipos, los más baratos de atrapar).
3. **Tests** (unitarios e integración).
4. **Build** (¿compila de verdad?).

Si cualquier paso falla, el pipeline se detiene y el Pull Request queda marcado en rojo — GitHub puede configurarse para **bloquear el merge** hasta que pase.

### Qué se implementó

**Archivo:** [`.github/workflows/ci.yml`](.github/work/) — GitHub Actions es el motor de CI nativo de GitHub: lee este YAML y ejecuta los pasos en una máquina virtual efímera cada vez que hay un `push` o `pull_request`.

Dos jobs paralelos (`backend` y `frontend`), cada uno:
1. Clona el repo (`actions/checkout`).
2. Instala pnpm (ver [[feedback-pnpm-over-npm]] — este proyecto usa pnpm, no npm).
3. Instala dependencias con `pnpm install --frozen-lockfile` (falla si el lockfile no coincide con `package.json`, evita sorpresas).
4. Corre `pnpm run typecheck`.
5. Corre `pnpm run test:coverage`.
6. Sube el reporte de cobertura como *artifact* descargable desde la UI de GitHub Actions.

### Cómo verificarlo tú mismo

```bash
git checkout -b test/ci-pipeline
git commit --allow-empty -m "test: disparar CI"
git push -u origin test/ci-pipeline
```

Abre el repo en GitHub → pestaña **Actions** → verás el workflow corriendo en vivo. Si rompes algo a propósito (p. ej. un `expect(1).toBe(2)` en un test), el job se pone en rojo — así es como un PR real quedaría bloqueado.

### Por qué esto y no otra cosa

- **GitHub Actions** en vez de Jenkins/CircleCI: el repo ya vive en GitHub, así que es gratis, sin infraestructura propia que mantener, y la config vive versionada junto al código.
- **Jobs separados** backend/frontend en vez de uno solo: corren **en paralelo** (más rápido) y un fallo en frontend no oculta el resultado de backend en el log.
- **`--frozen-lockfile`**: sin esto, CI podría "arreglar" silenciosamente un lockfile desactualizado y esconder un bug de dependencias que sí te explotaría en otra máquina.

---

## Fase 2 — Quality Gate con SonarCloud

### Teoría

Un **Quality Gate** es una condición binaria: *"este código no se fusiona si no cumple X estándar"* (cobertura mínima, cero bugs nuevos, cero vulnerabilidades nuevas, deuda técnica bajo cierto umbral). La diferencia con Fase 1 es de **enfoque**: CI valida "¿funciona?"; el Quality Gate valida "¿es código sano a largo plazo?".

SonarQube ya lo tenías corriendo **local** (`sonarqube-local/`). El problema: GitHub Actions corre en una máquina de GitHub en la nube, que no puede alcanzar `localhost:9000` de tu PC. Opciones:
- Exponer tu máquina a internet (tunnels tipo ngrok) — fragil, depende de que tu PC esté encendida.
- Usar **SonarCloud**: la misma tecnología, alojada por SonarSource, **gratis para repositorios públicos** como este.

Se eligió SonarCloud.

### Qué se implementó

1. Un tercer job `sonarcloud` en `.github/workflows/ci.yml`, que corre **después** de que pasen los tests (`needs: [backend, frontend]`), descarga los reportes de cobertura como artifacts de los jobs anteriores, y ejecuta el scan oficial (`sonarsource/sonarqube-scan-action`).
2. `sonar-project.properties` actualizado con `sonar.organization` (requerido por SonarCloud, no por SonarQube self-hosted) y `sonar.host.url=https://sonarcloud.io`.

### Lo que falta que hagas tú (requiere tu cuenta, no lo puedo hacer por ti)

1. Entra a **[sonarcloud.io](https://sonarcloud.io)** → "Log in with GitHub" → autoriza tu usuario/organización.
2. **"+" → Analyze new project"** → selecciona `ImRobBot/marketplace-test`.
3. Elige **"Use existing GitHub Actions workflow"** (ya lo creamos) en vez del wizard automático.
4. SonarCloud te da un **token**. En tu repo de GitHub: `Settings → Secrets and variables → Actions → New repository secret` → nombre `SONAR_TOKEN`, valor el token generado.
5. Anota tu **organization key** (aparece en la URL, ej. `imrobbot`) y reemplázalo en `sonar-project.properties` donde dice `sonar.organization=CAMBIAR_POR_TU_ORG`.
6. Push a cualquier rama → el job `sonarcloud` correrá y en unos minutos verás el Quality Gate en la pestaña **Checks** del PR.

### Por qué esto y no otra cosa

- **SonarCloud sobre exponer el local**: no depende de tu PC encendida ni de abrir puertos a internet (superficie de ataque). Es la ruta recomendada oficialmente por SonarSource para repos en GitHub.
- **`needs: [backend, frontend]`**: el scan de Sonar necesita los reportes de cobertura ya generados; correrlo en paralelo daría cobertura en 0% (el mismo problema que resolvimos manualmente hace unos días, ahora automatizado).
- Sigue existiendo tu **SonarQube local** — es tu entorno de práctica/debug antes de subir; SonarCloud es la validación oficial del pipeline.

---

## Fase 3 — Containerización (Dockerfiles + docker-compose)

### Teoría

Un `Dockerfile` empaqueta la app + todo lo que necesita para correr (runtime de Node, dependencias del sistema) en una imagen inmutable. El beneficio central: **"funciona en mi máquina" deja de ser un problema** — la imagen corre igual en tu laptop, en CI, o en un servidor en la nube.

Usamos **multi-stage builds**: una etapa `build` (con todas las herramientas de compilación, más pesada) genera los artefactos finales, y una etapa `runtime` (mínima) solo copia esos artefactos — la imagen final no carga con TypeScript, node_modules de desarrollo, etc.

### Qué se implementó

| Archivo | Qué hace |
|---|---|
| `backend/Dockerfile` | Build multi-stage: compila TS→JS, instala solo dependencias de producción, corre `node dist/index.js` |
| `backend/.dockerignore` | Evita copiar `node_modules`, `.env`, la base de datos local, etc. dentro de la imagen |
| `frontend/Dockerfile` | Build multi-stage: `vite build` genera estáticos, se sirven con Nginx |
| `frontend/nginx.conf` | Configura Nginx para servir una SPA (redirige rutas desconocidas a `index.html`, necesario para React Router) |
| `frontend/.dockerignore` | Igual que el de backend |
| `docker-compose.yml` (raíz del proyecto) | Levanta backend + frontend juntos con un solo comando |

### Cómo verificarlo tú mismo

```bash
cd "d:\Documentos\FULLSTACK DEVELOPER\marketplace-test"
docker compose up --build
```

Backend en `http://localhost:4000`, frontend en `http://localhost:3000` — igual que con `pnpm run dev`, pero sin instalar Node ni pnpm en la máquina que lo corre.

### Por qué esto y no otra cosa

- **Multi-stage sobre una sola etapa**: sin esto, la imagen final incluiría TypeScript, ts-jest, y todo `devDependencies` — más pesada y con más superficie de ataque en producción sin ninguna ventaja.
- **Nginx para el frontend sobre `vite preview`**: `vite preview` es para verificar el build localmente, no está pensado para servir tráfico real; Nginx es el estándar para servir estáticos.
- **`node:20-alpine`**: imágenes Alpine son ~5x más chicas que las basadas en Debian; el costo (necesitar `python3 make g++` para compilar el binding nativo de `sqlite3`) ya lo resolvimos en la fase de pnpm — el `pnpm-workspace.yaml` con `allowBuilds` viaja con el código, así que el Dockerfile lo hereda automáticamente.

---

## Fase 4 — Despliegue continuo (CD)

### Teoría

CD es el paso natural después de Fase 3: si ya tienes una imagen Docker reproducible, el siguiente paso es que **cada merge a `main` la construya y la publique automáticamente**, sin que nadie ejecute comandos a mano en un servidor.

Un pipeline de CD típico:
1. CI pasa (Fases 1 y 2) ✅
2. Se construye la imagen Docker (Fase 3, ya lista) ✅
3. Se sube a un registro de imágenes (Docker Hub, GitHub Container Registry)
4. La plataforma de hosting detecta la nueva imagen y la despliega

### Estado actual: preparado, no activado

Por decisión explícita (para no crear cuentas/secrets externos sin que tú lo decidas), **esta fase queda documentada pero sin implementar**. Ya tienes la pieza más importante lista: los Dockerfiles de Fase 3 son exactamente lo que cualquier plataforma de este tipo necesita.

Cuando quieras activarla, el patrón es el mismo sin importar la plataforma:

```yaml
# Ejemplo conceptual — job adicional en ci.yml, activado solo en main
deploy:
  needs: [backend, frontend, sonarcloud]
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - # build + push de la imagen, o trigger de deploy de la plataforma elegida
```

**Opciones más razonables para este tamaño de proyecto** (evitar Kubernetes — sería sobre-ingeniería para una demo):
- **Railway**: detecta el Dockerfile automáticamente, deploy con un clic conectando el repo, tier gratuito.
- **Render**: similar, con auto-sleep en el tier gratuito (la app "duerme" sin tráfico y tarda unos segundos en despertar).

Cuando elijas una, el trabajo pendiente es: crear cuenta → conectar el repo → la plataforma misma suele generar su propio paso de CI/CD (a veces reemplazando la necesidad de un job manual en `ci.yml`).

---

## Fase 5 — Observabilidad básica

### Teoría

"Observabilidad" es poder responder *"¿qué está pasando ahora mismo / qué pasó?"* sin tener que adivinar o reproducir el problema. El mínimo viable:
- **Logs estructurados** (JSON, no texto libre) — se pueden buscar, filtrar y alimentar a herramientas como Datadog/Grafana después.
- **Healthcheck** — un endpoint que confirma que el servicio está vivo (ya existía: `/api/health`).

### Qué se implementó

Se reemplazó `console.log`/`console.error` (texto plano, no parseable) por **`pino`**, un logger JSON de alto rendimiento muy usado en el ecosistema Node/Express:

```json
{"level":30,"time":1785...,"msg":"Server listening on port 4000"}
```

- `backend/src/logger.ts` — instancia central del logger.
- `backend/src/index.ts` — usa el logger en vez de `console.log`.
- `backend/src/app.ts` — middleware `pino-http` registra cada request (método, ruta, status, duración) automáticamente.

### Por qué esto y no otra cosa

- **JSON sobre texto libre**: en un entorno real (Docker, la nube), los logs se centralizan y se buscan por campo (`status:500`, `path:/api/checkout`) — texto libre no permite eso.
- **pino sobre winston/morgan por separado**: pino es notablemente más rápido (benchmark propio de la librería y ampliamente citado en la comunidad Node) y `pino-http` da logging de requests HTTP gratis con una línea, sin reinventar el middleware.
- No se agregó una plataforma externa de monitoreo (Datadog, etc.) porque **no hay nada desplegado aún** (Fase 4 pendiente) — no tiene sentido pagar/configurar observabilidad de producción para un proceso que solo corre en tu laptop.

---

## Glosario rápido

| Término | Significado en una línea |
|---|---|
| **CI** | Validar automáticamente cada cambio antes de fusionarlo |
| **CD** | Publicar automáticamente el código ya validado |
| **Pipeline** | La secuencia de pasos automatizados (lint → test → build → deploy) |
| **Quality Gate** | Regla binaria que bloquea el pipeline si el código no cumple un estándar |
| **Multi-stage build** | Un Dockerfile con varias etapas; solo la última termina en la imagen final |
| **IaC** | Definir infraestructura en archivos versionados en vez de clics manuales |
| **Observabilidad** | Poder diagnosticar el sistema sin adivinar, vía logs/métricas/traces |
| **Artifact** (en CI) | Un archivo que un job genera y otro job (o un humano) puede descargar después |
