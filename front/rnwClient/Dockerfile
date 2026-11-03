FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# EXPO_PUBLIC_API_URL (from .env locally, or the host's build env var / build arg) is baked into the bundle here.
ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
RUN npx expo export -p web

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app .
EXPOSE 8081
CMD ["npx", "expo", "serve", "--port", "8081"]
