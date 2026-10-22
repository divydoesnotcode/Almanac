<div align="center">

```
  ██████╗ ███████╗██████╗ ███████╗ ██████╗ ███╗   ██╗ █████╗ ██╗         ██████╗███████╗ ██████╗ 
  ██╔══██╗██╔════╝██╔══██╗██╔════╝██╔═══██╗████╗  ██║██╔══██╗██║        ██╔════╝██╔════╝██╔═══██╗
  ██████╔╝█████╗  ██████╔╝███████╗██║   ██║██╔██╗ ██║███████║██║  █████╗██║     █████╗  ██║   ██║
  ██╔═══╝ ██╔══╝  ██╔══██╗╚════██║██║   ██║██║╚██╗██║██╔══██║██║  ╚════╝██║     ██╔══╝  ██║   ██║
  ██║     ███████╗██║  ██║███████║╚██████╔╝██║ ╚████║██║  ██║███████╗    ╚██████╗██║     ╚██████╔╝
  ╚═╝     ╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝     ╚═════╝╚═╝      ╚═════╝ 
```

<p align="center">
  <code>CFO // CORE-KERNEL</code> &nbsp;&nbsp;·&nbsp;&nbsp; <code>DOUBLE-ENTRY / INR</code> &nbsp;&nbsp;·&nbsp;&nbsp; <code>SYSTEM RELEASE 0.3.0</code>
</p>

# The Almanac
### Autonomous Financial Intelligence, Ledger Governance & Cashflow Telemetry

<p align="center">
  <img src="https://img.shields.io/badge/BUILD-PASSING-c45c26?style=for-the-badge&logo=githubactions&logoColor=efeae1&labelColor=0b0b0a" alt="Build Passing" />
  <img src="https://img.shields.io/badge/STATUS-OPERATIONAL-c45c26?style=for-the-badge&logoColor=efeae1&labelColor=0b0b0a" alt="System Live" />
  <img src="https://img.shields.io/badge/ENGINE-PYTHON_3.14-0b0b0a?style=for-the-badge&logo=python&logoColor=c45c26" alt="Python 3.14" />
  <img src="https://img.shields.io/badge/UI-NEXT.JS_16-0b0b0a?style=for-the-badge&logo=nextdotjs&logoColor=efeae1" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/DB-POSTGRESQL_16-0b0b0a?style=for-the-badge&logo=postgresql&logoColor=c45c26" alt="PostgreSQL 16" />
  <img src="https://img.shields.io/badge/CURRENCY-INR_(₹)-c45c26?style=for-the-badge&labelColor=0b0b0a" alt="Currency INR" />
</p>

<p align="center">
  <b>High-precision financial intelligence engine for individuals and founders.</b><br>
  Guided onboarding setup · Multi-account double-entry ledger · Real-time net worth synthesis · P&L & Balance Sheet generation · Burn & Leak telemetry.
</p>

---

</div>

<br>

## ⚡ Live Telemetry & Build Matrix

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  LIVE SYSTEM STATUS :: ALL CORES ACTIVE                                                [ ◉ TELEMETRY ] │
├───────────────────────────────┬────────────┬─────────────┬─────────────────────────────────────────────┤
│ SUBSYSTEM                     │ STABILITY  │ HEALTH      │ ACTIVE CAPABILITIES                         │
├───────────────────────────────┼────────────┼─────────────┼─────────────────────────────────────────────┤
│ ◈ Authentication & Session    │ 100% LIVE  │ 🟢 RESILIENT │ Dual storage, cross-domain refresh grace    │
│ ◈ Guided Onboarding Workflow  │ 100% LIVE  │ 🟢 RESILIENT │ 5-Step setup: accounts, goals, preferences  │
│ ◈ Ledger & Account Kernel     │ 100% LIVE  │ 🟢 RESILIENT │ Full CRUD, Balance tracking, INR decimal    │
│ ◈ Account Management Hub      │ 100% LIVE  │ 🟢 RESILIENT │ Settings tab & dedicated account panel      │
│ ◈ Dashboard Telemetry         │ 100% LIVE  │ 🟢 RESILIENT │ Net worth, Cashflow 7D-1Y, Burn, Health     │
│ ◈ Budgets & Monthly Limits    │ 100% LIVE  │ 🟢 RESILIENT │ Category caps, Real-time pace, Edit/Delete  │
│ ◈ Goals & Milestone Engine    │ 100% LIVE  │ 🟢 RESILIENT │ Priority goals, Target dates, Edit/Delete   │
│ ◈ Investment & Holdings Hub   │ 100% LIVE  │ 🟢 RESILIENT │ Asset allocation slices, Edit/Delete        │
│ ◈ Debt & Liability Engine     │ 100% LIVE  │ 🟢 RESILIENT │ Loan tracking, Outstanding balance, Actions │
│ ◈ Formal Reports Suite        │ 100% LIVE  │ 🟢 RESILIENT │ P&L, MoM Compare, Tax Audit, Leaks, PDF     │
│ ◈ Settings & Data Portability │ 100% LIVE  │ 🟢 RESILIENT │ Accounts, Category CRUD, CSV/JSON Export    │
│ ◈ Conversational AI CFO       │ 65% QUEUED │ ⚪ IN PROGRESS│ Agent dispatcher & contextual ledger RAG    │
│ ◈ ML Forecasts & Scenarios    │ 40% QUEUED │ ⚪ SCHEDULED  │ Cashflow burn predictive modeling           │
└───────────────────────────────┴────────────┴─────────────┴─────────────────────────────────────────────┘
```

<br>

### 🟢 Module Build Status

| Subsystem | Endpoint / Surface | Build Status | Description |
| :--- | :--- | :---: | :--- |
| **Authentication** | `/api/auth/*` | <img src="https://img.shields.io/badge/●_LIVE-c45c26?style=flat-square&labelColor=0b0b0a"> | Argon2 password hashing, rotating refresh tokens with 30s grace window, Firebase OAuth, Google SMTP reset |
| **Guided Onboarding** | `/onboarding`, `/api/onboarding/*`, `/api/getting-started/*` | <img src="https://img.shields.io/badge/●_LIVE-c45c26?style=flat-square&labelColor=0b0b0a"> | 5-Step interactive wizard: Account setup, Income baseline, Monthly budget caps, Milestone goals, and Financial preferences |
| **Command Center** | `/dashboard`, `/api/dashboard` | <img src="https://img.shields.io/badge/●_LIVE-c45c26?style=flat-square&labelColor=0b0b0a"> | 7D/30D/3M/6M/1Y cashflow charts, Financial Health score (0-100), net worth delta, instant action prompts |
| **Account Management** | `/settings?tab=accounts`, `/accounts`, `/api/accounts/*` | <img src="https://img.shields.io/badge/●_LIVE-c45c26?style=flat-square&labelColor=0b0b0a"> | Manage bank accounts, credit cards, investments, and loans created during or after onboarding |
| **Transactions Engine** | `/transactions`, `/api/transactions/*` | <img src="https://img.shields.io/badge/●_LIVE-c45c26?style=flat-square&labelColor=0b0b0a"> | Income, Expense, Transfer, Pending movements, category tagging, account balance auto-adjustment |
| **Budget Control** | `/budgets`, `/api/budgets/*` | <img src="https://img.shields.io/badge/●_LIVE-c45c26?style=flat-square&labelColor=0b0b0a"> | Category monthly limit tracking, budget utilization gauges, right-aligned Edit & Delete actions |
| **Goal Tracker** | `/goals`, `/api/goals/*` | <img src="https://img.shields.io/badge/●_LIVE-c45c26?style=flat-square&labelColor=0b0b0a"> | Milestone targets, priority badges, progress bars, interactive Goal Edit and Delete modals |
| **Investments Hub** | `/investments` | <img src="https://img.shields.io/badge/●_LIVE-c45c26?style=flat-square&labelColor=0b0b0a"> | Portfolio asset breakdown, gain/loss indicators, account management with full CRUD |
| **Debt & Liabilities** | `/debt` | <img src="https://img.shields.io/badge/●_LIVE-c45c26?style=flat-square&labelColor=0b0b0a"> | Credit cards, personal/home loans, interest tracking, paydown cards with Edit & Delete |
| **Financial Reports** | `/reports` | <img src="https://img.shields.io/badge/●_LIVE-c45c26?style=flat-square&labelColor=0b0b0a"> | **4 Core Reports**: Monthly Statement (P&L + Balance Sheet + PDF Print), Historical Comparison, Tax Audit, Lifestyle Leak Detection |
| **Settings & Security** | `/settings`, `/api/profile`, `/api/settings`, `/api/preferences`, `/api/security/*` | <img src="https://img.shields.io/badge/●_LIVE-c45c26?style=flat-square&labelColor=0b0b0a"> | Manage Profile, Category CRUD, Financial Policy limits, Workspace UI density, Active Session Security manager |
| **Data Portability** | `/settings?tab=data` | <img src="https://img.shields.io/badge/●_LIVE-c45c26?style=flat-square&labelColor=0b0b0a"> | 1-Click CSV transaction exporter, Complete Ledger JSON full-fidelity backup |
| **AI Co-Pilot** | `/cfo` | <img src="https://img.shields.io/badge/◌_IN_FLIGHT-5c5850?style=flat-square&labelColor=0b0b0a"> | In-app CFO conversation drawer, RAG tool integration with live PostgreSQL ledger |

---

## 01 / System Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               NEXT.JS 16 CLIENT RUNTIME                                │
│   React 19  ·  Tailwind CSS 4  ·  Recharts  ·  Lucide Icons  ·  Brutalist Theme System │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTP / REST (Axios + Dual Storage & Cookie Auth)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               FASTAPI ASYNC BACKEND ENGINE                             │
│       Uvicorn  ·  Pydantic v2  ·  Argon2 Security  ·  Automated Financial Services    │
├──────────────────────┬──────────────────────┬───────────────────┬──────────────────────┤
│  Ledger Engine       │  Dashboard Service   │  Reports Pipeline │  Auth & Sessions     │
│  - Account Balances  │  - Net Worth Delta   │  - Monthly P&L    │  - JWT Verification  │
│  - Double-entry Post │  - Cashflow Trends   │  - MoM Comparison │  - Device Revocation │
│  - Category CRUD     │  - Health Score (100)│  - Tax Deductions │  - Grace Rotation    │
│  - Goals & Budgets   │  - AI Next Moves     │  - Leak Detection │  - Cross-Origin Auth │
└──────────────────────┴──────────────────────┴───────────────────┴──────────────────────┘
                                            │ Async SQLAlchemy 2.0 / psycopg3
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               POSTGRESQL 16 LEDGER STORE                               │
│  Users  ·  UserPreferences  ·  Accounts  ·  Transactions  ·  Categories  ·  Goals      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Entity Relational Model

```mermaid
erDiagram
    USERS ||--o{ ACCOUNTS : "owns"
    USERS ||--o{ TRANSACTIONS : "records"
    USERS ||--o{ CATEGORIES : "customizes"
    USERS ||--o{ FINANCIAL_GOALS : "targets"
    USERS ||--o{ BUDGETS : "allocates"
    USERS ||--|| USER_PREFERENCES : "configures"
    USERS ||--o{ USER_SESSIONS : "authenticates"
    ACCOUNTS ||--o{ TRANSACTIONS : "holds"
    CATEGORIES ||--o{ TRANSACTIONS : "classifies"
    CATEGORIES ||--o{ BUDGETS : "limits"
```

---

## 02 / Key Capabilities & Feature Surface

### 🚀 Guided Onboarding & Account Orchestration
* **5-Step Interactive Setup**: Fast-tracks new users through Initial Accounts setup (Bank, Cards, Cash, Investments), Income baseline, Monthly budget caps, Milestone goals, and Financial preferences.
* **Onboarding Enforcement Guard**: Prevents premature dashboard routing until initial configuration is complete.
* **Accounts Management Hub**: Manage, edit, and create additional accounts post-onboarding directly inside `/settings?tab=accounts` or via the workspace navigation.

### 📊 Real-Time Command Center
* **Net Worth & Liquid Cash Position**: Dynamic computation aggregating bank accounts, cash reserves, investment portfolios, minus active loans and credit obligations.
* **Cashflow Velocity**: Filterable 7-day, 30-day, 3-month, 6-month, and 1-year inflow vs. outflow trajectory charts.
* **Financial Health Index**: Algorithmic 0–100 financial health grading with actionable improvement recommendations.

### 📑 Comprehensive Financial Reports Suite
* **Monthly Statement (P&L & Balance Sheet)**: Formal executive financial statement detailing Gross Inflows, Operating Outflows, Net Monthly Surplus/Deficit, Asset Distribution, and Liabilities. Built-in **Print / Save as PDF** capability.
* **Multi-Period Historical Comparison**: Side-by-side performance matrix comparing current month against Prior Month, 3-Month Average, 6-Month Average, and 12-Month Average with exact percentage variance indicators.
* **Tax & Deductions Audit**: Automated deduction tracker organizing transactions under Section 80C, Section 80D Health Insurance, HRA, NPS, and Home Loan interest.
* **Subscriptions & Lifestyle Leak Audit**: Recurring outflow detection flagging active subscriptions, gym memberships, streaming services, and computing their annualized financial drag.

### 🛡️ Resilient Authentication & Data Portability
* **Production-Grade Auth Engine**:
  * Dual storage model combining `localStorage` hydration with HttpOnly cookie support.
  * 30-second token rotation grace period preventing race condition logouts on page reload.
  * Cross-domain body token payload fallback for decoupled Vercel + Railway/Render deployments.
* **Category & Ledger Governance**: Add custom categories, rename existing categories, update descriptions, and soft-delete unused categories safely without breaking historical ledger links.
* **Data Portability**:
  * **CSV Download**: 1-click export of complete transaction history formatted for Excel / Google Sheets.
  * **JSON Full Backup**: Portable, lossless full-ledger snapshot containing accounts, categories, goals, budgets, and transactions.

---

## 03 / API Interface Matrix

All API endpoints strictly communicate over JSON. Authenticated requests support `Authorization: Bearer <access_token>` with automatic fallback to HttpOnly cookies and JSON refresh payloads.

### 🔑 Authentication & Identity
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register new account with Argon2 password hashing |
| `POST` | `/api/auth/signin` | Sign in with email/password, receive access JWT & refresh credentials |
| `POST` | `/api/auth/firebase` | Sign in or sign up via Firebase OAuth ID token |
| `POST` | `/api/auth/refresh` | Rotate refresh token (supports HttpOnly cookie and JSON body payload) |
| `GET` | `/api/auth/me` | Fetch active authenticated user credentials |
| `POST` | `/api/auth/signout` | Revoke session and clear authentication cookies |
| `POST` | `/api/auth/forgot-password` | Request password reset email dispatched via Google SMTP |
| `POST` | `/api/auth/reset-password` | Verify recovery token and update account password |

### 📊 Command Center & Telemetry
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard` | Fetch aggregated telemetry: Net Worth, Liquid Reserves, Cashflow trajectory (`7D`, `30D`, `3M`, `6M`, `1Y`), Health Score (0-100), Burn Rate & Actionable Insights |

### 🚀 Guided Onboarding & Setup
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/onboarding/getting-started` | Retrieve onboarding progress, initialization state & first-time telemetry |
| `GET` | `/api/getting-started/status` | Alias for getting-started initialization status check |
| `POST` | `/api/onboarding/step-1` | Save initial bank, cash, card, and investment accounts |
| `DELETE` | `/api/onboarding/accounts/{id}` | Remove a specific onboarding account (resets to Step 1 if empty) |
| `DELETE` | `/api/onboarding/accounts` | Clear all onboarding accounts and reset setup |
| `POST` | `/api/onboarding/step-2` | Save monthly income baseline & record opening inflow transaction |
| `POST` | `/api/onboarding/step-3` | Save savings target %, emergency fund months, and risk tolerance |
| `POST` | `/api/onboarding/step-4` | Persist initial monthly category budget limits |
| `DELETE` | `/api/onboarding/budgets/{id}` | Remove onboarding budget cap for a category |
| `DELETE` | `/api/onboarding/budgets` | Clear all onboarding category budget limits |
| `POST` | `/api/onboarding/complete` | Finalize onboarding setup and activate live workspace |

### 💳 Accounts & Categories
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/accounts` | Retrieve active user accounts (Bank, Savings, Investment, Loan, Card) |
| `POST` | `/api/accounts` | Open a new account with initial balance |
| `PUT` | `/api/accounts/{id}` | Update account details, name, or balance |
| `DELETE` | `/api/accounts/{id}` | Deactivate/remove an account |
| `GET` | `/api/categories` | Retrieve all system and user categories |
| `POST` | `/api/categories` | Create custom transaction category |
| `PUT` | `/api/categories/{id}` | Update category name and description |
| `DELETE` | `/api/categories/{id}` | Soft-delete category |

### 💸 Transactions Engine
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/transactions` | Query transaction ledger (supports `limit` up to 5000 for historical reporting) |
| `GET` | `/api/transactions/{id}` | Retrieve single transaction details by ID |
| `POST` | `/api/transactions` | Record transaction (income, expense, transfer, pending) with auto balance adjustment |
| `PUT` | `/api/transactions/{id}` | Update transaction details, category, or amount with balance delta sync |
| `DELETE` | `/api/transactions/{id}` | Delete transaction and restore account balance |

### 🎯 Goals & Budgets
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/budgets` | Fetch monthly category budget caps and current spent |
| `PUT` | `/api/budgets` | Upsert monthly limit for a category |
| `DELETE` | `/api/budgets/{id}` | Delete category budget limit |
| `GET` | `/api/goals` | List financial milestone goals |
| `POST` | `/api/goals` | Create target goal (emergency fund, house, vehicle, retirement) |
| `PUT` | `/api/goals/{id}` | Update goal target amount, target date, priority, or current savings |
| `DELETE` | `/api/goals/{id}` | Cancel/delete financial goal |

### ⚙️ Profile, Preferences & Security Sessions
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/profile` | Retrieve authenticated user profile (name, email, join date) |
| `PATCH` | `/api/profile` | Update user profile details (name, email) |
| `GET` | `/api/settings` | Retrieve workspace UI settings (layout density, alert preferences) |
| `PATCH` | `/api/settings` | Update workspace preferences (`comfortable` / `compact`, budget/goal notifications) |
| `GET` | `/api/preferences` | Retrieve financial policy (currency, risk tolerance, savings %, emergency months) |
| `PATCH` | `/api/preferences` | Update financial policy rules and targets |
| `GET` | `/api/security` | List active device sessions and password modification timestamp |
| `POST` | `/api/security/password` | Change account password, rotate tokens, and re-authenticate current session |
| `POST` | `/api/security/sessions/{id}/revoke` | Revoke a specific active remote device session |
| `POST` | `/api/security/signout-all` | Revoke all active device sessions and force sign-out everywhere |

### 🩺 System & Health
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API service metadata, version, and running status |
| `GET` | `/health` | Lightweight liveness probe for orchestrators and uptime monitors |
| `GET` | `/ready` | Application readiness probe validating system dependencies |

---

## 04 / Quickstart & Local Deployment

### Prerequisites
* **Python 3.14+**
* **Node.js 20.9+** (22 LTS recommended)
* **Docker Engine 24+ & Docker Compose v2**

> [!TIP]
> **Looking to deploy live for $0 / month?** Check out the step-by-step [**Free Cloud Deployment Guide (Vercel + Supabase + Render)**](DEPLOYMENT.md).

### 🐳 Option A: Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/divydoesnotcode/ai-personal-CFO.git
cd ai-personal-CFO

# 2. Configure environment
cp .env.example .env
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
# Paste the generated string into SECRET_KEY in .env

# 3. Spin up full stack (PostgreSQL + FastAPI + Next.js)
docker compose up --build
```

The stack will be accessible at:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **PostgreSQL Database**: `localhost:5433` (mapped from container `5432`)

---

### 💻 Option B: Native Development

#### Step 1: Database
```bash
docker compose up -d postgres
```

#### Step 2: Backend API
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
alembic upgrade head
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Step 3: Frontend Client
```bash
cd frontend
npm ci
npm run dev
```

---

### 🔐 External Services & Credentials Configuration

#### 🔥 1. Firebase Authentication Setup (Google OAuth)
The Almanac supports 1-click Google OAuth sign-in and account provisioning through Firebase on both Next.js and FastAPI:

1. **Create or Open Firebase Project**:
   - Go to the [Firebase Console](https://console.firebase.google.com/) and create a project (or select an existing one).
   - In the sidebar, navigate to **Build** ➔ **Authentication** ➔ click **Get Started**.
   - Under the **Sign-in method** tab, enable the **Google** provider.
   - In the **Authorized domains** section (bottom of the Sign-in method tab), verify `localhost` is listed. Add your production domain (e.g. `your-app.vercel.app`) when deploying.

2. **Configure Frontend Web Credentials**:
   - Go to **Project Settings** (⚙️) ➔ **General** ➔ scroll to **Your apps**.
   - If you haven't created a Web app yet, click the **Web icon (`</>`)** and register the app.
   - Under **SDK setup and configuration**, select **Config** and copy the values into `frontend/.env` (or `frontend/.env.local`):
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:...
   ```

3. **Configure Backend ID Token Verification**:
   - In your root `.env` (or server environment variables), set the matching Firebase credentials:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_API_KEY=AIzaSy...
   ```
   > [!NOTE]
   > The backend verifies incoming Firebase ID tokens directly against Google Identity Services at `/api/auth/firebase`. New users signing in via Google are automatically registered and provisioned in the ledger.

---

#### 📬 2. Google SMTP Email Configuration (Password Recovery)
The Almanac uses `fastapi-mail` and Google SMTP to dispatch password recovery links with secure single-use tokens (`/api/auth/forgot-password`).

1. **Generate a Google App Password**:
   - Navigate to your Google Account security center: [myaccount.google.com/security](https://myaccount.google.com/security).
   - Verify that **2-Step Verification** is turned **ON** for your Google account.
   - In the search bar at the top, search for **App passwords** (or visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
   - In the **App name** field, enter `The Almanac` (or `Personal CFO`) and click **Create**.
   - Google will display a 16-character password (e.g., `abcd efgh ijkl mnop`). Copy this password.

2. **Configure Root `.env`**:
   - Paste your Gmail and App Password into the root `.env` file:
   ```env
   # Email / SMTP Configuration (Gmail)
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-16-char-google-app-password
   MAIL_FROM=your-email@gmail.com
   MAIL_FROM_NAME="The Almanac"
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=465
   MAIL_STARTTLS=False
   MAIL_SSL_TLS=True

   # Frontend recovery redirection
   FRONTEND_URL=http://localhost:3000
   RESET_PASSWORD_TOKEN_EXPIRE_MINUTES=30
   ```

   > [!TIP]
   > **Port & SSL/TLS Configuration:**
   > - **Port 465 (Default / Recommended)**: Connects using SSL/TLS directly (`MAIL_SSL_TLS=True`, `MAIL_STARTTLS=False`).
   > - **Port 587 (Alternative)**: Connects using STARTTLS negotiation (`MAIL_SSL_TLS=False`, `MAIL_STARTTLS=True`).
   > - `FRONTEND_URL` is used to construct the password reset link: `${FRONTEND_URL}/reset-password?token=<recovery_token>`. Ensure this matches your active frontend origin.

## 05 / Financial Integrity & Security Principles

1. **Exact-Precision Accounting**: All monetary computations utilize Python `Decimal` and PostgreSQL `Numeric(19, 4)` types to guarantee zero floating-point rounding errors.
2. **Double-Entry Directionality**: Amounts are strictly positive; directionality is determined by explicit transaction classifications (`income`, `expense`, `transfer`, `loan_payment`, etc.).
3. **Defense-in-Depth Authentication**: Access JWTs are short-lived; refresh tokens rotate with a 30-second concurrency grace window; session recovery is supported across cross-origin deployments via dual token hydration.
4. **Data Isolation**: Multi-tenant database architecture where all queries are strictly isolated by authenticated `user_id`.

---

<div align="center">

<code>CFO // CORE-KERNEL</code> &nbsp;&nbsp;·&nbsp;&nbsp; <b>Built for Sovereign Financial Stewardship.</b>

</div>
