FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite bakes VITE_API_URL into the JS at build time, so it's a build arg, not
# a runtime env var. Override with --build-arg to point at a different
# backend (e.g. --build-arg VITE_API_URL=http://192.168.1.20:5000/api).
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
