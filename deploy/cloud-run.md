# Google Cloud Run Deployment Guide

This guide details how to build, configure, and deploy the **StudyQuest AI** stack (FastAPI Backend + Next.js Frontend) to Google Cloud Run.

---

## 🏗️ 1. Google Cloud Prerequisites & API Setup

First, make sure the Google Cloud CLI (`gcloud`) is installed and configured:

```bash
# Log in to Google Cloud Account
gcloud auth login

# Set target project
gcloud config set project YOUR_PROJECT_ID
```

Enable the required service APIs:
```bash
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    secretmanager.googleapis.com \
    cloudbuild.googleapis.com
```

---

## 🔒 2. Secret Manager Setup

To run in live Gemini mode, register your API credentials securely:

```bash
# Create the secret key entry
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# Add the secret key value (input your actual key when prompted)
echo -n "your_api_key_here" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
```

---

## 📦 3. Create Artifact Registry Repository

Create a container registry repository to host your Docker images:

```bash
gcloud artifacts repositories create studyquest-repo \
    --repository-format=docker \
    --location=us-central1 \
    --description="Docker images for StudyQuest AI"
```

---

## 🚀 4. Build & Deploy FastAPI Backend

### Build and Push Backend Image
Run the Google Cloud Build submit script:
```bash
gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/studyquest-repo/backend:latest ./backend
```

### Deploy Backend to Cloud Run
```bash
gcloud run deploy studyquest-backend \
    --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/studyquest-repo/backend:latest \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
    --set-env-vars="DATABASE_PATH=/mnt/db/studyquest.db,ALLOW_ORIGINS=*"
```
*Note down the generated **Service URL** (e.g., `https://studyquest-backend-xyz.run.app`). We will need this for the frontend!*

---

## 📱 5. Build & Deploy Next.js Frontend

### Build and Push Frontend Image
Build the frontend passing the backend service URL as a build argument:
```bash
gcloud builds submit \
    --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/studyquest-repo/frontend:latest \
    --build-arg NEXT_PUBLIC_API_BASE_URL=https://studyquest-backend-xyz.run.app \
    ./frontend
```

### Deploy Frontend to Cloud Run
```bash
gcloud run deploy studyquest-frontend \
    --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/studyquest-repo/frontend:latest \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 3000
```

---

## 🩺 6. Verification and Health Checks

To verify that the deployed backend is active and healthy:
```bash
# Test general health endpoint
curl -s https://studyquest-backend-xyz.run.app/health
# Expected Output: {"status": "healthy"}

# Test database readiness endpoint
curl -s https://studyquest-backend-xyz.run.app/ready
# Expected Output: {"status": "ready", "database": "connected"}
```

---

## 🔄 7. Rollbacks & Revisions

If you need to rollback to a previous working version:
```bash
# List previous active revisions
gcloud run revisions list --service=studyquest-backend --region=us-central1

# Route 100% of traffic back to a specific revision
gcloud run services update-traffic studyquest-backend \
    --region=us-central1 \
    --to-revisions=studyquest-backend-00001-xyz=100
```
