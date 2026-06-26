FROM oven/bun:1-debian AS build
WORKDIR /repo
ENV NODE_ENV=production

COPY package.json bun.lock bunfig.toml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN bun install --frozen-lockfile --ignore-scripts

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN cd apps/api && bunx prisma generate

FROM oven/bun:1-debian AS runtime
WORKDIR /repo
ENV NODE_ENV=production
ENV PORT=3333
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates wget && rm -rf /var/lib/apt/lists/*

COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/package.json /repo/bun.lock /repo/bunfig.toml ./
COPY --from=build /repo/packages ./packages
COPY --from=build /repo/apps/api ./apps/api

WORKDIR /repo/apps/api
EXPOSE 3333
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run src/index.ts"]
