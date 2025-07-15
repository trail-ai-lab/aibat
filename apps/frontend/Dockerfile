# 1. Build stage
FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app
COPY . .

# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm build

# 2. Production stage
FROM node:18-alpine
RUN npm install -g pnpm

WORKDIR /app
COPY --from=builder /app ./

EXPOSE 8080
CMD ["pnpm", "start"]
