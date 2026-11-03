FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# EXPO_PUBLIC_API_URL from .env.production is baked into the bundle here.
RUN npx expo export -p web

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app .
EXPOSE 8081
# Vercel routes to $PORT (default 80); falls back to 8081 for docker-compose.
CMD npx expo serve --port ${PORT:-8081}
