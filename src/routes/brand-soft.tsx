import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/brand-soft')({
  component: BrandSoft,
})

/*
 * CONCEPT 3: "Tastebud"
 * Direction: Soft, elegant, refined simplicity
 * Font: Outfit — geometric with soul, clean but not cold
 * Palette: Warm earth tones — clay, oat, linen, with dusty rose accent
 * Personality: A beautiful cookbook come to life. Calm, elegant, effortless.
 */

function Swatch({ color, name, hex }: { color: string; name: string; hex: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="size-16 shadow-sm ring-1 ring-black/5"
        style={{ backgroundColor: color, borderRadius: 14 }}
      />
      <span style={{ fontFamily: "'Outfit Variable', sans-serif", fontSize: 13, fontWeight: 500, color: '#5C504A' }}>
        {name}
      </span>
      <span style={{ fontFamily: "'Outfit Variable', sans-serif", fontSize: 11, color: '#A89C94', letterSpacing: '0.03em' }}>
        {hex}
      </span>
    </div>
  )
}

function BrandSoft() {
  return (
    <div style={{ backgroundColor: '#FDFCFA', minHeight: '100vh', fontFamily: "'Outfit Variable', sans-serif" }}>
      {/* Nav */}
      <nav
        style={{
          padding: '22px 36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#2A2523',
            letterSpacing: '-0.04em',
          }}
        >
          tastebud
        </span>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#A89C94', letterSpacing: '-0.01em' }}>Meals</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#A89C94', letterSpacing: '-0.01em' }}>Prep</span>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: '#F0EBE5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#5C504A',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            KP
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '52px 36px 100px' }}>
        {/* Hero */}
        <header style={{ marginBottom: 88 }}>
          <div
            style={{
              display: 'inline-block',
              padding: '5px 14px',
              borderRadius: 8,
              backgroundColor: '#F5F0EB',
              color: '#A89C94',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            Concept 3 — Soft & Elegant
          </div>
          <h1
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: '#2A2523',
              lineHeight: 1.02,
              letterSpacing: '-0.05em',
              marginBottom: 20,
            }}
          >
            tastebud
          </h1>
          <p
            style={{
              fontSize: 21,
              fontWeight: 400,
              color: '#A89C94',
              maxWidth: 460,
              lineHeight: 1.55,
              letterSpacing: '-0.01em',
            }}
          >
            Effortless meal planning, beautifully simple. Less time deciding, more time enjoying meals together.
          </p>
        </header>

        {/* Color Palette */}
        <section style={{ marginBottom: 76 }}>
          <h2
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#A89C94',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 28,
            }}
          >
            Color Palette
          </h2>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            <Swatch color="#FDFCFA" name="Porcelain" hex="#FDFCFA" />
            <Swatch color="#2A2523" name="Charcoal" hex="#2A2523" />
            <Swatch color="#C17B5D" name="Clay" hex="#C17B5D" />
            <Swatch color="#F5F0EB" name="Linen" hex="#F5F0EB" />
            <Swatch color="#D4956E" name="Apricot" hex="#D4956E" />
            <Swatch color="#E6B8A2" name="Dusty Rose" hex="#E6B8A2" />
            <Swatch color="#8B9B7A" name="Olive" hex="#8B9B7A" />
            <Swatch color="#A89C94" name="Stone" hex="#A89C94" />
          </div>
        </section>

        {/* Typography */}
        <section style={{ marginBottom: 76 }}>
          <h2
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#A89C94',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 28,
            }}
          >
            Typography — Outfit
          </h2>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 18,
              padding: 44,
              border: '1px solid #EDE8E3',
            }}
          >
            <div style={{ marginBottom: 40 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#A89C94', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Display — 48px / 700
              </span>
              <p style={{ fontSize: 48, fontWeight: 700, color: '#2A2523', letterSpacing: '-0.04em', lineHeight: 1.08, marginTop: 10 }}>
                Made with love,
                <br />
                planned with ease
              </p>
            </div>
            <div style={{ marginBottom: 40 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#A89C94', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Heading — 26px / 600
              </span>
              <p style={{ fontSize: 26, fontWeight: 600, color: '#2A2523', letterSpacing: '-0.03em', lineHeight: 1.25, marginTop: 10 }}>
                Your week at a glance
              </p>
            </div>
            <div style={{ marginBottom: 40 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#A89C94', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Subheading — 18px / 500
              </span>
              <p style={{ fontSize: 18, fontWeight: 500, color: '#5C504A', letterSpacing: '-0.02em', lineHeight: 1.45, marginTop: 10 }}>
                Five recipes ready, Sunday prep takes about two hours
              </p>
            </div>
            <div style={{ marginBottom: 40 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#A89C94', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Body — 16px / 400
              </span>
              <p style={{ fontSize: 16, fontWeight: 400, color: '#6E6259', lineHeight: 1.7, marginTop: 10, maxWidth: 520 }}>
                Tastebud keeps meal planning calm and simple. Share what your family enjoys,
                and it builds your week — recipes, groceries, and a gentle step-by-step prep guide
                for Sunday afternoon.
              </p>
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#A89C94', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Label — 12px / 500
              </span>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#A89C94', letterSpacing: '0.08em', lineHeight: 1.4, marginTop: 10, textTransform: 'uppercase' }}>
                45 minutes · serves four · family favorite
              </p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section style={{ marginBottom: 76 }}>
          <h2
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#A89C94',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 28,
            }}
          >
            Buttons
          </h2>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 18,
              padding: 44,
              border: '1px solid #EDE8E3',
              display: 'flex',
              flexDirection: 'column',
              gap: 36,
            }}
          >
            {/* Primary */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#A89C94', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 18 }}>
                Primary — Warm, inviting
              </span>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  style={{
                    backgroundColor: '#C17B5D',
                    color: 'white',
                    border: 'none',
                    borderRadius: 14,
                    padding: '16px 36px',
                    fontSize: 16,
                    fontWeight: 600,
                    fontFamily: "'Outfit Variable', sans-serif",
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Plan My Week
                </button>
                <button
                  style={{
                    backgroundColor: '#C17B5D',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '13px 26px',
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: "'Outfit Variable', sans-serif",
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Get Started
                </button>
                <button
                  style={{
                    backgroundColor: '#C17B5D',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 20px',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "'Outfit Variable', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Secondary */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#A89C94', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 18 }}>
                Secondary — Gentle, neutral
              </span>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  style={{
                    backgroundColor: '#F5F0EB',
                    color: '#5C504A',
                    border: 'none',
                    borderRadius: 14,
                    padding: '16px 36px',
                    fontSize: 16,
                    fontWeight: 600,
                    fontFamily: "'Outfit Variable', sans-serif",
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Browse Recipes
                </button>
                <button
                  style={{
                    backgroundColor: '#F5F0EB',
                    color: '#A89C94',
                    border: 'none',
                    borderRadius: 12,
                    padding: '13px 26px',
                    fontSize: 15,
                    fontWeight: 500,
                    fontFamily: "'Outfit Variable', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Later
                </button>
              </div>
            </div>

            {/* Outline */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#A89C94', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 18 }}>
                Outline — Delicate, understated
              </span>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  style={{
                    backgroundColor: 'transparent',
                    color: '#5C504A',
                    border: '1.5px solid #E0D9D2',
                    borderRadius: 14,
                    padding: '15px 32px',
                    fontSize: 15,
                    fontWeight: 500,
                    fontFamily: "'Outfit Variable', sans-serif",
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Preferences
                </button>
                <button
                  style={{
                    backgroundColor: 'transparent',
                    color: '#A89C94',
                    border: '1.5px solid #E0D9D2',
                    borderRadius: 10,
                    padding: '10px 20px',
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: "'Outfit Variable', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Skip
                </button>
              </div>
            </div>

            {/* Accent / Rose */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#A89C94', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 18 }}>
                Accent — Soft rose, celebration
              </span>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  style={{
                    backgroundColor: '#E6B8A2',
                    color: 'white',
                    border: 'none',
                    borderRadius: 14,
                    padding: '16px 36px',
                    fontSize: 16,
                    fontWeight: 600,
                    fontFamily: "'Outfit Variable', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  All Done!
                </button>
                <button
                  style={{
                    backgroundColor: '#8B9B7A',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '13px 26px',
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: "'Outfit Variable', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Complete Step
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Sample UI — Minimal week view */}
        <section style={{ marginBottom: 76 }}>
          <h2
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#A89C94',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 28,
            }}
          >
            Sample — Week View
          </h2>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 18,
              padding: '36px 40px',
              border: '1px solid #EDE8E3',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 32 }}>
              <div>
                <h3 style={{ fontSize: 28, fontWeight: 700, color: '#2A2523', letterSpacing: '-0.03em' }}>
                  This week
                </h3>
                <p style={{ fontSize: 14, fontWeight: 400, color: '#A89C94', marginTop: 4, letterSpacing: '-0.01em' }}>
                  March 18 – 24
                </p>
              </div>
              <button
                style={{
                  backgroundColor: '#C17B5D',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'Outfit Variable', sans-serif",
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                }}
              >
                Start Prep
              </button>
            </div>

            {[
              { day: 'Mon', meal: 'Tuscan Chicken Pasta', note: '30 min · kid-friendly', color: '#C17B5D' },
              { day: 'Tue', meal: 'Sheet Pan Fajitas', note: '25 min · make-ahead', color: '#D4956E' },
              { day: 'Wed', meal: 'Minestrone Soup', note: '20 min · freezer-friendly', color: '#8B9B7A' },
              { day: 'Thu', meal: 'Honey Garlic Chicken', note: '35 min · family fave', color: '#E6B8A2' },
              { day: 'Fri', meal: 'Pizza Night', note: '30 min · fun for kids', color: '#C17B5D' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  padding: '18px 0',
                  borderTop: i === 0 ? 'none' : '1px solid #F5F0EB',
                }}
              >
                <div
                  style={{
                    width: 44,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#A89C94',
                    flexShrink: 0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.day}
                </div>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: item.color,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#2A2523', letterSpacing: '-0.02em' }}>
                    {item.meal}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 400, color: '#A89C94', marginTop: 2, letterSpacing: '-0.01em' }}>
                    {item.note}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sample UI — Empty State */}
        <section>
          <h2
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#A89C94',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 28,
            }}
          >
            Sample — Empty State
          </h2>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 18,
              padding: '64px 40px',
              border: '1px solid #EDE8E3',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: '#F5F0EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                margin: '0 auto 24px',
              }}
            >
              🍽️
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: '#2A2523', letterSpacing: '-0.03em', marginBottom: 8 }}>
              No meals planned yet
            </h3>
            <p style={{ fontSize: 16, fontWeight: 400, color: '#A89C94', maxWidth: 360, margin: '0 auto 28px', lineHeight: 1.6 }}>
              Tell us what your family loves, and we'll plan a delicious week for you.
            </p>
            <button
              style={{
                backgroundColor: '#C17B5D',
                color: 'white',
                border: 'none',
                borderRadius: 14,
                padding: '16px 36px',
                fontSize: 16,
                fontWeight: 600,
                fontFamily: "'Outfit Variable', sans-serif",
                cursor: 'pointer',
                letterSpacing: '-0.01em',
              }}
            >
              Plan My First Week
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
