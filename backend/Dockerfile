FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY tsconfig.build.json ./
COPY nest-cli.json ./

RUN npm ci

COPY src ./src

RUN ls -la /app/src || (echo "Source files not found" && exit 1)
RUN test -f /app/src/main.ts || (echo "main.ts not found" && exit 1)

RUN npm run build || (echo "Build failed" && exit 1)

RUN ls -la /app/dist || (echo "Build failed - dist directory not found" && exit 1)
RUN test -f /app/dist/main.js || (echo "Build failed - main.js not found in dist" && ls -la /app/dist && exit 1)

FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN ls -la /app/dist || (echo "Copy failed - dist directory not found" && exit 1)
RUN test -f /app/dist/main.js || (echo "Copy failed - main.js not found" && exit 1)

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]
