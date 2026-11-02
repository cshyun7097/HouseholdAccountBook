FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx expo export -p web

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app .
EXPOSE 8081
CMD ["npx", "expo", "serve", "--port", "8081"]
