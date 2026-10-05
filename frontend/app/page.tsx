"use client";

import { useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useReveal, useStagger } from "@/lib/use-reveal";
import {
  DollarSign,
  TrendingUp,
  Target,
  Shield,
  Zap,
  Eye,
  BarChart2,
  RefreshCw,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Layers,
  Upload,
  Cpu,
  Lightbulb,
} from "lucide-react";

// ── Inline GitHub SVG (removed from lucide-react v1.x) ───────────────────────
function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

// ── Corner brackets ───────────────────────────────────────────────────────────
function Corners({ accent = false }: { accent?: boolean }) {
  return (
    <>
      <span className={`cfo-corner cfo-corner--tl${accent ? " cfo-corner--accent" : ""}`} aria-hidden="true" />
      <span className="cfo-corner cfo-corner--tr" aria-hidden="true" />
      <span className="cfo-corner cfo-corner--bl" aria-hidden="true" />
      <span className={`cfo-corner cfo-corner--br${accent ? " cfo-corner--accent" : ""}`} aria-hidden="true" />
    </>
  );
}

// ── Section kicker label ──────────────────────────────────────────────────────
function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="cfo-kicker">{children}</p>;
}

// ── Floating metric card (hero) ───────────────────────────────────────────────
function MetricCard({ label, value, sub, delay = 0 }: {
  label: string; value: string; sub?: string; delay?: number;
}) {
  return (
    <div className="lp-metric-card" style={{ animationDelay: `${delay}s` }}>
      <Corners accent />
      <p className="lp-metric-label">{label}</p>
      <p className="lp-metric-value">{value}</p>
      {sub && <p className="lp-metric-sub">{sub}</p>}
    </div>
  );
}

// ── Pain card ─────────────────────────────────────────────────────────────────
function PainCard({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="lp-pain-card">
      <Icon size={16} className="lp-pain-icon" />
      <p className="lp-pain-text">{text}</p>
    </div>
  );
}

// ── Solution pillar ───────────────────────────────────────────────────────────
function Pillar({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="lp-pillar">
      <Corners accent />
      <div className="lp-pillar-icon-wrap"><Icon size={20} /></div>
      <h3 className="lp-pillar-title">{title}</h3>
      <p className="lp-pillar-desc">{desc}</p>
    </div>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, soon }: {
  icon: React.ElementType; title: string; desc: string; soon?: boolean;
}) {
  return (
    <div className="lp-feature-card">
      <Corners />
      <div className="lp-feature-top">
        <Icon size={16} className="lp-feature-icon" />
        {soon && <span className="cfo-badge cfo-badge--warn">Soon</span>}
      </div>
      <h3 className="lp-feature-title">{title}</h3>
      <p className="lp-feature-desc">{desc}</p>
    </div>
  );
}

// ── How-it-works step ─────────────────────────────────────────────────────────
function HowStep({ num, icon: Icon, title, desc }: {
  num: string; icon: React.ElementType; title: string; desc: string;
}) {
  return (
    <div className="lp-how-step">
      <span className="lp-how-num">{num}</span>
      <div className="lp-how-icon-wrap"><Icon size={22} /></div>
      <h3 className="lp-how-title">{title}</h3>
      <p className="lp-how-desc">{desc}</p>
    </div>
  );
}

// ── Roadmap step ──────────────────────────────────────────────────────────────
function RoadStep({ label, done, active }: { label: string; done?: boolean; active?: boolean }) {
  return (
    <div className="lp-road-step">
      <span className={`lp-road-dot${done ? " lp-road-dot--done" : active ? " lp-road-dot--active" : ""}`} aria-hidden="true">
        {done && <CheckCircle2 size={11} />}
        {active && <span className="lp-road-pulse" />}
      </span>
      <span className={`lp-road-label${done ? " lp-road-label--done" : active ? " lp-road-label--active" : ""}`}>
        {label}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Scroll-reveal refs — fonts + classes from globals.css / cfo-* system
  const heroRef = useReveal(0.05);
  const problemRef = useReveal();
  const solutionRef = useReveal();
  const capRef = useReveal();
  const howRef = useReveal();
  const whoRef = useReveal();
  const roadRef = useReveal();
  const ctaRef = useReveal();
  const featureRefs = useStagger(8, 75);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    /* cfo-root applies the design-system context (colors, fonts, selection) */
    <div className="cfo-root">

      {/* Background decoration — grid + vertical guide */}
      <div className="cfo-grid" aria-hidden="true" />
      <div className="cfo-guide cfo-guide--v" aria-hidden="true" />

      {/* ════════════════════════════════════════════════════════════════
          TOP BAR  —  uses .cfo-top / .cfo-brand / .cfo-pulse
          ════════════════════════════════════════════════════════════════ */}
      <header className="cfo-top">
        <p className="cfo-brand">CFO <span>{"//"}</span> SYSTEM</p>
        <p className="cfo-top-meta">
          <span><span className="cfo-pulse" aria-hidden="true" />SYS.READY</span>
          <span>LEDGER / INR</span>
          <span className="cfo-hide-sm">v0.1.0</span>
          <ThemeToggle />
        </p>
      </header>

      {/* ════════════════════════════════════════════════════════════════
          § 1 — HERO
          ════════════════════════════════════════════════════════════════ */}
      <section className="lp-hero">
        <div ref={heroRef} className="cfo-reveal lp-hero-inner">
          <div className="lp-hero-copy">
            {/* <Kicker>Almanac · Private financial intelligence</Kicker> */}
            <h1 className="lp-hero-title">
              Your private<br />AI CFO.<br />
              <em>Finally understand</em><br />your money.
            </h1>
            <p className="lp-hero-lede">
              Know your real cash position across every account. Spot where money leaks.
              Track goals that matter.
            </p>
            <div className="lp-hero-actions">
              <a href="#waitlist" className="cfo-btn cfo-btn--ghost">
                Join the waitlist <ArrowRight size={15} />
              </a>
              <a href="/signin" className="cfo-btn cfo-btn--ghost">
                Jump right In ! <ArrowRight size={15} />
              </a>
              {/* <span className="lp-hero-support">No spam · Early access only · Built in India</span> */}
            </div>
            <p className="cfo-coords">
              19.0760° N · 72.8777° E<br />
              REF. PERSONAL-CFO / 0.1.0
            </p>
          </div>

          {/* Floating metric cards */}
          <div className="lp-hero-cards">
            <MetricCard label="Cash Position" value="₹4,82,300" sub="Across 5 accounts" delay={0} />
            <MetricCard label="Goal Progress" value="67%" sub="Emergency fund · ₹3L target" delay={0.2} />
            <MetricCard label="Next Action" value="₹8,500 leak" sub="Subscriptions · Review now" delay={0.4} />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          § 2 — PROBLEM
          ════════════════════════════════════════════════════════════════ */}
      <section className="cfo-section">
        <div ref={problemRef} className="cfo-reveal cfo-container">
          <div className="lp-section-head">
            <Kicker>The Problem</Kicker>
            <h2 className="lp-section-title">
              Most finance apps only show you<br />
              <span className="cfo-dim">what already happened.</span>
            </h2>
          </div>

          <div className="lp-pain-grid">
            <PainCard icon={AlertCircle} text="You have savings, FDs, credit cards, and UPI wallets — but no single view of what you actually own." />
            <PainCard icon={AlertCircle} text="₹3,000 a month quietly draining through forgotten subscriptions and duplicate services? You'll never know." />
            <PainCard icon={AlertCircle} text="Your net worth is a mystery — credit card balances offset savings but no app connects the dots." />
            <PainCard icon={AlertCircle} text="You set a savings goal last January. You have no idea if you're on track — or why you're not." />
          </div>

          <p className="lp-closing-line">
            You don&apos;t need more charts.{" "}
            <strong>You need a financial co-pilot.</strong>
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          § 3 — SOLUTION
          ════════════════════════════════════════════════════════════════ */}
      <section className="cfo-section cfo-section--alt">
        <div ref={solutionRef} className="cfo-reveal cfo-container">
          <div className="lp-section-head">
            <Kicker>The Solution</Kicker>
            <h2 className="lp-section-title">
              Almanac —<br />
              <em>your private financial co-pilot</em>
            </h2>
            <p className="lp-section-lede">
              Not another budgeting tracker. A quiet, intelligent layer that reads your full
              financial picture and tells you what to do next — in plain language, with your numbers.
            </p>
          </div>

          <div className="lp-pillar-grid">
            <Pillar icon={Eye} title="True Cash Position" desc="Aggregates balances across savings, current, FDs, credit cards, and wallets into a single, honest number." />
            <Pillar icon={Zap} title="Pattern Detection" desc="Automatically classifies spending, finds recurring leaks, and surfaces the patterns that cost you most." />
            <Pillar icon={Target} title="Goal Intelligence" desc="Tracks goals with real-time progress and tells you the exact monthly adjustments needed to stay on track." />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          § 4 — CAPABILITIES
          ════════════════════════════════════════════════════════════════ */}
      <section className="cfo-section">
        <div ref={capRef} className="cfo-reveal cfo-container">
          <div className="lp-section-head">
            <Kicker>Capabilities</Kicker>
            <h2 className="lp-section-title">Everything your finances actually need</h2>
          </div>

          <div className="lp-feature-grid">
            {[
              { icon: Layers, title: "Real Cash Position", desc: "Unified view across all account types — savings, FDs, credit cards, wallets.", soon: false },
              { icon: RefreshCw, title: "Auto Classification", desc: "Transactions are automatically categorised so you never tag things manually.", soon: false },
              { icon: TrendingUp, title: "Cash-flow & Leak Detection", desc: "See where money flows and which recurring costs you can eliminate.", soon: false },
              { icon: Target, title: "Goal Tracking", desc: "Set goals with timelines and let the CFO calculate exactly what's needed.", soon: false },
              { icon: DollarSign, title: "Net-worth View", desc: "Assets minus liabilities, updated with each import, in ₹.", soon: false },
              { icon: BarChart2, title: "Cash-flow Forecasts", desc: "Project next-month cash position based on patterns and known commitments.", soon: true },
              { icon: MessageSquare, title: "Conversational CFO Agent", desc: "Ask questions in plain language. Get answers from your actual data.", soon: true },
              { icon: Shield, title: "Private by Design", desc: "Your data never leaves your control. No third-party data sales, ever.", soon: false },
            ].map((f, i) => (
              <div key={i} ref={(el) => { featureRefs.current[i] = el; }} className="cfo-reveal">
                <FeatureCard icon={f.icon} title={f.title} desc={f.desc} soon={f.soon} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          § 5 — HOW IT WORKS
          ════════════════════════════════════════════════════════════════ */}
      <section className="cfo-section cfo-section--alt">
        <div ref={howRef} className="cfo-reveal cfo-container">
          <div className="lp-section-head">
            <Kicker>How It Works</Kicker>
            <h2 className="lp-section-title">Four steps to financial clarity</h2>
          </div>

          <div className="lp-how-grid">
            <HowStep num="01" icon={Upload} title="Connect / Import" desc="Upload statements or connect accounts. No compulsory linking." />
            <HowStep num="02" icon={Cpu} title="AI Classifies & Understands" desc="Every transaction is categorised and patterns are identified automatically." />
            <HowStep num="03" icon={Eye} title="See the Truth" desc="Your real cash position, net worth, and spending profile — all in one place." />
            <HowStep num="04" icon={Lightbulb} title="Get Next Actions" desc="Clear, prioritised steps specific to your numbers, not generic advice." />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          § 6 — WHO IT'S FOR
          ════════════════════════════════════════════════════════════════ */}
      <section className="cfo-section">
        <div ref={whoRef} className="cfo-reveal cfo-container">
          <div className="lp-section-head">
            <Kicker>Who It&apos;s For</Kicker>
            <h2 className="lp-section-title">
              Built for people who think<br />carefully about money
            </h2>
          </div>

          <div className="lp-who-grid">
            {[
              { emoji: "💼", title: "Young professionals", desc: "Earning well but unsure where it all goes. You want clarity, not more spreadsheets." },
              { emoji: "🏦", title: "Multi-account jugglers", desc: "Savings, current, FD, Zerodha, credit cards — you need a single source of truth." },
              { emoji: "🔐", title: "Privacy-first users", desc: "You won't hand your bank login to a third-party app. INR is your default currency." },
            ].map((item, i) => (
              <div key={i} className="lp-who-card">
                <Corners />
                <span className="lp-who-emoji">{item.emoji}</span>
                <h3 className="lp-who-title">{item.title}</h3>
                <p className="lp-who-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          § 7 — STATUS / ROADMAP
          ════════════════════════════════════════════════════════════════ */}
      <section className="cfo-section cfo-section--alt">
        <div ref={roadRef} className="cfo-reveal cfo-container">
          <div className="lp-section-head">
            <Kicker>Where We Are</Kicker>
            <h2 className="lp-section-title">
              Building honestly,<br />one layer at a time
            </h2>
            <p className="lp-section-lede">
              The backend infrastructure is live. Core financial intelligence features are actively being built.
              No launch hype — just steady progress.
            </p>
          </div>

          {/* .cfo-panel + .cfo-panel-head from the shared design system */}
          <div className="cfo-panel" style={{ maxWidth: "440px" }}>
            <Corners accent />
            <div className="cfo-panel-head">
              <strong>ROADMAP</strong>
              <span>REF. CFO / 0.1</span>
            </div>
            <div className="lp-road-steps">
              <RoadStep label="Backend & data infrastructure" done />
              <RoadStep label="Transaction import & auto-classification" active />
              <RoadStep label="Cash position & net-worth engine" />
              <RoadStep label="Goal tracking & forecast engine" />
              <RoadStep label="Conversational CFO agent" />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          § 8 — WAITLIST CTA
          ════════════════════════════════════════════════════════════════ */}
      <section id="waitlist" className="cfo-section">
        <div ref={ctaRef} className="cfo-reveal cfo-container lp-cta-inner">
          <div className="lp-section-head">
            <Kicker>Early Access</Kicker>
            <h2 className="lp-section-title">
              Get access before<br />the public launch
            </h2>
            <p className="lp-section-lede">No spam. Just early access and progress updates.</p>
          </div>

          <div className="lp-cta-form-wrap">
            {/* .cfo-panel + .cfo-panel-head from shared design system */}
            <div className="cfo-panel" style={{ width: "100%", maxWidth: "420px" }}>
              <Corners accent />
              <div className="cfo-panel-head">
                <strong>WAITLIST / FORM</strong>
                <span>CHANNEL · HTTPS</span>
              </div>

              {submitted ? (
                <div className="lp-submitted">
                  <CheckCircle2 size={28} className="lp-submitted-icon" />
                  <p className="lp-submitted-title">You&apos;re on the list.</p>
                  <p className="lp-submitted-sub">We&apos;ll reach out when early access opens.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="lp-waitlist-form">
                  {/* .cfo-field / .cfo-label / .cfo-input from shared design system */}
                  <div className="cfo-field">
                    <label className="cfo-label" htmlFor="lp-email">EMAIL</label>
                    <input
                      id="lp-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="cfo-input"
                    />
                  </div>
                  {/* .cfo-btn from shared design system */}
                  <button type="submit" className="cfo-btn cfo-btn--ghost cfo-btn--full">
                    JOIN WAITLIST
                  </button>
                  <p className="lp-form-note">Your data is never shared. Unsubscribe any time.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          § 9 — FOOTER  —  uses .cfo-foot from shared design system
          ════════════════════════════════════════════════════════════════ */}
      <footer className="cfo-foot">
        <div className="cfo-foot-left">
          <span className="cfo-brand">CFO <span>{"//"}</span> SYSTEM</span>
          <span className="cfo-foot-tag">Calm financial clarity. Powered by AI.</span>
        </div>
        <div className="cfo-foot-right">
          <a
            href="https://github.com/divydoesnotcode/ai-personal-CFO"
            target="_blank"
            rel="noopener noreferrer"
            className="cfo-foot-link"
          >
            <GithubIcon size={13} />
            GITHUB
          </a>
          <span className="cfo-foot-copy">© {new Date().getFullYear()} ALL RIGHTS RESERVED</span>
        </div>
      </footer>
    </div>
  );
}
