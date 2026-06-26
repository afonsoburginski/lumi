FROM oven/bun:1-debian AS deps
WORKDIR /repo
COPY package.json bun.lock bunfig.toml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN bun install --frozen-lockfile

FROM oven/bun:1-debian AS build
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY package.json bun.lock bunfig.toml ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN cd apps/api && bunx prisma generate

FROM oven/bun:1-debian AS runtime
WORKDIR /repo
ENV NODE_ENV=production
ENV PORT=3333
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build /repo /repo
WORKDIR /repo/apps/api
EXPOSE 3333
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run src/index.ts"]
