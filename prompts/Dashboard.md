# The The Almanac — Dashboard Specification

## 1. Dashboard Philosophy

The dashboard is the **command center of the user's financial life**.

The design must feel:

- Minimalistic
- Premium
- Intelligent
- Calm
- Data-driven
- Highly readable
- Professional
- Fast
- Mobile-friendly

**Do NOT make it look like a traditional banking application.**

The product should feel closer to a combination of:

> Personal CFO + Bloomberg-style financial intelligence + modern SaaS

The interface should communicate:

> **"I know exactly where my money stands."**

---

# 2. Strict Design Rules

## Theme

**STRICTLY RETAIN THE EXISTING PROJECT THEME.**

Do not introduce a new color palette.

Do not redesign the visual identity.

Do not introduce unnecessary gradients, colorful cards, excessive shadows, or decorative elements.

All new dashboard components must inherit:

- Existing background
- Existing typography
- Existing accent color
- Existing border style
- Existing button style
- Existing radius system
- Existing spacing system
- Existing dark/light behavior

If a component does not fit the existing theme, simplify the component rather than changing the theme.

---

# 3. Layout

Desktop:

```text
┌─────────────────────────────────────────────────────────────┐
│ Sidebar │ Top Navigation                                    │
│         ├───────────────────────────────────────────────────┤
│         │                                                   │
│         │              Dashboard Content                   │
│         │                                                   │
│         │                                                   │
│         │                                                   │
└─────────────────────────────────────────────────────────────┘
```

The sidebar must be:

- Collapsible
- Minimal
- Icon + label when expanded
- Icon-only when collapsed
- Smoothly animated
- Persist collapsed/expanded state

### Mobile

The sidebar should become a compact navigation drawer.

Use a clear menu button.

The dashboard must never require horizontal scrolling.

---

# 4. Top Navigation

Keep the top navigation extremely clean.

### Left

```text
☰ / Logo
```

When sidebar is collapsed:

```text
[Menu] The The Almanac
```

### Right

```text
Search    Notifications    Profile
```

Do not overcrowd the navigation.

Profile menu should contain:

- Profile
- Settings
- Financial Preferences
- Security
- Logout

---

# 5. Dashboard Header

At the top of the dashboard:

```text
Good afternoon, {First Name}

Here's your financial picture for {Month}.
```

Underneath:

```text
Last updated: 2 minutes ago
```

Keep this subtle.

Do not use a huge hero section.

The dashboard should immediately show financial information.

---

# 6. Financial Overview

The first major section should contain the user's most important financial metrics.

Use **4 compact cards** on desktop.

### Card 1 — Net Worth

```text
NET WORTH

₹4,82,500

↑ 6.2%
vs last month
```

### Card 2 — Cash Flow

```text
CASH FLOW

+₹32,450

↑ 12.4%
vs last month
```

### Card 3 — Savings Rate

```text
SAVINGS RATE

38.5%

+4.2%
vs last month
```

### Card 4 — Monthly Spending

```text
SPENDING

₹41,820

↓ 8.1%
vs last month
```

---

# 7. Financial Health Score

Create one prominent but minimal section.

```text
FINANCIAL HEALTH

82 / 100

Excellent

████████████████░░░░

Your financial position improved
compared with last month.
```

Below the score:

```text
Cash Flow        Excellent
Savings          Strong
Debt             Excellent
Investments      Good
Emergency Fund   Needs Attention
```

Avoid gamification.

This is a financial intelligence product, not a fitness app.

---

# 8. Cash Flow Chart

Main dashboard chart:

## Cash Flow

Display:

- Income
- Expenses
- Net cash flow

Time selector:

```text
7D   30D   3M   6M   1Y
```

Default:

```text
6M
```

The chart should be clean.

Avoid unnecessary gridlines.

Use the existing theme's accent colors only.

Hovering over a point should show:

```text
August 24

Income       ₹8,500
Expenses     ₹3,240
Net Flow     +₹5,260
```

---

# 9. Spending Breakdown

Create a secondary section:

```text
SPENDING BREAKDOWN
```

Show the user's spending categories.

Example:

```text
Housing              ₹18,000
Food                  ₹7,420
Transportation        ₹4,200
Entertainment         ₹2,800
Shopping              ₹5,400
Other                 ₹4,000
```

Use a minimal horizontal bar visualization.

Avoid overly colorful pie charts.

A donut chart may be used only if it fits the existing theme.

---

# 10. Budget Status

Section:

```text
BUDGET STATUS
```

Example:

```text
Monthly Budget

₹48,000 / ₹60,000

80% used

████████████████░░░░
```

Category breakdown:

```text
Food
₹7,420 / ₹10,000

Transportation
₹4,200 / ₹6,000

Entertainment
₹2,800 / ₹4,000

Shopping
₹5,400 / ₹8,000
```

If a category exceeds its budget:

```text
⚠ Shopping is 14% above your monthly budget.
```

Keep warnings subtle.

---

# 11. AI CFO Insights

This should be one of the most important parts of the dashboard.

Section:

```text
AI CFO INSIGHTS
```

The AI should surface **3–5 actionable insights**, not a wall of text.

Example:

```text
You spent 23% more on dining this month.

Reducing dining expenses by ₹1,500/month
could increase your annual savings by ₹18,000.

[View Analysis]
```

Another:

```text
Your savings rate increased from 31% → 38%.

You're currently ahead of your
monthly savings target.

[View Details]
```

Another:

```text
Your emergency fund covers 2.4 months
of current expenses.

Recommended target: 6 months.

[Build Emergency Fund]
```

---

# 12. Financial Goals

Section:

```text
FINANCIAL GOALS
```

Display active goals.

Example:

```text
MBA FUND

₹3,20,000 / ₹8,00,000

40%

████████░░░░░░░░░░

Target: June 2028
```

Additional goals:

```text
Emergency Fund
₹75,000 / ₹2,50,000

New Laptop
₹40,000 / ₹1,20,000
```

Each goal should have:

- Goal name
- Current amount
- Target amount
- Percentage
- Target date
- Progress indicator

CTA:

```text
+ Add Goal
```

---

# 13. Upcoming Transactions

Section:

```text
UPCOMING
```

Show only important upcoming transactions.

Example:

```text
Sep 01

Rent
₹18,000

Sep 03

SIP
₹5,000

Sep 05

Internet
₹999

Sep 07

Credit Card
₹12,400
```

CTA:

```text
View all transactions →
```

---

# 14. Recent Transactions

A compact table:

```text
RECENT TRANSACTIONS

Date       Description        Category       Amount

Aug 30     Swiggy             Food           -₹420
Aug 29     Salary             Income         +₹25,000
Aug 29     Uber               Transport      -₹340
Aug 28     Amazon             Shopping       -₹1,299
```

Positive and negative values should be visually distinguishable while still respecting the existing theme.

---

# 15. Investment Snapshot

If the user has connected investments:

```text
INVESTMENTS

Portfolio Value

₹6,42,800

+₹42,800 (+7.1%)
```

Show:

```text
Equity
₹4,20,000

Mutual Funds
₹1,72,800

Other
₹50,000
```

CTA:

```text
View Portfolio →
```

If there are no investments:

```text
Your investment portfolio hasn't been connected yet.

Connect your investments to let your AI CFO
analyze your portfolio.

[Connect Investments]
```

---

# 16. Debt Overview

If the user has debt:

```text
DEBT

Total Outstanding

₹2,84,000

Monthly Payments

₹18,400
```

Show:

```text
Credit Card      ₹42,000
Personal Loan    ₹1,80,000
Education Loan   ₹62,000
```

If no debt exists:

```text
DEBT

No outstanding debt.

Your current debt position is excellent.
```

Do not create unnecessary empty cards.

---

# 17. AI Recommendations

At the bottom of the dashboard:

```text
YOUR NEXT BEST MOVES
```

Show the top 3 financial actions.

Example:

```text
01

Build your emergency fund

You're currently 3.6 months away
from your recommended safety target.

[View Plan]
```

```text
02

Reduce discretionary spending

Dining and shopping increased 18%
this month.

[Analyze Spending]
```

```text
03

Increase your monthly investment

You have ₹4,800 of estimated
monthly surplus available.

[Optimize Investments]
```

The AI CFO should prioritize recommendations based on **financial impact**, not arbitrary suggestions.

---

# 18. Empty States

Empty states must be elegant.

Never show:

```text
No data found.
```

Instead:

```text
Your financial picture is waiting.

Connect your accounts or add your first
transaction to start building your CFO dashboard.

[Get Started]
```

For individual sections:

```text
No investment data yet.

Connect your investment account
to unlock portfolio analysis.
```

Do not fill empty space with fake data.

---

# 19. Loading States

Use skeleton loaders.

Example:

```text
████████████████
██████████
████████████████████
```

Avoid large spinners.

Dashboard loading should feel extremely fast.

Use progressive loading where possible:

1. Financial overview
2. Financial health
3. Cash flow
4. AI insights
5. Secondary data

---

# 20. Responsive Design

### Desktop

Use a maximum content width.

Avoid excessive empty space.

Recommended structure:

```text
Main Dashboard

Overview
        4 cards

Financial Health + Cash Flow
        2-column layout

Spending + Budget
        2-column layout

AI Insights
        3-column cards

Goals + Upcoming
        2-column layout

Investments + Debt
        2-column layout
```

### Tablet

Collapse two-column sections where necessary.

### Mobile

Everything becomes a single column.

Priority order:

```text
Header
↓
Net Worth
↓
Cash Flow
↓
Financial Health
↓
AI Insights
↓
Spending
↓
Budget
↓
Goals
↓
Upcoming
↓
Investments
↓
Debt
```

Do not simply shrink the desktop layout.

Reflow the content intelligently.

---

# 21. Mobile Navigation

Mobile header:

```text
☰     The The Almanac       👤
```

Menu opens as a drawer.

Navigation:

```text
Dashboard

Transactions

Budgets

Goals

Investments

Debt

AI CFO

Reports

────────────

Settings

Logout
```

---

# 22. Sidebar Navigation

Desktop expanded:

```text
The The Almanac

Dashboard
Transactions
Budgets
Goals
Investments
Debt
AI CFO
Reports

────────────

Settings
```

Collapsed:

```text
◉
⌁
◫
◎
◈
◇
✦
▤

────────

⚙
```

Use tooltips for collapsed navigation.

---

# 23. Animations

Use **Framer Motion** only where it improves UX.

Recommended:

- Sidebar collapse
- Mobile drawer
- Card entrance
- Number transitions
- Chart transitions
- Modal transitions
- Hover states

Animations should be:

- Fast
- Subtle
- Smooth

Avoid:

- Excessive bouncing
- Large scale animations
- Long transitions
- Decorative animations
- Constant motion

The product should feel **buttery smooth, not flashy**.

---

# 24. Typography

Use the project's existing typography.

Hierarchy:

```text
Dashboard title
↓
Section title
↓
Metric
↓
Supporting information
↓
Metadata
```

Financial numbers should have strong visual hierarchy.

Example:

```text
₹4,82,500
```

should immediately stand out more than:

```text
Net Worth
```

But avoid enormous typography.

---

# 25. Cards

Cards should be **compact**.

Avoid:

```text
Huge card
        ↓
Large empty space
        ↓
Tiny amount of information
```

Instead:

```text
┌─────────────────────────────┐
│ NET WORTH                    │
│                             │
│ ₹4,82,500                   │
│ ↑ 6.2% vs last month        │
└─────────────────────────────┘
```

Cards should contain only information that helps decision-making.

---

# 26. Dashboard Density

The dashboard should prioritize **information density without feeling crowded**.

Every section must answer one of these questions:

> Where am I financially?

> Where is my money going?

> Am I improving?

> What needs attention?

> What should I do next?

If a component does not answer one of these questions, remove it.

---

# 27. AI Interaction

Include a persistent but subtle AI CFO entry point.

Example:

```text
✦ Ask your CFO
```

Clicking it opens:

```text
┌───────────────────────────────────────┐
│ AI CFO                                │
│                                       │
│ What would you like to know?          │
│                                       │
│ "Can I afford a ₹20,000 purchase?"    │
│ "Why did I overspend this month?"     │
│ "How can I save ₹10,000 more?"        │
│                                       │
│ Ask anything...                 →     │
└───────────────────────────────────────┘
```

The AI should have access to the user's financial context.

---

# 28. Quick Actions

Keep quick actions minimal.

Recommended:

```text
+ Add Transaction

+ Add Goal

Ask CFO
```

Do not create 10+ shortcut buttons.

---

# 29. Notifications

Notifications should only contain meaningful financial events.

Examples:

```text
Your spending exceeded your monthly
budget by 8%.

Your SIP is scheduled for tomorrow.

Your emergency fund reached 3 months
of expenses.

Your portfolio dropped 4.2% this week.
```

Avoid generic notifications.

---

# 30. Accessibility

The dashboard must support:

- Keyboard navigation
- Visible focus states
- Screen readers
- Proper semantic HTML
- Accessible chart labels
- Sufficient contrast
- Reduced-motion preference

Do not rely only on color to communicate financial status.

---

# 31. Performance

The dashboard should feel instantaneous.

Requirements:

- Lazy-load secondary sections
- Avoid unnecessary API requests
- Cache financial summaries
- Debounce search
- Virtualize long transaction lists
- Avoid unnecessary re-renders
- Memoize expensive calculations
- Optimize chart rendering
- Use skeleton states

Target:

```text
Initial dashboard render: < 1.5s
Interactive: < 2s
```

Where technically achievable.

---

# 32. Data Architecture

Dashboard data should preferably come from a consolidated endpoint rather than making many independent requests.

Example conceptual response:

```json
{
  "overview": {},
  "financial_health": {},
  "cash_flow": {},
  "spending": {},
  "budget": {},
  "goals": [],
  "insights": [],
  "upcoming_transactions": [],
  "recent_transactions": [],
  "investments": {},
  "debt": {}
}
```

The frontend should not independently calculate core financial metrics if the backend already provides authoritative values.

---

# 33. Error Handling

If one dashboard section fails:

**Do not break the entire dashboard.**

Example:

```text
AI Insights

Unable to load insights right now.

[Retry]
```

Other sections should continue working.

---

# 34. Security

Never expose sensitive financial information unnecessarily.

The dashboard must:

- Respect authentication
- Respect authorization
- Never expose another user's data
- Avoid sensitive information in URLs
- Avoid storing sensitive financial data in localStorage unless necessary
- Handle expired sessions gracefully

---

# 35. Final Dashboard Structure

The final dashboard should follow this structure:

```text
┌──────────────────────────────────────────────────┐
│ SIDEBAR │ Header                                 │
├─────────┴────────────────────────────────────────┤
│                                                  │
│ Good afternoon, Divy                             │
│ Here's your financial picture for August.       │
│                                                  │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│ │ Net    │ │ Cash   │ │ Savings│ │ Spend  │     │
│ │ Worth  │ │ Flow   │ │ Rate   │ │        │     │
│ └────────┘ └────────┘ └────────┘ └────────┘     │
│                                                  │
│ ┌─────────────────┐ ┌────────────────────────┐   │
│ │ Financial Health│ │ Cash Flow              │   │
│ │                 │ │                        │   │
│ │     82/100      │ │       CHART            │   │
│ └─────────────────┘ └────────────────────────┘   │
│                                                  │
│ ┌─────────────────┐ ┌────────────────────────┐   │
│ │ Spending        │ │ Budget                 │   │
│ │ Breakdown       │ │ Status                 │   │
│ └─────────────────┘ └────────────────────────┘   │
│                                                  │
│ AI CFO INSIGHTS                                  │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│ │ Insight 01 │ │ Insight 02 │ │ Insight 03 │    │
│ └────────────┘ └────────────┘ └────────────┘    │
│                                                  │
│ ┌─────────────────┐ ┌────────────────────────┐   │
│ │ Financial Goals │ │ Upcoming Transactions  │   │
│ └─────────────────┘ └────────────────────────┘   │
│                                                  │
│ ┌─────────────────┐ ┌────────────────────────┐   │
│ │ Investments     │ │ Debt                   │   │
│ └─────────────────┘ └────────────────────────┘   │
│                                                  │
│ YOUR NEXT BEST MOVES                             │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

# 36. Golden Rule

## LESS UI. MORE INTELLIGENCE.

The dashboard should **not** try to show every piece of financial information simultaneously.

The hierarchy is:

```text
Financial Position
        ↓
Financial Performance
        ↓
Problems
        ↓
AI Insights
        ↓
Recommended Actions
```

The user's first 5 seconds on the dashboard should tell them:

**1. How much money do I have?**

**2. Am I financially healthy?**

**3. Am I saving or overspending?**

**4. What needs my attention?**

**5. What should I do next?**

Everything else is secondary.

---

# 37. Definition of Done

The dashboard is complete only when:

- [ ] Existing theme is preserved exactly
- [ ] Sidebar is collapsible
- [ ] Sidebar works on desktop and mobile
- [ ] Dashboard is fully responsive
- [ ] No unnecessary empty spaces
- [ ] No excessive cards
- [ ] No excessive colors
- [ ] No unnecessary gradients
- [ ] No fake financial data
- [ ] Loading states exist
- [ ] Empty states exist
- [ ] Error states exist
- [ ] Financial metrics are clearly prioritized
- [ ] Cash-flow visualization works
- [ ] Spending breakdown works
- [ ] Budget tracking works
- [ ] Goals work
- [ ] AI insights work
- [ ] Transactions work
- [ ] Investments work
- [ ] Debt section works
- [ ] AI CFO interaction works
- [ ] Framer Motion is used only where beneficial
- [ ] Accessibility is considered
- [ ] Performance is optimized
- [ ] Components are reusable
- [ ] API calls are clean and maintainable
- [ ] No unnecessary duplication
- [ ] Mobile experience feels native
- [ ] Desktop experience feels premium

## Core Product Feeling

When the user logs in, the experience should feel like:

> **"My personal CFO has already analyzed my finances and is telling me what actually matters."**