# Pre-alpha waitlist API image.
# CI builds `dist/` first with `pnpm --filter @wni/api build`; this image runs it.
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund --ignore-scripts

FROM node:24-alpine
RUN addgroup -S app && adduser -S -u 10001 -G app app
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY dist ./dist
COPY migrations ./migrations
USER app
EXPOSE 3000
CMD ["node", "dist/server.js"]
