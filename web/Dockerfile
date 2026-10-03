# Stage 1: build the static files with Node.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_MEDIA_BASE_URL=http://localhost:8081
ENV VITE_MEDIA_BASE_URL=$VITE_MEDIA_BASE_URL
RUN npm run build

# Stage 2: serve them with nginx. Node and the source code are left behind.
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
