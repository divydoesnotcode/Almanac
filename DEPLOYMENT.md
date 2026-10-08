# 🚀 100% Free Production Deployment Guide
### The The Almanac — Full-Stack Live Deployment Manual

This guide walks through deploying the entire **The The Almanac** stack for **$0 / month** using free-tier services:

```
┌─────────────────────────┐      HTTPS / REST      ┌─────────────────────────┐     SSL (psycopg3)    ┌─────────────────────────┐
│         VERCEL          │ ─────────────────────► │         RENDER          │ ────────────────────► │        SUPABASE         │
│  Next.js 16 (Frontend)  │                        │  FastAPI (Backend API)  │                       │ PostgreSQL 16 (Database)│
│       FREE TIER         │                        │        FREE TIER        │                       │        FREE TIER        │
└─────────────────────────┘                        └─────────────────────────┘                       └─────────────────────────┘
                                                                ▲
                                            Ping every 14m      │
                                                   ┌────────────┴────────────┐
                                                   │       UPTIMEROBOT       │
                                                   │  Free Ping / Keep-Alive │
                                                   └─────────────────────────┘
```

---

## 📋 Free Tier Architecture Summary

| Layer | Service | Free Tier Limits | Role |
| :--- | :--- | :--- | :--- |
| **Database** | [**Supabase**](https://supabase.com) | 500 MB storage, PostgreSQL 16, SSL | Holds users, accounts, ledger transactions, categories, budgets, goals |
| **Backend API** | [**Render**](https://render.com) | 750 free instance hours/month, 512MB RAM | Runs FastAPI, Uvicorn, SQLAlchemy calculations, reports engine |
| **Frontend UI** | [**Vercel**](https://vercel.com) | Unlimited deployments, 100GB bandwidth | Serves Next.js 16, SSR/CSR, brutalist UI, and charts |
| **Keep-Alive** | [**UptimeRobot**](https://uptimerobot.com) | 50 free monitors (5-min interval) | Pings `GET /health` to prevent Render free instance sleeping |

---

## 🗄️ Step 1: Create Free PostgreSQL Database on Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New Project**:
   - **Project Name**: `personal-cfo`
   - **Database Password**: Generate a strong password (save this securely).
   - **Region**: Choose the region closest to you (e.g., `AWS - Singapore` or `AWS - Mumbai` or `AWS - Frankfurt`).
   - **Pricing Plan**: Free.
3. **Get Your Connection String (2 Ways in Supabase UI)**:
   - **Method A (Fastest — New UI)**: At the very top of your project dashboard, click the **"Connect"** button in the top navigation bar. In the modal, select **URI** (or the **SQLAlchemy / Python** tab), and choose **Session Pooler** (port `6543`).
   - **Method B (Settings Page)**: Click the **Gear icon (⚙️ Project Settings)** in the bottom-left sidebar ➔ Click **Database** (under *Configuration*) ➔ Scroll down to the **Connection String** section ➔ Select the **URI** tab.

4. Construct your `DATABASE_URL` using the **`postgresql+psycopg://`** protocol scheme required by SQLAlchemy & psycopg 3:

```text
postgresql+psycopg://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

> [!TIP]
> Make sure to replace `[YOUR-PROJECT-REF]`, `[YOUR-PASSWORD]`, and `[REGION]` with your actual Supabase database credentials. Note the port `6543` for connection pooling and `?sslmode=require`.

---

## ⚙️ Step 2: Deploy Backend API on Render

Render provides free Python hosting with automatic Git deploys and public HTTPS URLs.

### 1. Create Web Service on Render
1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New +** ➔ Select **Web Service**.
3. Select your repository: `ai-personal-CFO`.

### 2. Configure Service Settings
- **Name**: `ai-personal-cfo-api` (or your custom name)
- **Region**: Same region or closest to your Supabase DB.
- **Branch**: `main`
- **Runtime**: **Python 3**
- **Root Directory**: Leave blank (root of repo)
- **Build Command**:
  ```bash
  pip install --upgrade pip && pip install -r requirements.txt && alembic upgrade head
  ```
  *(This automatically installs dependencies and runs database migrations on every deploy!)*
- **Start Command**:
  ```bash
  uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
  ```
- **Instance Type**: **Free**

### 3. Add Environment Variables
Click **Advanced** ➔ **Add Environment Variable**:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql+psycopg://postgres.xxx:pass@aws-0-xxx.pooler.supabase.com:6543/postgres?sslmode=require` | Your Supabase connection string from Step 1 |
| `SECRET_KEY` | *(Generate a 48-character random string)* | Run `python3 -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `ENVIRONMENT` | `production` | Enables production mode |
| `DEBUG` | `False` | Disables verbose debug logging |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Ephemeral access token expiry |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh cookie lifespan |
| `CORS_ORIGINS` | `["https://your-frontend-app.vercel.app","http://localhost:3000"]` | Update with your actual Vercel domain once created in Step 3 |

4. Click **Create Web Service**.
5. Wait for the build logs to show:
   ```text
   Running migration 0001_initial_financial_schema ...
   Running migration 0002_user_auth_fields ...
   Running migration 0003_budgets_and_system_categories ...
   Running migration 0004_user_preferences_and_sessions ...
   Running migration 0005_add_refresh_token_to_sessions ...
   Application startup complete.
   Uvicorn running on http://0.0.0.0:10000
   ```
6. Copy your public API URL: `https://ai-personal-cfo-api.onrender.com`.
7. Test the health endpoint in your browser: `https://ai-personal-cfo-api.onrender.com/health` ➔ should return `{"status":"healthy", "database":"connected"}`.

---

## 🎨 Step 3: Deploy Frontend on Vercel

Vercel provides free, high-performance Next.js hosting.

### 1. Import Project on Vercel
1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** ➔ **Project**.
3. Select your `ai-personal-CFO` repository and click **Import**.

### 2. Configure Project Settings
- **Framework Preset**: `Next.js`
- **Root Directory**: Click **Edit** and select `frontend`.
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)

### 3. Add Frontend Environment Variable
Expand **Environment Variables** and add:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://ai-personal-cfo-api.onrender.com` |

*(Replace with your actual Render API URL from Step 2)*

4. Click **Deploy**.
5. In ~60 seconds, Vercel will give you a live production URL (e.g. `https://ai-personal-cfo.vercel.app`).

### 4. Update Backend CORS Origin
Return to **Render** ➔ `ai-personal-cfo-api` ➔ **Environment**:
Update `CORS_ORIGINS` to include your new Vercel domain:
```json
["https://ai-personal-cfo.vercel.app"]
```
Render will automatically re-deploy with the new CORS origin.

---

## ⏰ Step 4: Prevent Render Cold Starts (Free Keep-Alive Ping)

Render's free tier puts backend instances to sleep after 15 minutes of inactivity (causing a 30–50s cold start on the next request). You can keep your backend warm and responsive 24/7 for **100% free**:

1. Go to [uptimerobot.com](https://uptimerobot.com) and create a free account.
2. Click **Add New Monitor**:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `Personal CFO Backend Keepalive`
   - **URL / IP**: `https://ai-personal-cfo-api.onrender.com/health`
   - **Monitoring Interval**: Every `5 minutes` or `10 minutes`
3. Click **Create Monitor**.

Your backend API is now permanently kept warm, responsive, and available 24/7!

---

## 🔍 Step 5: Post-Deployment Verification Checklist

Verify all features are working seamlessly in your live production deployment:

- [ ] **Sign Up**: Navigate to `https://ai-personal-cfo.vercel.app/signup`, create an account, and verify you are redirected to the Dashboard.
- [ ] **Session & Cookies**: Open browser Developer Tools ➔ Application ➔ Cookies. Check that `cfo_refresh_token` and `cfo_access_token` are set.
- [ ] **Database Persistence**: Open Supabase ➔ **Table Editor** ➔ Check `users` table to confirm your new user row exists.
- [ ] **Ledger Transactions**: Go to `/transactions`, create an income and expense record, and verify your account balance updates.
- [ ] **Budgets & Goals**: Create a budget and milestone goal. Test the **Edit** and **Delete** actions.
- [ ] **Reports Suite**: Open `/reports` ➔ View your **Monthly Statement (P&L)** and test **Print / Save as PDF**.
- [ ] **Data Export**: Open `/settings?tab=data` ➔ Click **Download Transactions (CSV)** and **Download Full Ledger (JSON)** to verify data portability.

---

## 🛠️ Alternative Free Platforms (If Desired)

If you prefer alternatives to Render or Supabase, these services also support 100% free tiers:

| Component | Alternative Service | Setup Notes |
| :--- | :--- | :--- |
| **Backend API** | [**Koyeb**](https://www.koyeb.com) | Free nano instance with 512MB RAM, no cold-sleep behavior, runs Docker/Python natively. |
| **Backend API** | [**Railway**](https://railway.app) | $5 free trial credit, instant GitHub build. |
| **Database** | [**Neon.tech**](https://neon.tech) | Free serverless PostgreSQL 16 database with instant branching. |
| **Database** | [**Aiven**](https://aiven.io) | Free 1 CPU / 1GB RAM managed PostgreSQL database. |

---

## ❓ Troubleshooting & FAQs

### 1. Database Connection Timeout on Render
- **Symptom**: `OperationalError: connection to server at aws-0-xxx.pooler.supabase.com failed`.
- **Fix**: Verify your Supabase URL uses port `6543` (transaction pooler) and contains `?sslmode=require`. Ensure your password does not contain unencoded special characters (`@`, `:`, `/` should be URL-encoded).

### 2. CORS Error (`403 Forbidden` / Blocked by CORS policy)
- **Symptom**: Frontend console shows `CORS header 'Access-Control-Allow-Origin' missing`.
- **Fix**: Check that `CORS_ORIGINS` on Render contains your exact Vercel URL with `https://` and without trailing slashes.

### 3. Alembic Migration Failed on Build
- **Symptom**: Build logs show `alembic.util.exc.CommandError: Can't locate revision`.
- **Fix**: Ensure your `alembic.ini` and `alembic/` migration directory are committed to GitHub.

---

<div align="center">

<code>CFO // DEPLOYMENT-SYSTEM</code> &nbsp;&nbsp;·&nbsp;&nbsp; <b>Live & Sovereign on Free Cloud Tiers.</b>

</div>
