# syntax=docker/dockerfile:1
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

# Build with secrets mounted (secrets are never stored in image layers)
RUN --mount=type=secret,id=NEXT_PUBLIC_FIREBASE_API_KEY \
    --mount=type=secret,id=NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
    --mount=type=secret,id=NEXT_PUBLIC_FIREBASE_DATABASE_URL \
    --mount=type=secret,id=NEXT_PUBLIC_FIREBASE_PROJECT_ID \
    --mount=type=secret,id=NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
    --mount=type=secret,id=NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID \
    --mount=type=secret,id=NEXT_PUBLIC_FIREBASE_APP_ID \
    --mount=type=secret,id=ADMIN_FIREBASE_PROJECT_ID \
    --mount=type=secret,id=ADMIN_FIREBASE_CLIENT_EMAIL \
    --mount=type=secret,id=ADMIN_FIREBASE_PRIVATE_KEY \
    echo "NEXT_PUBLIC_FIREBASE_API_KEY=$(cat /run/secrets/NEXT_PUBLIC_FIREBASE_API_KEY)" > .env.local && \
    echo "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$(cat /run/secrets/NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)" >> .env.local && \
    echo "NEXT_PUBLIC_FIREBASE_DATABASE_URL=$(cat /run/secrets/NEXT_PUBLIC_FIREBASE_DATABASE_URL)" >> .env.local && \
    echo "NEXT_PUBLIC_FIREBASE_PROJECT_ID=$(cat /run/secrets/NEXT_PUBLIC_FIREBASE_PROJECT_ID)" >> .env.local && \
    echo "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$(cat /run/secrets/NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)" >> .env.local && \
    echo "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$(cat /run/secrets/NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)" >> .env.local && \
    echo "NEXT_PUBLIC_FIREBASE_APP_ID=$(cat /run/secrets/NEXT_PUBLIC_FIREBASE_APP_ID)" >> .env.local && \
    echo "ADMIN_FIREBASE_PROJECT_ID=$(cat /run/secrets/ADMIN_FIREBASE_PROJECT_ID)" >> .env.local && \
    echo "ADMIN_FIREBASE_CLIENT_EMAIL=$(cat /run/secrets/ADMIN_FIREBASE_CLIENT_EMAIL)" >> .env.local && \
    echo "ADMIN_FIREBASE_PRIVATE_KEY=$(cat /run/secrets/ADMIN_FIREBASE_PRIVATE_KEY)" >> .env.local && \
    npm run build && \
    rm .env.local

# Clean up devDependencies after build to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start the application in production mode
CMD ["npm", "start"]