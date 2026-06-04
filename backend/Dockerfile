FROM oven/bun:1-alpine

WORKDIR /app

# Install dependencies using the committed lockfile for reproducible builds
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy application source
COPY tsconfig.json ./
COPY src ./src

# Directory for the SQLite database (matches the path used in src/lib/escalation-store.ts)
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
