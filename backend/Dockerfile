# --- Etapa build: compila TypeScript y resuelve dependencias nativas ---
FROM node:22-alpine AS build
WORKDIR /app

# python3/make/g++ son necesarios para compilar el binding nativo de sqlite3 (node-gyp)
RUN apk add --no-cache python3 make g++

RUN corepack enable && corepack prepare pnpm@11 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm run build

# --- Etapa runtime: solo lo necesario para ejecutar la app compilada ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@11 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile && \
    apk del python3 make g++

COPY --from=build /app/dist ./dist

EXPOSE 4000
CMD ["node", "dist/index.js"]
