# ── Stage 1: Build Next.js frontend ──────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL=/
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build

# ── Stage 2: Production (Python + Node + nginx) ───────────────
FROM python:3.11-slim AS production
WORKDIR /app

# Install Node.js 20 + nginx
RUN apt-get update && apt-get install -y curl gnupg nginx \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy built Next.js standalone
COPY --from=frontend-builder /frontend/.next/standalone ./frontend/
COPY --from=frontend-builder /frontend/.next/static ./frontend/.next/static
COPY --from=frontend-builder /frontend/public ./frontend/public

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend + ML model
COPY backend/ ./backend/

# nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Start script
COPY start.sh .
RUN chmod +x start.sh

# Cloud Run listens on PORT (default 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["./start.sh"]
