FROM node:22-alpine AS build
WORKDIR /app

# sqlite3 solo existe como dependencia de desarrollo para tests e importacion.
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate
RUN chown node:node /app
USER node

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts && pnpm rebuild esbuild sqlite3

COPY --chown=node:node tsconfig.json tsconfig.build.json ./
COPY --chown=node:node src ./src
RUN pnpm run build

FROM node:22-alpine AS production-dependencies
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate
RUN chown node:node /app
USER node
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --chown=node:node package.json ./
COPY --chown=node:node --from=production-dependencies /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist

USER node
EXPOSE 4000
CMD ["node", "dist/index.js"]
