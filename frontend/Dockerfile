# --- Etapa build: genera los estaticos con Vite ---
FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.21.0 --activate
RUN chown node:node /app
USER node

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts && pnpm rebuild esbuild

COPY --chown=node:node . .

# URL publica del backend, inyectada en tiempo de build (Vite la incrusta en el bundle).
# Ej: docker build --build-arg VITE_API_URL=https://mi-backend.up.railway.app
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm run build

# --- Etapa runtime: sirve los estaticos con Nginx ---
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /etc/nginx/conf.d /usr/share/nginx/html /var/cache/nginx /var/run/nginx.pid
USER nginx

EXPOSE 8080
