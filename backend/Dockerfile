FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY src ./src
COPY tsconfig.json ./

# Create data directory for SQLite (volume mounts here in production)
RUN mkdir -p /data

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
