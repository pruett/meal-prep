import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/brand-warmth')({
  component: BrandWarmth,
})

/*
 * CONCEPT 1: "PrepChef"
 * Direction: Warm, nurturing, kitchen companion
 * Font: Nunito — rounded terminals, inherently friendly
 * Palette: Warm cream + terracotta coral + sage accent
 * Personality: Like a warm kitchen hug from your best friend
 */

function Swatch({ color, name, hex }: { color: string; name: string; hex: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="size-16 rounded-2xl shadow-sm ring-1 ring-black/5"
        style={{ backgroundColor: color }}
      />
      <span style={{ fontFamily: "'Nunito Variable', sans-serif", fontSize: 13, fontWeight: 600, color: '#3D2E2A' }}>
        {name}
      </span>
      <span style={{ fontFamily: "'Nunito Variable', sans-serif", fontSize: 11, color: '#9B8A82', letterSpacing: '0.02em' }}>
        {hex}
      </span>
    </div>
  )
}

function BrandWarmth() {
  return (
    <div style={{ backgroundColor: '#FFF9F5', minHeight: '100vh', fontFamily: "'Nunito Variable', sans-serif" }}>
      {/* Nav */}
      <nav
        style={{
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #F0E6DE',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28, lineHeight: 1 }}>🍳</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#3D2E2A', letterSpacing: '-0.02em' }}>
            PrepChef
          </span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#9B8A82' }}>My Meals</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#9B8A82' }}>Prep Guide</span>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: '#E8764B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            KP
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '60px 32px 100px' }}>
        {/* Hero */}
        <header style={{ marginBottom: 80, textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: 100,
              backgroundColor: '#FFF0E8',
              color: '#E8764B',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            Concept 1 — Warm & Nurturing
          </div>
          <h1
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: '#3D2E2A',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: 16,
            }}
          >
            PrepChef
          </h1>
          <p
            style={{
              fontSize: 22,
              fontWeight: 500,
              color: '#9B8A82',
              maxWidth: 480,
              margin: '0 auto',
              lineHeight: 1.5,
            }}
          >
            Your friendly kitchen companion. Meal prep made simple, so you can spend less time
            stressing and more time living.
          </p>
        </header>

        {/* Color Palette */}
        <section style={{ marginBottom: 72 }}>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#9B8A82',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            Color Palette
          </h2>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Swatch color="#FFF9F5" name="Cream" hex="#FFF9F5" />
            <Swatch color="#3D2E2A" name="Espresso" hex="#3D2E2A" />
            <Swatch color="#E8764B" name="Coral" hex="#E8764B" />
            <Swatch color="#FFF0E8" name="Peach" hex="#FFF0E8" />
            <Swatch color="#D4A574" name="Caramel" hex="#D4A574" />
            <Swatch color="#7DB87D" name="Sage" hex="#7DB87D" />
            <Swatch color="#F5EDE8" name="Linen" hex="#F5EDE8" />
            <Swatch color="#9B8A82" name="Muted" hex="#9B8A82" />
          </div>
        </section>

        {/* Typography */}
        <section style={{ marginBottom: 72 }}>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#9B8A82',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            Typography — Nunito
          </h2>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 40,
              border: '1px solid #F0E6DE',
            }}
          >
            <div style={{ marginBottom: 32 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9B8A82', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Display — 48px / 900
              </span>
              <p style={{ fontSize: 48, fontWeight: 900, color: '#3D2E2A', letterSpacing: '-0.03em', lineHeight: 1.15, marginTop: 8 }}>
                What's for dinner?
              </p>
            </div>
            <div style={{ marginBottom: 32 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9B8A82', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Heading — 28px / 800
              </span>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#3D2E2A', letterSpacing: '-0.02em', lineHeight: 1.3, marginTop: 8 }}>
                This week's meal plan is ready
              </p>
            </div>
            <div style={{ marginBottom: 32 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9B8A82', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Subheading — 20px / 700
              </span>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#3D2E2A', letterSpacing: '-0.01em', lineHeight: 1.4, marginTop: 8 }}>
                7 meals planned, 3 hours of prep time
              </p>
            </div>
            <div style={{ marginBottom: 32 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9B8A82', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Body — 16px / 500
              </span>
              <p style={{ fontSize: 16, fontWeight: 500, color: '#5C4D47', lineHeight: 1.6, marginTop: 8, maxWidth: 560 }}>
                PrepChef takes the guesswork out of weekly meal planning. Tell us what your family
                loves, and we'll handle the rest — recipes, shopping lists, and step-by-step prep guides.
              </p>
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9B8A82', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Label — 13px / 700
              </span>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#9B8A82', letterSpacing: '0.02em', lineHeight: 1.4, marginTop: 8 }}>
                PREP TIME: 45 MIN · SERVES 4 · KID-FRIENDLY
              </p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section style={{ marginBottom: 72 }}>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#9B8A82',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            Buttons
          </h2>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 40,
              border: '1px solid #F0E6DE',
              display: 'flex',
              flexDirection: 'column',
              gap: 32,
            }}
          >
            {/* Primary buttons */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9B8A82', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>
                Primary — Big, safe, welcoming
              </span>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  style={{
                    backgroundColor: '#E8764B',
                    color: 'white',
                    border: 'none',
                    borderRadius: 100,
                    padding: '16px 36px',
                    fontSize: 17,
                    fontWeight: 700,
                    fontFamily: "'Nunito Variable', sans-serif",
                    cursor: 'pointer',
                    boxShadow: '0 2px 12px rgba(232, 118, 75, 0.3)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Plan My Week
                </button>
                <button
                  style={{
                    backgroundColor: '#E8764B',
                    color: 'white',
                    border: 'none',
                    borderRadius: 100,
                    padding: '14px 28px',
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: "'Nunito Variable', sans-serif",
                    cursor: 'pointer',
                    boxShadow: '0 2px 12px rgba(232, 118, 75, 0.3)',
                  }}
                >
                  Get Started
                </button>
                <button
                  style={{
                    backgroundColor: '#E8764B',
                    color: 'white',
                    border: 'none',
                    borderRadius: 100,
                    padding: '10px 20px',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "'Nunito Variable', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Add Meal
                </button>
              </div>
            </div>

            {/* Secondary buttons */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9B8A82', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>
                Secondary — Gentle, soft
              </span>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  style={{
                    backgroundColor: '#FFF0E8',
                    color: '#E8764B',
                    border: 'none',
                    borderRadius: 100,
                    padding: '16px 36px',
                    fontSize: 17,
                    fontWeight: 700,
                    fontFamily: "'Nunito Variable', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Browse Recipes
                </button>
                <button
                  style={{
                    backgroundColor: '#F5EDE8',
                    color: '#5C4D47',
                    border: 'none',
                    borderRadius: 100,
                    padding: '14px 28px',
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: "'Nunito Variable', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Maybe Later
                </button>
              </div>
            </div>

            {/* Outline buttons */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9B8A82', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>
                Outline — Light, secondary actions
              </span>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  style={{
                    backgroundColor: 'transparent',
                    color: '#5C4D47',
                    border: '2px solid #F0E6DE',
                    borderRadius: 100,
                    padding: '14px 28px',
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: "'Nunito Variable', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Edit Preferences
                </button>
                <button
                  style={{
                    backgroundColor: 'transparent',
                    color: '#9B8A82',
                    border: '2px solid #F0E6DE',
                    borderRadius: 100,
                    padding: '10px 20px',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "'Nunito Variable', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Skip
                </button>
              </div>
            </div>

            {/* Success / Accent */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9B8A82', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>
                Accent — Confirmation, success
              </span>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  style={{
                    backgroundColor: '#7DB87D',
                    color: 'white',
                    border: 'none',
                    borderRadius: 100,
                    padding: '16px 36px',
                    fontSize: 17,
                    fontWeight: 700,
                    fontFamily: "'Nunito Variable', sans-serif",
                    cursor: 'pointer',
                    boxShadow: '0 2px 12px rgba(125, 184, 125, 0.3)',
                  }}
                >
                  Looks Good!
                </button>
                <button
                  style={{
                    backgroundColor: '#EAF5EA',
                    color: '#5A9B5A',
                    border: 'none',
                    borderRadius: 100,
                    padding: '14px 28px',
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: "'Nunito Variable', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Done Prepping
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Sample UI */}
        <section style={{ marginBottom: 72 }}>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#9B8A82',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            Sample — Meal Card
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {/* Card 1 */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: 20,
                overflow: 'hidden',
                border: '1px solid #F0E6DE',
              }}
            >
              <div
                style={{
                  height: 160,
                  background: 'linear-gradient(135deg, #FFF0E8 0%, #FFE0D0 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 56,
                }}
              >
                🍝
              </div>
              <div style={{ padding: '20px 24px 24px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <span
                    style={{
                      backgroundColor: '#EAF5EA',
                      color: '#5A9B5A',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 100,
                    }}
                  >
                    Kid-Friendly
                  </span>
                  <span
                    style={{
                      backgroundColor: '#FFF0E8',
                      color: '#E8764B',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 100,
                    }}
                  >
                    30 min
                  </span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#3D2E2A', marginBottom: 6, letterSpacing: '-0.01em' }}>
                  One-Pot Pasta
                </h3>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#9B8A82', lineHeight: 1.5 }}>
                  Creamy tomato pasta the whole family will love. Ready in 30 minutes.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: 20,
                overflow: 'hidden',
                border: '1px solid #F0E6DE',
              }}
            >
              <div
                style={{
                  height: 160,
                  background: 'linear-gradient(135deg, #EAF5EA 0%, #D4EDDA 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 56,
                }}
              >
                🥗
              </div>
              <div style={{ padding: '20px 24px 24px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <span
                    style={{
                      backgroundColor: '#EAF5EA',
                      color: '#5A9B5A',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 100,
                    }}
                  >
                    Healthy
                  </span>
                  <span
                    style={{
                      backgroundColor: '#FFF0E8',
                      color: '#E8764B',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 100,
                    }}
                  >
                    15 min
                  </span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#3D2E2A', marginBottom: 6, letterSpacing: '-0.01em' }}>
                  Rainbow Bowl
                </h3>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#9B8A82', lineHeight: 1.5 }}>
                  Fresh grain bowl loaded with colorful veggies and a tangy dressing.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: 20,
                overflow: 'hidden',
                border: '1px solid #F0E6DE',
              }}
            >
              <div
                style={{
                  height: 160,
                  background: 'linear-gradient(135deg, #FFF5EB 0%, #FFE8D6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 56,
                }}
              >
                🌮
              </div>
              <div style={{ padding: '20px 24px 24px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <span
                    style={{
                      backgroundColor: '#FFF0E8',
                      color: '#E8764B',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 100,
                    }}
                  >
                    Family Fave
                  </span>
                  <span
                    style={{
                      backgroundColor: '#F5EDE8',
                      color: '#9B8A82',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 100,
                    }}
                  >
                    25 min
                  </span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#3D2E2A', marginBottom: 6, letterSpacing: '-0.01em' }}>
                  Taco Tuesday
                </h3>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#9B8A82', lineHeight: 1.5 }}>
                  Build-your-own taco bar. Prep the fillings ahead for easy assembly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sample UI — Week View */}
        <section>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#9B8A82',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            Sample — Week At a Glance
          </h2>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 32,
              border: '1px solid #F0E6DE',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <div>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: '#3D2E2A', letterSpacing: '-0.02em' }}>
                  This Week
                </h3>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#9B8A82', marginTop: 4 }}>
                  March 18 — March 24
                </p>
              </div>
              <button
                style={{
                  backgroundColor: '#E8764B',
                  color: 'white',
                  border: 'none',
                  borderRadius: 100,
                  padding: '12px 24px',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'Nunito Variable', sans-serif",
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(232, 118, 75, 0.25)',
                }}
              >
                Start Prepping
              </button>
            </div>

            {[
              { day: 'Mon', emoji: '🍝', meal: 'One-Pot Pasta', time: '30 min' },
              { day: 'Tue', emoji: '🌮', meal: 'Taco Tuesday', time: '25 min' },
              { day: 'Wed', emoji: '🥗', meal: 'Rainbow Bowl', time: '15 min' },
              { day: 'Thu', emoji: '🍗', meal: 'Lemon Chicken', time: '40 min' },
              { day: 'Fri', emoji: '🍕', meal: 'Pizza Night', time: '20 min' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 0',
                  borderTop: i === 0 ? 'none' : '1px solid #F5EDE8',
                }}
              >
                <div
                  style={{
                    width: 44,
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#9B8A82',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    flexShrink: 0,
                  }}
                >
                  {item.day}
                </div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: '#FFF0E8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    flexShrink: 0,
                  }}
                >
                  {item.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#3D2E2A' }}>{item.meal}</div>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#D4A574',
                    flexShrink: 0,
                  }}
                >
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
