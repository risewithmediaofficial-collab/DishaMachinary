# Stage 1: Build Vite / React production bundle
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install all dependencies (including devDependencies required for vite build)
RUN npm ci

# Copy frontend source code
COPY . .

# Build production distribution into /dist
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose container HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
