# -- AquaSentinel Frontend — Railway Dockerfile -----------------------------
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build with the Railway backend URL injected
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# -- Production image: serve dist/ with a tiny static server ---------------
FROM node:20-slim AS runner
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
