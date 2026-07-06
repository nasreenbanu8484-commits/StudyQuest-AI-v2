# Render Deployment Guide

This guide details how to build and host **StudyQuest AI** on Render.

---

## ⚠️ Database Persistence Warning (SQLite vs PostgreSQL)

Render services run on ephemeral file systems. If you host the FastAPI application as a standard web service, your SQLite database file (`studyquest.db`) will be deleted every time the service restarts, updates, or scales down.

### Recommended Approaches:
1. **Persistent Disk Mount (SQLite)**:
   Attach a Render Persistent Disk (e.g. 1GB, mount path: `/data`) to your backend service and set `DATABASE_PATH=/data/studyquest.db`.
2. **Production Database Scale**:
   For production clusters, we recommend upgrading to a relational database like Google Cloud SQL or Render PostgreSQL.

---

## 🛠️ 1. Backend FastAPI Service

1. Create a new **Web Service** on Render.
2. Select your repository.
3. Configure settings:
   - **Name**: `studyquest-backend`
   - **Environment**: `Docker`
   - **Docker Command**: (leave default to run CMD defined in Dockerfile)
4. Environment variables to set:
   - `GEMINI_API_KEY`: your_api_key
   - `DATABASE_PATH`: `/data/studyquest.db` (if using disk volume)
   - `ALLOW_ORIGINS`: `https://studyquest-frontend.onrender.com`
5. Disks (optional but recommended):
   - **Mount Path**: `/data`
   - **Size**: `1 GiB`

---

## 📱 2. Frontend Next.js Service

1. Create a new **Web Service** on Render.
2. Select your repository.
3. Configure settings:
   - **Name**: `studyquest-frontend`
   - **Environment**: `Docker`
4. Add the following **Docker Build Arguments**:
   - **Key**: `NEXT_PUBLIC_API_BASE_URL`
   - **Value**: `https://studyquest-backend.onrender.com` (replace with your backend Service URL)
5. Environment variables to set:
   - `PORT`: `3000`

---

## 🩺 3. Health Routes

Render automatically checks health routes during deployments:
- Set Health Check Path to `/health` (backend HTTP port 8000).
- Set Health Check Path to `/` (frontend HTTP port 3000).
