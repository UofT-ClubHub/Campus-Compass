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

# Create a minimal .env file for build
RUN echo "NEXT_PUBLIC_FIREBASE_API_KEY=build_placeholder" > .env.local && \
    echo "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=build_placeholder" >> .env.local && \
    echo "NEXT_PUBLIC_FIREBASE_DATABASE_URL=build_placeholder" >> .env.local && \
    echo "NEXT_PUBLIC_FIREBASE_PROJECT_ID=build_placeholder" >> .env.local && \
    echo "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=build_placeholder" >> .env.local && \
    echo "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=build_placeholder" >> .env.local && \
    echo "NEXT_PUBLIC_FIREBASE_APP_ID=build_placeholder" >> .env.local

# Build the application with placeholder values
RUN npm run build

# Remove the placeholder .env file
RUN rm .env.local

# Clean up devDependencies after build to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start the application in production mode
CMD ["npm", "start"]