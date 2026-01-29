# Builder: dev + build
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci  # Все deps + devDeps для tsc и миграций
COPY . .
RUN npm run build  # tsc -> dist/main.js

# Runtime: только prod deps + dist
FROM node:24-alpine AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts  # Только runtime: grammy, pg, typeorm и т.д.
COPY --from=builder /app/dist ./dist
# Миграции (опционально, если нужно в контейнере) # Для typeorm-ts-node-commonjs, но лучше запустить отдельно
#COPY --from=builder /app/src/db ./src/db
EXPOSE 3000
# node dist/main.js
CMD ["npm", "start"]
