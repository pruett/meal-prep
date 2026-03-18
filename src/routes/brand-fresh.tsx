import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/brand-fresh')({
  component: BrandFresh,
})

/*
 * CONCEPT 2: "YesChef"
 * Direction: Fresh, confident, approachable authority
 * Font: Plus Jakarta Sans — clean geometric, warm humanist touches
 * Palette: Sage greens + warm amber accent + clean neutrals
 * Personality: Like a confident best friend who happens to be a great cook
 */

function Swatch({ color, name, hex }: { color: string; name: string; hex: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="size-16 rounded-2xl shadow-sm ring-1 ring-black/5"
        style={{ backgroundColor: color }}
      />
      <span style={{ fontFamily: "'Plus Jakarta Sans Variable', sans-serif", fontSize: 13, fontWeight: 600, color: '#2C3E2C' }}>
        {name}
      </span>
      <span style={{ fontFamily: "'Plus Jakarta Sans Variable', sans-serif", fontSize: 11, color: '#7A8F7A', letterSpacing: '0.02em' }}>
        {hex}
      </span>
    </div>
  )
}

function BrandFresh() {
  return (
    <div style={{ backgroundColor: '#F8FAF6', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans Variable', sans-serif" }}>
      {/* Nav */}
      <nav
        style={{
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #E4EBE0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#2C3E2C', letterSpacing: '-0.03em' }}>
            yes<span style={{ color: '#4A7C59' }}>chef</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#7A8F7A' }}>This Week</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#7A8F7A' }}>Prep</span>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: '#4A7C59',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            KP
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '60px 32px 100px' }}>
        {/* Hero */}
        <header style={{ marginBottom: 80 }}>
          <div
            style={{
              display: 'inline-block',
              padding: '5px 14px',
              borderRadius: 8,
              backgroundColor: '#EDF4EE',
              color: '#4A7C59',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            Concept 2 — Fresh & Confident
          </div>
          <h1
            style={{
              fontSize: 60,
              fontWeight: 800,
              color: '#1A2E1A',
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              marginBottom: 16,
            }}
          >
            yes<span style={{ color: '#4A7C59' }}>chef</span>
          </h1>
          <p
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: '#7A8F7A',
              maxWidth: 500,
              lineHeight: 1.55,
            }}
          >
            Meal planning that actually works. Smart, simple, and built for the way real families eat.
          </p>
        </header>

        {/* Color Palette */}
        <section style={{ marginBottom: 72 }}>
          <h2
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#7A8F7A',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            Color Palette
          </h2>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Swatch color="#F8FAF6" name="Mint Cream" hex="#F8FAF6" />
            <Swatch color="#1A2E1A" name="Deep Forest" hex="#1A2E1A" />
            <Swatch color="#4A7C59" name="Sage" hex="#4A7C59" />
            <Swatch color="#EDF4EE" name="Light Sage" hex="#EDF4EE" />
            <Swatch color="#C4956A" name="Amber" hex="#C4956A" />
            <Swatch color="#FFF5EB" name="Warm Cream" hex="#FFF5EB" />
            <Swatch color="#E4EBE0" name="Mist" hex="#E4EBE0" />
            <Swatch color="#7A8F7A" name="Muted" hex="#7A8F7A" />
          </div>
        </section>

        {/* Typography */}
        <section style={{ marginBottom: 72 }}>
          <h2
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#7A8F7A',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            Typography — Plus Jakarta Sans
          </h2>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 40,
              border: '1px solid #E4EBE0',
            }}
          >
            <div style={{ marginBottom: 36 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#7A8F7A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Display — 52px / 800
              </span>
              <p style={{ fontSize: 52, fontWeight: 800, color: '#1A2E1A', letterSpacing: '-0.04em', lineHeight: 1.08, marginTop: 8 }}>
                Plan. Prep. Done.
              </p>
            </div>
            <div style={{ marginBottom: 36 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#7A8F7A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Heading — 28px / 700
              </span>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#1A2E1A', letterSpacing: '-0.02em', lineHeight: 1.25, marginTop: 8 }}>
                Your week is planned and ready to go
              </p>
            </div>
            <div style={{ marginBottom: 36 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#7A8F7A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Subheading — 18px / 600
              </span>
              <p style={{ fontSize: 18, fontWeight: 600, color: '#2C3E2C', letterSpacing: '-0.01em', lineHeight: 1.4, marginTop: 8 }}>
                5 meals planned, prep starts Sunday at 2pm
              </p>
            </div>
            <div style={{ marginBottom: 36 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#7A8F7A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Body — 15px / 400
              </span>
              <p style={{ fontSize: 15, fontWeight: 400, color: '#4A5E4A', lineHeight: 1.65, marginTop: 8, maxWidth: 540 }}>
                YesChef learns what your family loves and builds a weekly plan around your schedule,
                your budget, and your kitchen. No more "what's for dinner" stress.
              </p>
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#7A8F7A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Label — 12px / 700
              </span>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#7A8F7A', letterSpacing: '0.06em', lineHeight: 1.4, marginTop: 8, textTransform: 'uppercase' }}>
                Prep time: 45 min · Serves 4 · Budget-friendly
              </p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section style={{ marginBottom: 72 }}>
          <h2
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#7A8F7A',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            Buttons
          </h2>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 40,
              border: '1px solid #E4EBE0',
              display: 'flex',
              flexDirection: 'column',
              gap: 32,
            }}
          >
            {/* Primary */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#7A8F7A', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>
                Primary — Confident, grounded
              </span>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  style={{
                    backgroundColor: '#4A7C59',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '15px 32px',
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: "'Plus Jakarta Sans Variable', sans-serif",
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Plan This Week
                </button>
                <button
                  style={{
                    backgroundColor: '#4A7C59',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '13px 24px',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "'Plus Jakarta Sans Variable', sans-serif",
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Let's Go
                </button>
                <button
                  style={{
                    backgroundColor: '#4A7C59',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "'Plus Jakarta Sans Variable', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Secondary */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#7A8F7A', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>
                Secondary — Soft, supportive
              </span>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  style={{
                    backgroundColor: '#EDF4EE',
                    color: '#4A7C59',
                    border: 'none',
                    borderRadius: 12,
                    padding: '15px 32px',
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: "'Plus Jakarta Sans Variable', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  View Recipes
                </button>
                <button
                  style={{
                    backgroundColor: '#F0F2ED',
                    color: '#4A5E4A',
                    border: 'none',
                    borderRadius: 12,
                    padding: '13px 24px',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "'Plus Jakarta Sans Variable', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Not Now
                </button>
              </div>
            </div>

            {/* Outline */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#7A8F7A', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>
                Outline — Clean, minimal
              </span>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  style={{
                    backgroundColor: 'transparent',
                    color: '#2C3E2C',
                    border: '1.5px solid #D1DDD1',
                    borderRadius: 12,
                    padding: '14px 28px',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "'Plus Jakarta Sans Variable', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Adjust Preferences
                </button>
                <button
                  style={{
                    backgroundColor: 'transparent',
                    color: '#7A8F7A',
                    border: '1.5px solid #D1DDD1',
                    borderRadius: 10,
                    padding: '10px 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'Plus Jakarta Sans Variable', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Skip
                </button>
              </div>
            </div>

            {/* Warm accent */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#7A8F7A', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>
                Accent — Warm highlight
              </span>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  style={{
                    backgroundColor: '#C4956A',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '15px 32px',
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: "'Plus Jakarta Sans Variable', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Start Prepping
                </button>
                <button
                  style={{
                    backgroundColor: '#FFF5EB',
                    color: '#C4956A',
                    border: 'none',
                    borderRadius: 12,
                    padding: '13px 24px',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "'Plus Jakarta Sans Variable', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Remind Me
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Sample UI — Meal cards */}
        <section style={{ marginBottom: 72 }}>
          <h2
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#7A8F7A',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            Sample — Meal Lineup
          </h2>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              border: '1px solid #E4EBE0',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #E4EBE0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: '#1A2E1A', letterSpacing: '-0.02em' }}>
                  Week of March 18
                </h3>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#7A8F7A', marginTop: 2 }}>
                  5 meals · ~2.5 hrs prep
                </p>
              </div>
              <button
                style={{
                  backgroundColor: '#C4956A',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  padding: '11px 22px',
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "'Plus Jakarta Sans Variable', sans-serif",
                  cursor: 'pointer',
                }}
              >
                Prep Guide →
              </button>
            </div>

            {[
              { day: 'Monday', emoji: '🍝', meal: 'Creamy Tuscan Chicken Pasta', tags: ['Quick', 'Family'], time: '30m' },
              { day: 'Tuesday', emoji: '🌮', meal: 'Sheet Pan Chicken Fajitas', tags: ['Prep Ahead', 'Healthy'], time: '25m' },
              { day: 'Wednesday', emoji: '🥣', meal: 'Veggie-Loaded Minestrone', tags: ['Freezer-Friendly'], time: '20m' },
              { day: 'Thursday', emoji: '🍗', meal: 'Honey Garlic Drumsticks', tags: ['Kid-Friendly', 'Budget'], time: '35m' },
              { day: 'Friday', emoji: '🍕', meal: 'Homemade Pizza Night', tags: ['Fun', 'Family'], time: '30m' },
            ].map((item, i, arr) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '18px 28px',
                  borderBottom: i < arr.length - 1 ? '1px solid #F0F2ED' : 'none',
                }}
              >
                <div
                  style={{
                    width: 80,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#7A8F7A',
                    flexShrink: 0,
                  }}
                >
                  {item.day}
                </div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: '#EDF4EE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    flexShrink: 0,
                  }}
                >
                  {item.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2E1A', marginBottom: 4 }}>{item.meal}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#7A8F7A',
                          backgroundColor: '#F0F2ED',
                          padding: '2px 8px',
                          borderRadius: 6,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#C4956A',
                    flexShrink: 0,
                  }}
                >
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Sample UI — Prep Step */}
        <section>
          <h2
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#7A8F7A',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            Sample — Prep Checklist
          </h2>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 32,
              border: '1px solid #E4EBE0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#4A7C59',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                1
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A2E1A' }}>
                Chop all vegetables
              </h3>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#C4956A',
                  backgroundColor: '#FFF5EB',
                  padding: '4px 10px',
                  borderRadius: 6,
                }}
              >
                20 min
              </span>
            </div>

            {[
              { text: 'Dice 3 onions', done: true },
              { text: 'Mince 6 cloves of garlic', done: true },
              { text: 'Slice 2 bell peppers into strips', done: false },
              { text: 'Chop broccoli into florets', done: false },
            ].map((step, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderTop: i === 0 ? 'none' : '1px solid #F0F2ED',
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    border: step.done ? 'none' : '2px solid #D1DDD1',
                    backgroundColor: step.done ? '#4A7C59' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  {step.done && '✓'}
                </div>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: step.done ? 500 : 500,
                    color: step.done ? '#7A8F7A' : '#2C3E2C',
                    textDecoration: step.done ? 'line-through' : 'none',
                  }}
                >
                  {step.text}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
