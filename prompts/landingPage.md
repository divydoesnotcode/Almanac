You are an expert Next.js + CSS frontend engineer specializing in premium, conversion-focused landing pages.

Create a complete, production-ready landing page for the project **The The Almanac**.

### STRICT RULES
- ONLY frontend changes. No backend, no API calls, no authentication, no database.
- This is the root page (`app/page.tsx`). It must always be the first page users see.
- NO navbar at all. No header navigation links.
- Fully scrollable single-page experience.
- Use subtle parallax effects (either on background layers or on text/elements) that feel elegant and premium — not flashy or distracting.
- Keep the visual design and theme 100% consistent with this direction:
  - Calm, intelligent, slightly premium tone (private banker × smart product)
  - Clean, generous whitespace
  - Soft gradients (charcoal / deep navy → soft blue-green accents)
  - Optional subtle glassmorphism on cards
  - Dark-mode friendly by default (prefer dark theme)
  - Soft blues, teals, and charcoal palette
  - Indian Rupee (₹) as the default currency in any example numbers
  - No hype language (“revolutionary”, “game-changing”, etc.)

### TECH STACK (must follow)
- Next.js App Router (app/page.tsx)
- React 19
- Use only client components where needed for parallax/animations
- Prefer Framer Motion or pure CSS for parallax and scroll effects
- No external UI libraries except what’s already common in the project (Recharts is available but not required here)
- Mobile-first, fully responsive

### PAGE STRUCTURE (exactly in this order)

1. **Hero Section** (full viewport height)
   - Big headline: “Your private AI CFO. Finally understand your money.”
   - Subheadline explaining real cash position, stopping leaks, tracking goals, and getting clear next steps from the actual ledger.
   - Primary CTA button: “Join the waitlist”
   - Secondary supporting line under the button.
   - Subtle parallax background or floating glass cards showing sample metrics (Cash Position, Goal Progress, Next Action) with ₹ values.

2. **Problem Section**
   - Headline: “Most finance apps only show you what already happened.”
   - 4 short pain-point cards or bullets.
   - Closing line: “You don’t need more charts. You need a financial co-pilot.”

3. **Solution Section**
   - Headline introducing The The Almanac as a private financial co-pilot.
   - Short paragraph.
   - Three pillars with icons: True Cash Position • Pattern Detection • Goal Intelligence

4. **Key Capabilities Section**
   - Grid of 6–8 feature cards.
   - Include: real cash position across all account types, automatic classification, cash-flow & leak detection, goal tracking, net-worth view, forecasts, conversational CFO agent, private by design.
   - Mark some as “Coming soon” if it feels honest.

5. **How It Works**
   - 4 clean steps with numbers or icons:
     1. Connect / Import
     2. AI classifies & understands
     3. See the truth
     4. Get next actions

6. **Who It’s For**
   - Short section targeting young professionals, people juggling multiple account types, and users who prefer private tools with INR as default.

7. **Current Status / Roadmap**
   - Honest note that backend foundation is ready and product features are being built.
   - Mini visual roadmap (5 steps).

8. **Final CTA Section**
   - Strong headline + short email waitlist form (UI only — no real submission logic needed, just a controlled input + button).
   - Supporting text: “No spam. Just early access and progress updates.”

9. **Minimal Footer**
   - Project name + one-line tagline
   - GitHub link (use https://github.com/divydoesnotcode/ai-personal-CFO)
   - “All rights reserved”

### DESIGN & INTERACTION DETAILS
- Smooth scroll behavior.
- Parallax: either layered background gradients that move at different speeds, or subtle text/card parallax on scroll.
- Soft entrance animations as sections come into view (fade + slight upward movement).
- Hover states on cards and buttons should feel refined.
- Primary button style: solid soft teal/blue with subtle glow or soft shadow.
- Cards: slightly elevated with soft border or glass effect.
- Typography: clean, modern, excellent hierarchy (large bold headlines, readable body).
- Use Lucide React icons where helpful (or simple SVG icons).

### OUTPUT REQUIREMENTS
- Deliver the complete `app/page.tsx` (or the necessary component files if you split them).
- Include any required CSS (Tailwind classes preferred).
- Make the page look polished and production-ready out of the box.
- Add helpful comments in the code for the main sections.
- Ensure the page works perfectly on mobile, tablet, and desktop.

Do not add a navbar. Do not add any backend code. Do not change the content structure or the calm premium design language described above.