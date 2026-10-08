# Optimization map

Analysis of every live API and UI surface in The Almanac (The The Almanac), written so a later agent can optimize **one numbered item at a time**.

- Snapshot date: 2026-10-07.
- This file describes the code on disk. It is not a changelog of earlier chat experiments.
- Do not start an item until the user names it (an `OPT-` id or a surface). Finish that item, then stop.
- Older notes in workspace memory disagree with this tree on several points. Trust this file and the code. In particular, these are **not** implemented here:
  - A quiet single-sheet dashboard. `DashboardView` still renders the full panel wall.
  - Browser Back opening a logout dialog, `cfo.signin.stay`, or `router.replace` after a successful sign-in. Sign-in still `router.push("/dashboard")`. `frontend/lib/auth-navigation.ts` only exports unused `POST_LOGIN_GUARD_*` constants and nothing imports them.
  - Cookie-only refresh. `POST /api/auth/refresh` prefers a JSON `refresh_token`, and `getOrStartRefresh` sends the in-memory token when it has one.
  - `Cache-Control: no-store` on sign-in or workspace routes. `frontend/next.config.ts` sends security headers only.
  - A full-screen `ScreenLoader`. It is not in the tree.

Product voice stays calm and precise. Money in Postgres is `Numeric` / `Decimal`, INR. Do not add an LLM, email ingestion, or ML while `backend/app/agents`, `backend/app/ml`, `backend/app/rag`, and `backend/app/api` email routes are empty.

## How to work an item

1. Read the item, the files it names, and the constraints below.
2. Change only that item.
3. Reuse `cfo-panel`, `Corners`, `cfo-form`, `cfo-input`, `cfo-btn`, `dash-ledger-list`, `EditDeleteActions`, and `DeleteConfirmDialog`.
4. Frontend lint is `cd frontend && ./node_modules/.bin/eslint <files>`. Root `npx eslint` is the wrong ESLint. Typecheck with `cd frontend && npx tsc --noEmit`. A known failure when `.next` exists: `app/(workspace)/emails/page.js` is missing because `frontend/app/(workspace)/emails/` has no page.
5. ESLint rejects synchronous `setState` inside `useEffect` (`react-hooks/set-state-in-effect`). Start the request in the effect and set state in `then` / `catch` / `finally`.
6. Motion imports come from `framer-motion`, not `motion/react`.
7. Night theme tokens in `frontend/app/globals.css` stay `--cfo-bg #0b0b0a`, `--cfo-ink #efeae1`, `--cfo-accent #c45c26`. Day theme is `:root[data-theme="beige"]` with `--cfo-bg #efeae1` and accent `#a64e20`. Do not reintroduce butter yellow `#decb81` or tamarillo `#752b2f`.
8. Under 960px, `.dash-greeting h1` is `2.35rem` and the greeting stays `order: -1`. Overview cards sit in a wrapper with `dash-span dash-order-overview`. Rules in `workspace.css` apply to direct children of `.dash-stack` only.
9. There is no browser MCP in this environment. Do not claim a click-through. Say what you could not open.

`docs/architecture/system_analysis.md` is an older architecture sketch. Use this file for optimization work.

## Suggested order

The user already said the dashboard is too populated. Start there unless they name another id.

| Order | Id | Why first |
| --- | --- | --- |
| 1 | OPT-01 | Home renders every dashboard section at once. |
| 2 | OPT-02 | Every signed-in page pays for that full payload. |
| 3 | OPT-03 | Dashboard JSON turns ledger decimals into floats. |
| 4 | OPT-04 | Lists and reports are capped and computed again in the browser. |
| 5 | OPT-05 | Sign-in history and refresh can look like a logout. |
| 6 | OPT-06 | Onboarding is two routers doing the same writes. |
| 7 | OPT-07 | Any user can rename or hide a shared system category. |
| 8 | OPT-08 | Ask CFO and `/cfo` are stubs. Leave them until a real agent is in scope. |
| 9 | OPT-09 | Five routes mount the same settings hub. |
| 10 | OPT-10 | Dead modules and unused fixtures. |

---

## OPT-01 — Dashboard home is one dense wall

Done on the home view. `DashboardView` now renders a greeting and one sheet: net worth, cash flow, savings, spending, a single note, and text links to Ledger, Budgets, Goals, and Ask CFO. Chart and panel sections stay in `sections.tsx` and are no longer mounted. Detail pages are unchanged. Night and day tokens are unchanged. The mobile greeting is still `order: -1` with `h1` at `2.35rem`. The sheet wrapper is `dash-span dash-order-overview`.

`frontend/components/dashboard/dashboard-view.tsx` always mounts, in order:

1. Greeting, month line, Add Transaction, Add Goal, Ask CFO, relative `generatedAt`.
2. `OverviewCards` — net worth, cash flow, savings rate, spending.
3. `HealthPanel` — score and five pillars.
4. `CashFlowPanel` — local range state `7D | 30D | 3M | 6M | 1Y`.
5. `SpendingPanel` and `BudgetPanel`.
6. `InsightsPanel`.
7. `GoalsPanel` and `UpcomingPanel`.
8. `TransactionsPanel` (recent rows from the dashboard payload, not the ledger page).
9. `InvestmentsPanel` and `DebtPanel`.
10. `MovesPanel` (recommendations).

All of those panels live in `frontend/components/dashboard/sections.tsx`. They are presentational. They do not call the API. Charts use Recharts and `useChartColors()` from the theme store.

Before the wall, the view short-circuits:

- Error and no payload: one panel plus Retry (`useDashboard().retry`).
- Onboarding not complete: `GettingStartedFlow` (`useOnboarding`). Empty-ledger handling is in the same early return path around the onboarding check. Read the component before changing it.

`/dashboard` page is only metadata plus `DashboardView`.

Optimization target: fewer sections on the home view, with detail left on Ledger, Budgets, Goals, Investments, Debt, and Reports. Keep night and day tokens. Keep the mobile greeting rules if the greeting remains a `.dash-stack` child. Do not delete `sections.tsx` until nothing imports it. Investments, debt, goals, and transactions pages do not import those panels today. They have their own views.

## OPT-02 — One dashboard query on every workspace page

Done. The shell no longer calls `GET /api/dashboard`. It reads `has_ledger` from the onboarding status it already loads (`GET /api/getting-started/status`). That flag is true when the user has an active account or any posted transaction. `useDashboard(true)` runs only in `DashboardView`. Other pages can still read a dashboard snapshot already in memory, including notification items, and a ledger write does not refetch the dashboard unless the home view is mounted. `GET /api/dashboard?range=` builds one cash-flow series. The client keeps series it has already loaded and requests a range when the chart switches to it. The home view still renders every panel.

`GET /api/dashboard?range=7D|30D|3M|6M|1Y` (`backend/app/api/dashboard.py`) calls `build_dashboard`. The handler accepts `range`, then `build_dashboard` does `del range_key` and always builds all five series.

`build_dashboard` (`backend/app/services/dashboard_service.py`):

- Loads every active account.
- If there are no accounts and no posted transaction, returns `empty_dashboard` plus goals.
- Otherwise loads up to ~400 days of posted and pending transactions with categories.
- Computes overview, five cash-flow series, spending, budgets, goals, upcoming, recent, investments, debt, health, insights, recommendations, and notifications in one response.
- `errors` is always `{}`. Per-section `errors.*` on the client is unused by the server.
- Health is a heuristic, not a model. Pillars: cash flow, savings, debt, investments, emergency fund (goal whose name contains `"emergency"`). Rank map 95 / 80 / 62 / 38, averaged. The summary sentence does not compare last month even when it says the position improved.
- Investments are accounts with type `investment`. Debt is `credit_card` and `loan` (`LIABILITY_TYPES`).
- Net worth is assets minus liabilities. Account balances are `>= 0` by a check constraint, so a liability balance is the amount owed, not a negative asset.

Client:

- `frontend/lib/dashboard/api.ts` `fetchDashboard()` calls `GET /api/dashboard` with **no** range query. The cash-flow control only switches arrays already in the payload.
- `useDashboard` keeps one module-level snapshot. It refetches only when forced, when the snapshot is empty, or after `invalidateDashboardCache()`.
- `AppShell` calls `useDashboard(Boolean(user))` for **every** workspace route, including settings and reports. The shell uses `hasLedger` to decide the getting-started layout. The rest of the payload is unused there.

Optimization target: stop paying for the full document on pages that need a boolean, and stop computing series the home view will not show. Preserve `hasLedger` for the shell until that flag has another source.

## OPT-03 — Dashboard money is float JSON

Ledger writes use `Decimal` via `ledger_service.money`. Dashboard metrics use `_as_float` and Pydantic floats (`backend/app/schemas/dashboard.py`: `Metric.value`, cash-flow points, spending, budgets, goals, investments, debt). The UI formats those numbers with `formatINR` in `frontend/lib/format-money.ts`.

Optimization target: keep rupee amounts exact across the dashboard response and the client types in `frontend/lib/dashboard/types.ts`. Do not change ledger `Numeric(19,4)` storage as a side effect.

## OPT-04 — Transaction reads are capped and repeated

`GET /api/transactions?limit=` default 50, max 5000 (`ledger.py`). Ordered by `transaction_date` desc, then `created_at` desc. No cursor, no date filter, no account filter.

Callers:

| Caller | Limit | Then |
| --- | --- | --- |
| `TransactionsView` via `listTransactions(100)` | 100 | Table, cards, detail dialog. Older rows never appear. |
| `ReportsView` | 1000 | Client-side statement, comparison, tax, lifestyle. A longer history is silently missing. |
| `DataExportPanel` CSV | 500 | Export is a partial ledger. JSON export also fans out to accounts, budgets, categories, goals. |
| Dashboard | ~400 days inside `build_dashboard` | Separate query, not the list endpoint. |

`listTransactions` is cached in `frontend/lib/ledger-api.ts` under the key `transactions` **without the limit**. The first caller wins. A later call with a different limit can receive the shorter cached list until `invalidateLedgerCache("transactions")`.

Reports (`reports-view.tsx` and `reports/*.tsx`) do not have a report API. They classify income and expense in the browser. Tax CSV is built client-side in `tax-report.tsx`.

Optimization target: one paging contract, cache keys that include the query, and reports that do not pretend a 1000-row cap is the full ledger.

## OPT-05 — Session refresh and Back

Auth routes, prefix `/api/auth`, all in `backend/app/api/auth.py`:

| Method | Path | Auth | Behavior |
| --- | --- | --- | --- |
| POST | `/signup` | No | Creates the user. No session. 409 if the email exists. |
| POST | `/signin` | No | Argon2 check, new `user_sessions` row, access JWT plus refresh token. Sets `cfo_access_token` and `cfo_refresh_token` (HttpOnly, path `/`). Returns both tokens in JSON. |
| POST | `/refresh` | Refresh token | Body token wins over the cookie. Rotates the session. 401 clears cookies. `rotate_refresh_token` has a short grace if the previous row is still found. |
| GET | `/me` | Bearer, else access cookie | Public user. |
| POST | `/signout` | Best effort | Revokes the access-token session and the refresh cookie session, then clears cookies. |

Client:

- `frontend/lib/api.ts` attaches `Authorization: Bearer` from memory. On 401 (except auth URLs) it calls `getOrStartRefresh` and retries once. Refresh posts `{ refresh_token }` when `getRefreshToken()` is set, with credentials.
- A failed refresh calls `clearAuthSession()`, which drops `localStorage` key `cfo.auth.session`.
- `frontend/lib/use-auth.ts` restores a session by calling that same refresh when memory is empty. `requireAuth` sends the user to `/signin`.
- `frontend/lib/auth-storage.ts` stores access token, refresh token, and user in `cfo.auth.session`.
- `frontend/lib/auth-api.ts` is the signup / signin / refresh wrapper used by the forms. Sign-in success in `signin-form.tsx` is `router.push("/dashboard")`. An already-signed-in visit uses `router.replace("/dashboard")`.
- Landing `frontend/app/page.tsx` links to `/signin` with a full document navigation. Signup pushes `/signin?registered=1`.
- Practical history: `/` → `/signin` → `/dashboard`. One Back hits `/signin` (which replaces back to `/dashboard` while the user is in memory). The next Back leaves the app. That is the bug the user has been hitting. `auth-navigation.ts` does not participate.
- `AppShell` logout is a dialog opened from the sidebar. Confirm calls `useAuth().logout()` → `signOutRequest` plus cache clears. It is not bound to browser Back.
- Workspace and auth responses can be cached by the browser. `next.config.ts` does not send `Cache-Control: no-store`.

Access JWT default in code is 15 minutes. `.env.example` sets `ACCESS_TOKEN_EXPIRE_MINUTES=10080` (7 days) when that file is copied. Refresh lifetime is 7 days. Confirm `backend/app/config.py` before changing either.

Optimization target: cookie-authoritative refresh, no frozen in-memory refresh token on a restored page, sign-in that does not leave `/signin` under the dashboard, and no cached ledger after logout. Do not trap Back forever and do not invent a silent bounce to the dashboard from `/`.

## OPT-06 — Onboarding is duplicated

Two routers in `backend/app/api/onboarding.py` register the same handlers:

- `/api/onboarding`
- `/api/getting-started`

| Method | Paths (on each prefix) | Effect |
| --- | --- | --- |
| GET | `/status`, and extra aliases on the onboarding prefix (`/getting-started`) plus `/` on the getting-started prefix | Reads accounts, latest income transaction, budgets, and `user_preferences`. |
| POST | `/step-1` | Creates accounts. |
| DELETE | `/accounts/{id}`, `/step-1/{id}` | Deletes one onboarding account. |
| DELETE | `/accounts`, `/step-1` | Deletes all of that user's onboarding accounts. |
| POST | `/step-2` | Income. Can write an initial income transaction. |
| POST | `/step-3` | Savings target, emergency months, risk tolerance on `user_preferences`. |
| POST | `/step-4` | Budget rows. |
| DELETE | `/budgets/{category_id}`, `/step-4/{category_id}` | One budget. |
| DELETE | `/budgets`, `/step-4` | All onboarding budgets. |
| POST | `/complete` | Sets `onboarding_completed`. |

Completion lives on `user_preferences.onboarding_completed` and `onboarding_step`, not a separate table.

Client `frontend/lib/onboarding-api.ts`:

- `fetchGettingStartedStatus` and `fetchOnboardingStatus` both GET `/api/getting-started/status`. Nothing in the client calls `/api/onboarding/status`.
- Mutations POST/DELETE `/api/onboarding/...`.
- Step 1–4 amounts go through `parseFloat` before they hit the API.

`GettingStartedFlow` (`getting-started-flow.tsx`) is the only wizard. `useOnboarding` subscribes to completion. `AppShell` hides the normal chrome while onboarding is incomplete, while `hasLedger` is false, or while the path is `/getting-started` or `/onboarding`. There is no `app/(workspace)/onboarding/page.tsx`. Incomplete users are replaced onto `/dashboard`, which renders the wizard. Completed users on `/getting-started` are replaced onto `/dashboard`.

`/getting-started` page renders the same flow.

Optimization target: one prefix, one status URL, decimal strings instead of `parseFloat`, and a shell check that does not depend on a second full dashboard fetch (see OPT-02).

## OPT-07 — System categories are mutable

`GET/POST /api/categories`, `PUT/DELETE /api/categories/{id}`.

`list` returns system rows (`user_id` null) plus the user's rows. `update_category` and `delete_category` match `user_id IS NULL OR user_id = current user`. Update renames that row. Delete sets `is_active = false`. A shared system category can be renamed or hidden for everyone.

Budgets upsert by `category_id` (`PUT /api/budgets`) and delete by the budget UUID (`DELETE /api/budgets/{budget_id}`). Identity on the wire is `Budget.id`. The client type is `LedgerBudget` in `ledger-api.ts`. The Budgets page is `BudgetsView`: wide header, add button, desktop table, small-screen cards, `BudgetComposer` inside the shared modal. Edit locks the category.

Optimization target: system rows are readable and not writable. User rows stay editable. Do not change the budget id contract.

## OPT-08 — Ask CFO is not an API

No chat route exists. `AskCfoProvider` (`frontend/lib/dashboard/ask-cfo.tsx`) holds `open` and `draft`. `AskCfoPanel` appends a fixed refusal: the conversational agent is not connected and it will not invent a figure. The panel is mounted from `AppShell`, so the button appears across the workspace.

`/cfo` does not open that panel. `cfo/page.tsx` renders `LedgerSubpage` with static copy. Nav label in `frontend/lib/dashboard/nav.ts` is still "AI CFO".

`backend/app/agents`, `ml`, and `rag` are empty packages. Dashboard insights and recommendations are the functions `_insights` and `_recommendations` in `dashboard_service.py`.

Optimization target: do not add a provider or a prompt path under this map unless the user asks for that item. A UI pass can only shorten the stub or point at real ledger pages.

## OPT-09 — Settings is one hub on five routes

`SettingsHub` (`settings-hub.tsx`) tabs: `general`, `accounts`, `categories`, `preferences`, `profile`, `security`, `data`.

| Route | `defaultTab` |
| --- | --- |
| `/settings` | `general` |
| `/accounts` | `accounts` |
| `/preferences` | `preferences` |
| `/profile` | `profile` |
| `/security` | `security` |

`?tab=` overrides the default. Each page is a `Suspense` wrapper around the same hub, so navigation remounts profile, security, accounts, and categories together.

Forms in `account-forms.tsx` call `frontend/lib/account-api.ts`, which caches profile, settings, preferences, and security the same way the ledger cache does.

Account routes, prefix `/api`, tag Account, all require the current user:

| Method | Path | Client |
| --- | --- | --- |
| GET, PATCH | `/api/profile` | `fetchProfile`, `updateProfile` |
| GET, PATCH | `/api/settings` | density `comfortable \| compact`, notify flags. `applyLocalDensity` / `readLocalDensity` also touch local storage. |
| GET, PATCH | `/api/preferences` | currency, risk, savings target percent, emergency months. |
| GET | `/api/security` | Active sessions. |
| POST | `/api/security/password` | `changePassword` |
| POST | `/api/security/sessions/{session_id}/revoke` | `revokeSession` |
| POST | `/api/security/signout-all` | `signOutAll` |

`CategoriesPanel` is only inside this hub. `AccountsPanel` is the account list inside the hub, not a standalone page component. `DataExportPanel` is the `data` tab (OPT-04).

Optimization target: load the active tab only, and stop remounting the other forms on every settings URL.

## OPT-10 — Dead or empty surfaces

| Path | State |
| --- | --- |
| `frontend/lib/auth-navigation.ts` | Unused exports. |
| `frontend/lib/mock-data/dashboard.ts` | `DASHBOARD_FIXTURE` and `emptyDashboard` have no importers. |
| `frontend/app/(workspace)/emails/` | Empty directory. Breaks `tsc` when `.next/types` expects `emails/page.js`. |
| `backend/app/api` emails module | Not registered in `main.py`. A stale `emails` bytecode file may exist; there is no router include. |
| `backend/app/agents`, `ml`, `rag` | Empty. |
| `backend/tests` | Empty. |
| `Makefile`, `LICENSE` | Empty. |
| `docs/ml`, `docs/product`, `docs/security` | Empty directories. |
| Landing `Corners` in `frontend/app/page.tsx` | A second `Corners`, not the dashboard `ui.tsx` one. |

Delete only the item the user names. Do not sweep these in a drive-by.

---

## API catalog

Global: FastAPI app in `backend/app/main.py`. CORS allows the configured origins and credentials. Unhandled exceptions return `INTERNAL_SERVER_ERROR` with no stack. Health endpoints do not check Postgres even though startup does (`/`, `/health`, `/ready`).

Authenticated ledger and account routes use `get_current_user` in `backend/app/api/deps.py`. Token order: `Authorization: Bearer`, then cookie `cfo_access_token`. The JWT is bound to the session `jti`.

Envelope shape used by clients: `{ success, message, data }`.

### System

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/` | No |
| GET | `/health` | No |
| GET | `/ready` | No |

### Auth

See OPT-05. Service: `backend/app/services/auth_service.py`. Schemas: `backend/app/schemas/auth.py`. Cookies and JWT helpers: `backend/app/utils/security.py`.

### Dashboard

| Method | Path | Client | Service |
| --- | --- | --- | --- |
| GET | `/api/dashboard` | `fetchDashboard` | `build_dashboard` |

See OPT-02 and OPT-03. Schema: `backend/app/schemas/dashboard.py` `DashboardPayload` fields: `hasLedger`, `source`, `generatedAt`, `overview`, `financialHealth`, `cashFlow`, `spending`, `budget`, `insights`, `goals`, `upcoming`, `recentTransactions`, `investments`, `debt`, `recommendations`, `notifications`, `errors`.

### Ledger

Router prefix `/api`. Service: `backend/app/services/ledger_service.py`. Schemas: `backend/app/schemas/ledger.py`. Client: `frontend/lib/ledger-api.ts`.

| Method | Path | Client | Notes |
| --- | --- | --- | --- |
| GET | `/api/accounts` | `listAccounts` | Active accounts for the user. |
| POST | `/api/accounts` | `createAccount` | Types: `bank`, `savings`, `cash`, `credit_card`, `investment`, `loan`. |
| PUT | `/api/accounts/{account_id}` | `updateAccount` | |
| DELETE | `/api/accounts/{account_id}` | `deleteAccount` | |
| GET | `/api/categories` | `listCategories` | System plus user. |
| POST | `/api/categories` | `createCategory` | |
| PUT | `/api/categories/{category_id}` | `updateCategory` | See OPT-07. |
| DELETE | `/api/categories/{category_id}` | `deleteCategory` | Soft-delete. See OPT-07. |
| GET | `/api/transactions` | `listTransactions` | See OPT-04. |
| GET | `/api/transactions/{transaction_id}` | `getTransaction` | |
| POST | `/api/transactions` | `createTransaction` | Updates balances with `balance_delta`. |
| PUT | `/api/transactions/{transaction_id}` | `updateTransaction` | Reverses the old balance effect, then applies the new one. |
| DELETE | `/api/transactions/{transaction_id}` | `deleteTransaction` | Reverses the balance effect. |
| GET | `/api/goals` | `listGoals` | |
| POST | `/api/goals` | `createGoal` | |
| PUT | `/api/goals/{goal_id}` | `updateGoal` | |
| DELETE | `/api/goals/{goal_id}` | `deleteGoal` | |
| GET | `/api/budgets` | `listBudgets` | |
| PUT | `/api/budgets` | `upsertBudget` | Body is category plus monthly limit. |
| DELETE | `/api/budgets/{budget_id}` | `deleteBudget` | UUID is `Budget.id`. |

Transaction types: `income`, `expense`, `transfer`, `refund`, `adjustment`, `interest`, `fee`, `loan_payment`, `dividend`.

Goal types: `emergency_fund`, `education`, `home`, `vehicle`, `travel`, `investment`, `debt_payoff`, `savings`, `other`.

`balance_delta` treats credit cards and loans differently from asset accounts. Read it before changing a transaction write. `ensure_default_account` exists for callers that need a wallet when the user has none.

Cache keys: `accounts`, `categories`, `goals`, `budgets`, `transactions`. Mutations call `invalidateLedgerCache` for the affected key. Several also call `invalidateDashboardCache()`.

### Account and settings

See OPT-09. Service: `backend/app/services/account_service.py`. Schema file: `backend/app/schemas/account.py`.

### Onboarding

See OPT-06.

---

## UI catalog

Workspace pages render inside `AppShell` (`frontend/app/(workspace)/layout.tsx` imports `workspace.css`). The shell provides sidebar, top nav, mobile drawer, density, Ask CFO, logout dialog, onboarding redirects, and the dashboard subscription.

Nav (`frontend/lib/dashboard/nav.ts`):

- Primary: `/dashboard`, `/transactions`, `/budgets`, `/goals`, `/investments`, `/debt`, `/cfo`, `/reports`.
- Secondary: `/settings`.
- Profile menu: `/profile`, `/settings?tab=accounts`, `/settings`, `/preferences`, `/security`.

| Surface | File | What it does | APIs | Optimize with |
| --- | --- | --- | --- | --- |
| Landing | `frontend/app/page.tsx` | Public page. Local `Corners`, metric and feature blocks. Link to `/signin` is a full navigation. | None | OPT-05 if history changes. Own `Corners` is OPT-10. |
| Auth shell | `frontend/app/(auth)/auth-shell.tsx`, `cfo-reveal.tsx`, `auth.css` | Shared sign-in and sign-up frame. | None | Leave unless the auth item needs it. |
| Sign in | `signin/page.tsx`, `signin-form.tsx` | Credentials, session write, push to dashboard, replace if already signed in. | `signinRequest`, refresh via `useAuth` | OPT-05 |
| Sign up | `signup/page.tsx`, `signup-form.tsx` | Register, then push to `/signin?registered=1`. | `signupRequest` | OPT-05 |
| App shell | `components/dashboard/app-shell.tsx` | Auth gate, onboarding gate, nav, logout, Ask CFO host. | `useAuth`, `useOnboarding`, `useDashboard`, `readLocalDensity` | OPT-01, OPT-02, OPT-05, OPT-08 |
| Sidebar | `sidebar.tsx` | Primary and secondary nav, collapse key `cfo.nav.collapsed`. | None | Shell item only. |
| Top nav | `top-nav.tsx` | Mobile menu, profile links, theme, logout request. | None | Shell item only. |
| Theme | `components/theme-toggle.tsx`, `lib/theme.ts` | `cfo-theme` is `dark` or `beige`, applied before paint from `app/layout.tsx`. | None | Do not change tokens. |
| Dashboard | `dashboard-view.tsx`, `sections.tsx`, `dashboard/page.tsx` | Full home wall. | `useDashboard`, `useOnboarding`, `useAskCfo` | OPT-01, OPT-02 |
| Getting started | `getting-started-flow.tsx`, `getting-started/page.tsx` | Four-step wizard plus complete. | Onboarding client, `listCategories` | OPT-06 |
| Transactions | `transactions-view.tsx`, `transactions/page.tsx` | List, filters in the view, detail, edit, delete. | `listTransactions(100)`, `deleteTransaction`. Create and edit go through `TransactionComposer`. | OPT-04 |
| Budgets | `budgets-view.tsx`, `budgets/page.tsx` | Monthly limits list. | `listBudgets`, `deleteBudget`, `upsertBudget` via `BudgetComposer` | OPT-07 only if category rules change. Layout is already the transactions pattern. |
| Goals | `goals-view.tsx`, `goals/page.tsx` | Goal list and delete. | `listGoals`, `deleteGoal`, `GoalComposer` | Own item if the user asks. Dashboard also shows goal cards from the aggregate payload. |
| Investments | `investments-view.tsx`, `investments/page.tsx` | Filters `listAccounts()` to `investment`. Delete uses `deleteAccount`. | Accounts API | Same list endpoint as Accounts and Debt. |
| Debt | `debt-view.tsx`, `debt/page.tsx` | Filters accounts to credit cards and loans. | Accounts API | Same as investments. |
| Accounts | `accounts/page.tsx` → `SettingsHub` tab `accounts` → `accounts-panel.tsx` | Account CRUD. | Account ledger routes | OPT-09 |
| Categories | `category-panel.tsx` inside Settings | Category CRUD. No standalone route. | Category routes | OPT-07, OPT-09 |
| Reports | `reports/reports-view.tsx`, `statement-report.tsx`, `comparison-report.tsx`, `tax-report.tsx`, `lifestyle-report.tsx`, `reports/page.tsx` | Four tabs over one fetched list. | `listTransactions(1000)`, `listAccounts` | OPT-04 |
| Ask CFO panel | `ask-cfo-panel.tsx` | Stub dialog. | None | OPT-08 |
| CFO page | `cfo/page.tsx`, `subpage.tsx` | Static placeholder. | None | OPT-08 |
| Settings hub | `settings-hub.tsx` | All settings tabs. | Account API plus child panels | OPT-09 |
| Profile, preferences, security pages | matching `page.tsx` files | Same hub, different default tab. | Same | OPT-09 |
| Data export | `data-export-panel.tsx` | Client CSV and JSON download. | Ledger list routes | OPT-04 |
| Composers | `ledger-forms.tsx` | `TransactionComposer`, `GoalComposer`, `BudgetComposer`, `AccountComposer`. Success often `router.push("/dashboard")`, which adds history entries. | Matching ledger writes, plus `listAccounts` / `listCategories` / `listGoals` | Touch only inside the item being optimized. |
| Account forms | `account-forms.tsx` | Profile, workspace settings, financial policy, password, sessions. | `account-api.ts` | OPT-09 |
| Row actions | `row-actions.tsx` | `EditDeleteActions`, `DeleteConfirmDialog`. Used by transactions and budgets. Icon by default, `variant="labeled"` for text. | None | Reuse. Do not copy new pencil and trash buttons. |
| Chrome primitives | `ui.tsx` | `Corners`, `Panel`, `Delta`, `Progress`, `Money`, `Skeleton`, `EmptyBlock`, `ErrorBlock`, `QuietLink`, `statusLabel`. | `formatINR`, `formatPercent` | Reuse. |
| Tabs | `responsive-tabs.tsx` | Settings and reports. | None | |
| Loading | `loading-indicator.tsx` | Small refresh indicator in the shell. Not a route loader. | None | |
| Icons | `icons.tsx` | Nav icons. | `AppNavItem` | |
| Root layout | `frontend/app/layout.tsx` | Fonts (Instrument Serif, IBM Plex Sans, IBM Plex Mono) and theme script. | None | |

`frontend/lib/use-reveal.ts` is for the landing motion. `frontend/components/loader.tsx` is not in the tree; do not recreate a `motion/react` import.

## Data model

Postgres tables (SQLAlchemy models under `backend/app/models/`):

| Model | Table | Used for |
| --- | --- | --- |
| `User` | `users` | Email, name, password hash, `is_active`, `token_version`. |
| `UserSession` | `user_sessions` | Refresh token, `jti`, user agent, revocation. |
| `UserPreference` | `user_preferences` | Density, notification flags, currency, risk, savings target, emergency months, onboarding step and completed flag. One row per user, created on first read. |
| `Account` | `accounts` | Container plus cached balance. Types listed above. `balance >= 0`. |
| `Category` | `categories` | System (`user_id` null) and user categories. |
| `Transaction` | `transactions` | Movement. Types and statuses in `transaction.py`. |
| `Budget` | `budgets` | One monthly limit per user and category. |
| `FinancialGoal` | `financial_goals` | Target, current amount, date, type, status. |

Alembic revisions live in `alembic/versions/`. Schema changes need a revision. Do not edit a shipped revision in place.

## Client conventions agents keep missing

- Invalidate the dashboard cache after a ledger write that should show up on the home view. `invalidateDashboardCache` lives in `use-dashboard.ts`.
- Surface errors with `getApiErrorMessage`. 5xx text is replaced by the fallback. Network failure copy is "Network error — identity service unreachable".
- `getApiErrorMessage` and `fieldErrorsFromValidation` are the form error helpers in `api.ts`.
- Amount entry on onboarding uses `parseFloat` (OPT-06). Ledger composers should be checked before a money change so a new path does not add another float conversion.
- `AppShell` and `DashboardView` both call `useDashboard` / `useOnboarding`. The hooks are module stores, so they share one request. They still both subscribe, and the shell's subscription is what forces the home payload on other routes (OPT-02).

## Verification gaps

This analysis was read from source. It was not exercised in a browser, and the backend test directory is empty. An optimization is not verified until the agent runs the frontend lint and typecheck for the files it touched and, when the UI changes, actually opens the route. Say so if the browser was not available.
