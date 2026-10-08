# The The Almanac — Master Frontend Dashboard Prompt

You are a senior frontend engineer and product designer.

Build a **premium, modern, AI-powered Personal CFO dashboard frontend** for my existing project.

## Important: Preserve Existing Theme

Before writing or changing any UI:

* Inspect the existing frontend project.
* Identify the current:

  * Color palette
  * Typography
  * Tailwind configuration
  * CSS variables
  * Border radius
  * Shadows
  * Spacing system
  * Existing layout patterns
  * Existing components

**Do not replace, redesign, or reset the existing theme.**

The new dashboard must feel like a natural extension of the current application.

Do not introduce a completely new visual identity.

Reuse the existing:

* Theme variables
* Background colors
* Primary/accent colors
* Typography
* Buttons
* Cards
* Inputs
* Borders
* Shadows
* Sidebar styling
* Header styling

If the project already supports dark and light mode, the dashboard must fully support both modes.

Use the existing design system consistently.

---

# Project Context

The product is called:

**The The Almanac**

It is an AI-powered personal finance platform that helps users:

* Understand their real financial position
* Track accounts
* Analyze income and expenses
* Identify spending patterns
* Monitor financial goals
* Forecast future cash flow
* Receive AI-powered financial insights and recommendations

This is **not a traditional expense tracker**.

The dashboard should feel like a:

> **Personal Financial Command Center**

The user should immediately understand:

1. Where am I financially?
2. Where is my money going?
3. What has changed?
4. Where am I heading?
5. What should I do next?

The dashboard should visually communicate these answers through meaningful charts, analytics, and AI-generated insights.

---

# Scope

Build **frontend only**.

Do not build:

* Authentication
* Backend APIs
* Database logic
* FastAPI integration
* ML models
* RAG
* Real AI integrations

Use realistic **mock data**.

However, structure the frontend so that mock data can easily be replaced with API data later.

Create clean reusable TypeScript types and mock data files.

---

# Technology

Use the existing project stack.

The project uses:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Recharts
* Zod

Use:

* Recharts for data visualizations
* Lucide icons
* Existing project utilities and components

Do not add unnecessary dependencies.

---

# Dashboard Design Philosophy

The dashboard should feel:

* Premium
* Intelligent
* Modern
* Financial
* Data-driven
* Clean
* Calm
* Professional

Avoid making it look like:

* A generic admin panel
* A basic banking dashboard
* A crypto trading dashboard
* A template copied from a UI library
* An overloaded analytics screen

The interface should prioritize:

**Clarity → Financial context → Insights → Action**

Do not display charts just for decoration.

Every chart must communicate something useful.

---

# Main Dashboard Layout

Use the existing application layout.

If a sidebar already exists, preserve and extend it.

Suggested navigation:

* Dashboard
* Accounts
* Transactions
* Analytics
* Goals
* Forecast
* AI CFO
* Settings

Do not redesign existing navigation unnecessarily.

The main dashboard should be responsive.

---

# 1. Dashboard Header

Create a clean dashboard header.

Include:

* Personalized greeting
* Short financial status summary
* Date range selector
* Notification button
* User/profile area
* Primary action button:

  * Add Transaction

Example content:

**Good morning, Aryan 👋**

Your financial position is improving this month.

Date selector:

* This Month
* Last 30 Days
* Last 3 Months
* This Year

The selected date range should update the mock chart data if practical.

---

# 2. Financial Pulse — Hero Section

This is one of the main unique features.

Do not make the first section simply four boring statistic cards.

Create a visually strong **Financial Pulse** section.

Show:

* Financial Health Score
* Net Worth
* Available Cash
* Cash Runway

Example:

Financial Health

78 / 100

Status:

**Good financial health**

Supporting indicators:

* Income → Increasing
* Spending → Controlled
* Savings → Improving
* Debt → Stable

Use subtle visual indicators.

Do not use excessive gradients or glowing effects.

The Financial Health Score should feel like an intelligent summary of the user's financial condition.

When hovered or clicked, show a breakdown:

* Cash Flow Stability
* Savings Rate
* Emergency Fund Coverage
* Debt Health
* Goal Progress
* Spending Discipline

Example:

```text
Cash Flow Stability       82
Savings Rate              74
Emergency Fund            62
Debt Health               91
Goal Progress             73
Spending Discipline       55
```

Use progress bars or another elegant visualization.

---

# 3. Cash Flow Story

Create a large interactive chart.

Title:

**Cash Flow Story**

Display monthly:

* Income
* Expenses
* Savings

Use Recharts.

Preferred visualization:

* Multi-series line chart

or:

* Bar chart for income and expenses
* Line chart for savings

The chart should show approximately 6 months of data.

Example data:

| Month  | Income | Expenses | Savings |
| ------ | -----: | -------: | ------: |
| March  |  72000 |    49000 |   23000 |
| April  |  78000 |    52000 |   26000 |
| May    |  75000 |    54000 |   21000 |
| June   |  82000 |    51000 |   31000 |
| July   |  80000 |    56000 |   24000 |
| August |  85000 |    52400 |   32600 |

Format all values in INR.

Example:

₹85,000

Below or beside the chart, add an AI insight.

Example:

> Your savings dipped in May due to increased expenses but recovered strongly in June and August.

Create this insight as a reusable component.

---

# 4. Spending Fingerprint

Create a unique visualization called:

**Your Spending Fingerprint**

This should compare the user's current spending behavior against their historical average.

Show categories such as:

* Housing
* Food & Dining
* Shopping
* Transport
* Entertainment
* Investments
* Savings

Use horizontal bars or a modern comparison visualization.

For each category, show:

* Current spending
* Historical average
* Percentage change

Example:

```text
Food & Dining

Current      ₹12,400
Average      ₹10,800

+15% ↑
```

The purpose is to help users understand:

> How is my spending behavior changing?

Add an insight:

> Shopping is 28% higher than your 6-month average.

This should feel personalized and analytical.

---

# 5. Spending Breakdown

Add a compact spending category visualization.

Use:

* Donut chart

Show:

* Total spending in the center
* Categories around the chart
* Percentage or amount

Example categories:

* Housing
* Food & Dining
* Shopping
* Transport
* Entertainment

Allow users to hover over chart segments.

Tooltips should display:

* Category
* Amount
* Percentage

Do not overload the chart with too many categories.

---

# 6. Future Cash Forecast

Create one of the most important dashboard sections:

**Cash Forecast**

Visualize the user's projected cash balance for the next 30 days.

Use a line or area chart.

Example:

| Date     | Projected Balance |
| -------- | ----------------: |
| Today    |             85000 |
| +5 days  |             72000 |
| +10 days |             61000 |
| +15 days |             48000 |
| +20 days |             55000 |
| +25 days |             38000 |
| +30 days |             32000 |

Show:

**Projected balance after 30 days: ₹32,000**

Also include:

**Minimum safe balance: ₹30,000**

If the forecast approaches the minimum balance, visually highlight it.

Add an AI insight:

> Based on your current spending and upcoming payments, your balance may approach your safety threshold within the next 30 days.

Use mock data only.

---

# 7. Spending Behavior

Create a unique behavioral analytics section.

Title:

**When You Spend**

Visualize spending patterns across:

* Days of the week
* Time of day

Suggested concept:

```text
             Mon Tue Wed Thu Fri Sat Sun

Morning       ░   ░   ▒   ░   ░   ▒   ▓
Afternoon     ▒   ▓   ▒   ▓   ▓   █   █
Evening       █   ▓   █   ▓   █   █   █
Night         ░   ░   ▒   ░   ▓   █   ▓
```

Build this as a custom React visualization if Recharts is not suitable.

Use the existing theme colors.

Do not hardcode random colors that conflict with the project theme.

Add a summary:

> You spend 42% more on weekends.

> Your highest spending period is Saturday evening.

---

# 8. What Changed?

Create a section called:

**What Changed This Month?**

This should automatically summarize differences between:

* Current period
* Previous period
* Historical average

Display insight cards.

Example:

### Income

+₹6,500

Increased compared with last month.

### Shopping

+28%

Higher than your normal spending pattern.

### Savings

+₹8,200

Your savings improved this month.

### Debt

-12%

Your outstanding debt decreased.

Use positive and negative indicators appropriately.

Do not rely only on red and green.

Use icons and clear labels so the meaning is accessible.

---

# 9. Financial Goals

Create a goals section.

Show at least:

### Emergency Fund

₹2,16,000 / ₹3,00,000

72% complete.

Show:

* Progress bar
* Current amount
* Target amount
* Estimated completion date

Example:

> At your current savings rate, you are expected to reach this goal in January 2027.

### Home Fund

₹8,50,000 / ₹25,00,000

34% complete.

Add:

> Required monthly savings to stay on track.

Example:

₹58,000/month

The goal cards should feel actionable.

---

# 10. CFO Decision Center

This is the most important AI section.

Create a visually prominent section:

# 🤖 Your CFO Recommends

Each recommendation should contain:

* Recommendation
* Why
* Expected financial impact
* Action button

Example:

### Reduce discretionary spending by ₹4,000/month

**Why**

Shopping spending is 28% higher than your historical average.

**Impact**

Your emergency fund could be completed approximately 2 months earlier.

Buttons:

* Simulate Impact
* View Details

Do not implement actual AI.

Use mock recommendations.

Create reusable components.

Possible recommendation categories:

* Spending optimization
* Goal acceleration
* Cash flow risk
* Subscription reduction
* Debt payoff
* Savings opportunity

---

# 11. Interactive "What If?" Simulation

Create a small but unique simulation feature.

Example:

```text
What happens if I save:

₹2,000 ─────────●────── ₹10,000 / month
```

When the slider changes:

* Update projected goal completion date
* Update estimated savings
* Update financial impact

Example:

Current:

Emergency Fund Completion:
January 2027

After saving an additional ₹4,000/month:

Emergency Fund Completion:
November 2026

Use mock calculations.

This should be interactive and work entirely on the frontend.

This feature should make the dashboard feel intelligent and dynamic.

---

# 12. Accounts Overview

Show account summary cards.

Example accounts:

### HDFC Savings

₹84,500

### ICICI Credit Card

₹32,400 used

Limit: ₹1,00,000

### Mutual Funds

₹4,80,000

Return: +8.2%

### Cash

₹12,000

Keep this section compact.

Include:

**View All Accounts**

Do not overcrowd the dashboard.

---

# 13. Recent Transactions

Create a clean transaction table.

Columns:

* Merchant
* Category
* Date
* Account
* Amount

Example:

| Merchant   | Category      | Date   |   Amount |
| ---------- | ------------- | ------ | -------: |
| Amazon     | Shopping      | Today  |  -₹1,299 |
| Swiggy     | Food & Dining | Today  |    -₹420 |
| Salary     | Income        | Aug 25 | +₹85,000 |
| Indian Oil | Transport     | Aug 24 |    -₹800 |
| Netflix    | Entertainment | Aug 22 |    -₹649 |

Include:

* Search
* Category filter
* View all button

Use realistic mock transaction data.

---

# Dashboard Grid Structure

Use a responsive grid.

Desktop structure:

```text
┌──────────────────────────────────────────────────────────────┐
│ HEADER                                                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                  FINANCIAL PULSE                             │
│                                                              │
│ Health Score | Net Worth | Available Cash | Cash Runway      │
│                                                              │
├─────────────────────────────┬────────────────────────────────┤
│                             │                                │
│ CASH FLOW STORY             │ SPENDING FINGERPRINT           │
│ Large Chart                 │ Current vs Historical          │
│                             │                                │
├─────────────────────────────┼────────────────────────────────┤
│                             │                                │
│ CASH FORECAST               │ SPENDING BREAKDOWN             │
│ Line / Area Chart           │ Donut Chart                    │
│                             │                                │
├─────────────────────────────┼────────────────────────────────┤
│                             │                                │
│ WHEN YOU SPEND              │ WHAT CHANGED?                  │
│ Spending Heatmap            │ Monthly Changes                │
│                             │                                │
├─────────────────────────────┴────────────────────────────────┤
│                                                              │
│ FINANCIAL GOALS                                            │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 🤖 CFO DECISION CENTER                                       │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ACCOUNTS OVERVIEW                                            │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ RECENT TRANSACTIONS                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# Responsive Design

The dashboard must be fully responsive.

## Desktop

Use a multi-column grid.

## Tablet

Convert large sections into stacked or two-column layouts.

## Mobile

Stack all sections vertically.

Important:

* Charts must resize correctly.
* Tables should become horizontally scrollable or use compact cards.
* Sidebar should collapse into a mobile navigation drawer.
* KPI cards should remain readable.
* No horizontal page overflow.

---

# Components

Create reusable components where appropriate.

Suggested structure:

```text
components/
├── dashboard/
│   ├── financial-pulse.tsx
│   ├── health-score.tsx
│   ├── cash-flow-chart.tsx
│   ├── spending-fingerprint.tsx
│   ├── spending-breakdown.tsx
│   ├── cash-forecast.tsx
│   ├── spending-heatmap.tsx
│   ├── changes-summary.tsx
│   ├── goals-overview.tsx
│   ├── cfo-recommendations.tsx
│   ├── what-if-simulator.tsx
│   ├── accounts-overview.tsx
│   └── recent-transactions.tsx
```

Do not blindly create files if the existing project already has a preferred component structure.

Follow the project's existing architecture.

---

# Data Structure

Create frontend mock data separately.

Example:

```text
lib/
├── mock-data/
│   ├── dashboard.ts
│   ├── transactions.ts
│   ├── accounts.ts
│   └── goals.ts
```

Use TypeScript interfaces.

Example concepts:

```text
FinancialSummary
CashFlowData
SpendingCategory
Account
Transaction
FinancialGoal
CFORecommendation
```

Keep mock data separate from UI components.

---

# Chart Requirements

Use Recharts.

The dashboard should include:

1. Cash Flow Chart

   * Income
   * Expenses
   * Savings

2. Spending Fingerprint

   * Current vs historical average

3. Spending Breakdown

   * Donut chart

4. Cash Forecast

   * Projected future balance

5. Spending Behavior Heatmap

   * Day + time spending patterns

Charts must:

* Be responsive
* Have useful tooltips
* Format numbers as INR
* Match the existing application theme
* Support light and dark mode if available
* Have accessible labels
* Avoid unnecessary visual noise

Do not use random colors for every chart.

Use a consistent chart color system derived from the existing theme.

---

# Loading and Empty States

Include polished frontend states.

For every major section, consider:

* Loading state
* Empty state
* Error state

Use skeleton loaders where appropriate.

Example empty state:

```text
No financial data yet.

Add your first account or transaction to start seeing insights.
```

Add meaningful call-to-action buttons.

---

# Animations

Use subtle animations only.

Examples:

* Card entrance
* Number transitions
* Chart transitions
* Hover effects
* Progress bar animations

Avoid:

* Excessive motion
* Flashing
* Heavy gradients
* Unnecessary animations

The product should feel calm and professional.

---

# Accessibility

Ensure:

* Semantic HTML
* Keyboard navigation
* Accessible buttons
* Visible focus states
* Proper chart labels
* Good contrast
* Tooltips that do not contain essential information only available on hover

---

# Financial Formatting

All financial values should use INR formatting.

Example:

```text
₹85,000
₹1,24,500
₹10.3L
```

Create reusable formatting utilities.

Do not use floating-point calculations directly for financial logic.

For this frontend prototype, use safe mock values and utility functions.

---

# Important Design Rules

DO:

* Retain the existing project theme.
* Inspect existing components before building.
* Reuse existing UI patterns.
* Make charts meaningful.
* Make the dashboard feel intelligent.
* Use realistic financial mock data.
* Build reusable components.
* Keep the layout responsive.
* Show AI insights with financial context.
* Show the impact of recommendations.
* Focus on storytelling through data.

DO NOT:

* Replace the existing theme.
* Rewrite the entire frontend.
* Introduce a completely new design system.
* Use excessive gradients.
* Create a generic admin dashboard.
* Fill the screen with unnecessary charts.
* Add backend functionality.
* Add authentication.
* Add real AI integration.
* Add unnecessary dependencies.
* Hardcode all mock data inside components.
* Use fake API calls unless the existing project architecture requires them.

---

# Final Goal

The final dashboard should feel like:

> **A personal financial operating system powered by an AI CFO.**

It should not simply say:

> "You spent ₹52,400."

It should communicate:

> "Your spending increased by 8% this month, mainly due to shopping and dining. If this pattern continues, your emergency fund goal may be delayed by approximately 2 months. Reducing discretionary spending by ₹4,000/month could get you back on track."

Build the dashboard with this philosophy:

**Financial Data → Pattern → Insight → Prediction → Recommended Action**

The final implementation should be polished, production-quality from a frontend perspective, visually consistent with the existing application, and structured so that real backend APIs can replace mock data later without major UI refactoring.
