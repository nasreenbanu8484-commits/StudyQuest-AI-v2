# Vercel Deployment Guide

This guide details how to deploy the **StudyQuest AI Frontend (Next.js)** to Vercel and connect it to your backend services.

---

## ⚠️ Split Architecture Model (Vercel + Persistent Host)

Vercel is a stateless, serverless platform optimized for frontend assets and Next.js applications. 
Because StudyQuest AI requires:
1. A persistent database file (`studyquest.db` via SQLite) for study records and spaced revision timelines.
2. A long-running Model Context Protocol (`FastMCP`) tools server.

You **cannot** host the backend FastAPI code on Vercel serverless functions directly. 

### Recommended Architecture:
- **Frontend**: Hosted on **Vercel** (fast edge loading, automated CI/CD).
- **Backend & FastMCP**: Hosted on **Render** (as a persistent docker service with disk mounts), **Fly.io**, or **Google Cloud Run**.

---

## 🛠️ Deploying the Frontend to Vercel

Follow these steps to import and configure the monorepo on Vercel:

### 1. Import Repository
1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New** > **Project**.
3. Import your GitHub repository (`StudyQuest-AI`).

### 2. Configure Monorepo Settings
Vercel needs to know the Next.js application lives in a subdirectory. We have preconfigured `vercel.json` files in both the repository root and the `frontend/` directory to support both deployment methods:

- **Option A (Recommended): Set Root Directory to `frontend`**
  - **Root Directory**: Click **Edit** and select the `frontend` folder (or type `frontend`).
  - This utilizes `frontend/vercel.json` and runs builds inside the isolated frontend subdirectory.
- **Option B: Leave Root Directory as `/` (Repo Root)**
  - This utilizes the root-level `vercel.json` to instruct Vercel to automatically run the install and build commands within the `frontend` subdirectory.

- **Project Name**: `studyquest-ai`
- **Framework Preset**: `Next.js`

### 3. Setup Build Environment Variables
Expand the **Environment Variables** accordion. You must specify the production URL of your backend:
- **Name/Key**: `NEXT_PUBLIC_API_BASE_URL`
- **Value**: `https://your-backend-api.onrender.com` (replace with your active deployed backend domain, without a trailing slash).

> [!NOTE]
> Next.js injects `NEXT_PUBLIC_` environment variables into the JavaScript client bundle during compile/build time. Make sure this variable is set *before* triggering the deployment.

### 4. Deploy
Click the **Deploy** button. Vercel will automatically install dependencies, build the Next.js production bundle, and provision your edge routing.

---

## 🔒 Backend CORS Alignment

For the Vercel frontend to fetch data from your backend service successfully, you must configure the backend's allowed origins to trust the Vercel domain.

Set the following environment variable in your **Backend hosting panel** (e.g. on Render):
- **Key**: `ALLOW_ORIGINS`
- **Value**: `https://studyquest-ai.vercel.app` (replace with your actual deployed Vercel domain, or list multiple comma-separated URLs).

*Note: If `ALLOW_ORIGINS` is left empty or not configured on the backend, it defaults to `*` (allows all origins) which is useful for rapid prototyping but should be narrowed in production.*
