FROM node:22-alpine

WORKDIR /app

# Update packages for security
RUN apk update && apk upgrade

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Clean up devDependencies after build to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start the application in production mode
CMD ["npm", "start"]