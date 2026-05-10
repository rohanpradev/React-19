# syntax=docker/dockerfile:1

FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS build
COPY . .
RUN bun run check
RUN bun run typecheck
RUN bun run build

FROM base AS production-deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM base AS release
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_FILE_NAME=/data/mydb.sqlite

COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/public ./public
COPY --from=build /app/src ./src
COPY --from=build /app/styles ./styles
COPY --from=build /app/bunfig.toml ./bunfig.toml
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/tsconfig.json ./tsconfig.json

RUN mkdir -p /data && chown -R bun:bun /app /data

USER bun
EXPOSE 3000/tcp

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
	CMD bun -e "fetch('http://127.0.0.1:3000/robots.txt').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "src/index.ts"]
