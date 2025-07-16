# 1. Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

COPY . .

# Disable ESLint during build
ENV NEXT_DISABLE_ESLINT=1

RUN pnpm install --frozen-lockfile
RUN pnpm build

# 2. Production stage
FROM node:18-alpine

WORKDIR /app
RUN npm install -g pnpm

COPY --from=builder /app ./

EXPOSE 8080
ENV PORT=8080

CMD ["pnpm", "start"]
