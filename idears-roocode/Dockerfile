# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install app dependencies
RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

# Create data directory and set permissions (if needed, though node user might handle it)
# Docker volumes will manage persistence, but the directory should exist.
# The server.js already creates these directories if they don't exist,
# so this step in Dockerfile might be redundant if app starts before volume mount.
# However, it's good practice for clarity.
RUN mkdir -p /usr/src/app/data/uploads && chown -R node:node /usr/src/app/data

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define the command to run your app
CMD [ "node", "server.js" ]

# Switch to non-root user
USER node