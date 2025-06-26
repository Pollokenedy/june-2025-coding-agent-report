# Dockerfile for Idea Collector App (Node.js backend)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy backend code
COPY backend/package*.json ./backend/
COPY backend ./backend

# Install backend dependencies
WORKDIR /app/backend
RUN npm install --production

# Create uploads directory for persistent storage
RUN mkdir -p /app/uploads

# Expose backend port
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]
