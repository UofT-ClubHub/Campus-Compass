# CI/CD Pipeline Documentation

## 🔄 Main CI/CD Workflow (`docker-ci.yml`)

### GitHub Actions Trigger Conditions

The GitHub Actions integration and deployment workflow is triggered by:
- **Manual trigger**: `workflow_dispatch` for on-demand deployments
- **Push events**: Automatic triggering on pushes/merges to `main` branch

**GitHub Actions Trigger Configuration:**
```yaml
on:
  workflow_dispatch:
  push:
    branches: [ main ]
```

### Pipeline Stages

### Stage 1: Continuous Integration (CI Pipeline)
---

#### Step 1: Environment Setup and Dependency Management
- Checkout code using actions/checkout@v4 with full git history
- Set up Node.js version 22 with NPM caching
- Install dependencies using `npm ci` for consistent builds
- Prepare build environment

**Customizations:**
- Uses `fetch-depth: 0` for complete git history access
- Caches NPM dependencies using `package-lock.json` path
- Working directory set to `./clubhub-web` for monorepo structure

#### Step 2: Docker Environment Setup
- Configure Docker Buildx for multi-platform builds (linux/amd64)
- Authenticate with Docker Hub using stored credentials
- Generate intelligent version tags based on commit messages and branches

**Version Tagging Strategy:**
- Extracts semantic versions from commit messages for version tagging
- If no semantic version is found, falls back to a timestamp-based version tag
- For every build on the `main` branch, two tags are pushed to Docker Hub:
  - A version tag (e.g., `v1.2.3` or `v2025.01.01-123456`)
  - A branch tag (`main`)
- The `main` branch tag is the one that is pulled during the CD stage

#### Step 3: Docker Image Build and Push
- Build Docker image with secure secret mounting
- Tag the image with both the version tag and the `main` branch tag
- Push both tags to the Docker Hub registry

**Security Features:**
- Uses Docker secrets for sensitive environment variables during build
- All secrets are mounted temporarily and never stored in image layers

### Stage 2: Continuous Deployment (CD Pipeline)
---

#### Step 4: Deployment Preparation
- Determine target branch for deployment
- Set up SSH connectivity to AWS EC2 deployment server
- Create environment configuration files

**EC2 Deployment Infrastructure:**
- Uses AWS EC2 instance for hosting the application
- SSH-based deployment with key authentication
- Blue-green deployment strategy for zero-downtime updates

**Blue-Green Deployment Setup:**
- Creates test container on port 3001 for validation
- Production container runs on port 80
- Enables zero-downtime deployments

#### Step 5: Test Environment Deployment
- Transfer environment variables to EC2 server securely via SCP
- Pull latest Docker image using branch tag
- Deploy test container on EC2
- Set up E2E test dependencies on EC2
- Run E2E tests (explained below)

**EC2 Server Configuration:**
- Target server: `ubuntu@3.16.162.15` (AWS EC2 instance)
- Test port: 3001
- Production port: 80
- Auto-restart policy: `unless-stopped`
- Docker runtime environment

#### Step 6: Production Deployment
- Stop and remove previous production container
- Promote test container to production (if tests pass)
- Retag image as production version
- Verify final deployment status
- **If tests fail:** the old production container remains running, and the test container is deleted

**Container Management:**
- Graceful container shutdown with `|| true` fallbacks
- Image cleanup and retagging for production

## 🔧 Environment Variables

The pipeline uses the following environment variables for build and deployment:

### Firebase Client Configuration (Build-time)
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase API key for client-side authentication
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase authentication domain
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL` - Firebase Realtime Database URL
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project identifier
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase Cloud Storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase Cloud Messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase application identifier

### Firebase Admin Configuration (Runtime)
- `ADMIN_FIREBASE_PROJECT_ID` - Firebase project ID for server-side operations
- `ADMIN_FIREBASE_CLIENT_EMAIL` - Service account email for Firebase Admin SDK
- `ADMIN_FIREBASE_PRIVATE_KEY` - Private key for Firebase Admin SDK authentication

### Deployment Configuration
- `DOCKER_USERNAME` - Docker Hub username for image registry access
- `DOCKER_PASSWORD` - Docker Hub password for authentication
- `DEPLOY_KEY` - SSH private key for server deployment access

**EC2 Environment File Management:**
- The CI/CD pipeline creates a `my_env` file containing all runtime environment variables
- This file is securely transferred to the EC2 instance using SCP
- Docker containers on EC2 use this file with `--env-file ~/my_env` flag
- The environment file is located in the home directory of the EC2 instance

## 🧪 Testing Strategy

### E2E Testing Infrastructure
The pipeline includes automated E2E testing infrastructure using Playwright with comprehensive test categories:

**Test Categories:**
- **Smoke Tests**: Basic navigation and page loading
- **Functionality Tests**: Club search, expandable cards, post filtering  
- **Security Tests**: Access control and authentication flows
- **Responsive Design**: Mobile and desktop viewport testing

**Test Configuration:**
- Multiple browser testing: Chromium, Firefox, WebKit
- Mobile device testing: Pixel 5, iPhone 12
- Failure handling: Screenshots, videos, traces
- Parallel execution with CI optimizations

## 🐳 Docker Configuration

### Dockerfile (`clubhub-web/Dockerfile`)
Multi-stage build process:
1. **Base Setup**: Node.js 22 Alpine with security updates
2. **Dependencies**: Clean install with `npm ci`
3. **Build with Secrets**: Secure mounting of environment variables
4. **Production**: Pruned dependencies and optimized image

### Docker Compose (`docker-compose.yml`)
- Container name: `clubhub-web`
- Port mapping: 3000:3000
- Auto-restart policy
- Runtime environment variables for Firebase admin
