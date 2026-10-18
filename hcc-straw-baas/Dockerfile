# OPTIONAL: Dockerfile for containerized services
# Use this ONLY for distributed deployments
# Default: npm run dev (uses SQLite locally)

FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

# Set service name from build arg
ARG SERVICE=auth
ENV SERVICE_NAME=${SERVICE}

# Expose dynamic port (3001-3005)
EXPOSE 3001 3002 3003 3004 3005

# Start specific service
CMD ["sh", "-c", "node packages/${SERVICE_NAME}-service/dist/index.js"]
