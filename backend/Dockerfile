FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json ./
RUN bun install

COPY src ./src
COPY tsconfig.json ./

RUN mkdir -p /data

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
