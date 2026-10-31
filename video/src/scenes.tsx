import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { BrandMark, BrowserFrame, Chip, Footage, PhoneFrame, Route, ease, pop } from './components';
import { FOOTAGE, type SceneId, type TimedScene } from './timeline';
import { C, FONT } from './theme';

const row: React.CSSProperties = { display: 'flex', flexDirection: 'row', alignItems: 'center' };

/* Fades each scene in and out so cuts dip gently into the shared backdrop. */
export const SceneShell: React.FC<{ scene: TimedScene; children: React.ReactNode }> = ({ scene, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10, scene.duration - 10, scene.duration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

/* ---------- 1. Problem ---------- */
const NODES: Array<{ code: string; x: number; y: number }> = [
  { code: 'MM', x: 1150, y: 230 },
  { code: 'TH', x: 1260, y: 360 },
  { code: 'LA', x: 1360, y: 290 },
  { code: 'VN', x: 1480, y: 400 },
  { code: 'KH', x: 1380, y: 470 },
  { code: 'MY', x: 1290, y: 640 },
  { code: 'SG', x: 1340, y: 720 },
  { code: 'BN', x: 1560, y: 640 },
  { code: 'PH', x: 1660, y: 430 },
  { code: 'ID', x: 1520, y: 820 },
];
const LINKS: Array<[number, number, boolean]> = [
  [5, 9, true],
  [6, 3, false],
  [1, 8, false],
  [5, 7, true],
  [2, 6, false],
  [4, 9, false],
];

export const ProblemScene: React.FC<{ scene: TimedScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const lines = [
    { text: 'Startups build what', at: 10 },
    { text: 'corporates need.', at: 22 },
  ];
  const pains = ['Slow', 'Opaque', 'Mostly luck'];
  return (
    <AbsoluteFill style={{ padding: '0 140px', fontFamily: FONT }}>
      <div style={{ position: 'absolute', top: 250, left: 140, width: 900 }}>
        {lines.map((l) => (
          <div
            key={l.text}
            style={{
              fontSize: 92,
              fontWeight: 800,
              lineHeight: 1.05,
              color: C.white,
              opacity: ease(frame, l.at),
              transform: `translateY(${(1 - ease(frame, l.at)) * 40}px)`,
            }}
          >
            {l.text}
          </div>
        ))}
        <div style={{ marginTop: 44, fontSize: 38, fontWeight: 500, color: C.muted, opacity: ease(frame, 110) }}>
          Landing a cross-border pilot is
        </div>
        <div style={{ ...row, gap: 18, marginTop: 20 }}>
          {pains.map((p, i) => {
            const s = pop(frame, 140 + i * 22);
            return (
              <span key={p} style={{ transform: `scale(${s})`, opacity: s }}>
                <Chip color="#FFB4B6" bg="rgba(229,72,77,0.16)" size={34}>
                  {p}
                </Chip>
              </span>
            );
          })}
        </div>
        <div style={{ marginTop: 56, fontSize: 40, fontWeight: 700, color: C.white, opacity: ease(frame, 300) }}>
          Directories list opportunities.{' '}
          <span style={{ color: C.jadeBright, opacity: ease(frame, 360) }}>Nobody helps you close them.</span>
        </div>
      </div>

      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {LINKS.map(([a, b, ok], i) => {
          const p = ease(frame, 60 + i * 18, 30);
          const A = NODES[a];
          const B = NODES[b];
          const broken = !ok && frame > 200 + i * 10;
          return (
            <line
              key={i}
              x1={A.x}
              y1={A.y}
              x2={A.x + (B.x - A.x) * p}
              y2={A.y + (B.y - A.y) * p}
              stroke={broken ? C.risk : C.white}
              strokeOpacity={broken ? 0.55 : 0.35}
              strokeWidth={3}
              strokeDasharray="10 12"
            />
          );
        })}
      </svg>
      {NODES.map((n, i) => {
        const s = pop(frame, 20 + i * 5);
        return (
          <div
            key={n.code}
            style={{
              position: 'absolute',
              left: n.x - 38,
              top: n.y - 24,
              width: 76,
              height: 48,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.08)',
              border: '1.5px solid rgba(255,255,255,0.18)',
              color: C.white,
              fontWeight: 800,
              fontSize: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${s})`,
            }}
          >
            {n.code}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- 2. Solution ---------- */
export const SolutionScene: React.FC<{ scene: TimedScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const draw = ease(frame, 4, 34);
  const steps = ['Discover', 'Understand fit', 'Propose a pilot', 'Follow through'];
  const phoneIn = pop(frame, 70, 18);
  const f = FOOTAGE.solution!;
  return (
    <AbsoluteFill style={{ ...row, justifyContent: 'space-between', padding: '0 160px', fontFamily: FONT }}>
      <div style={{ width: 900 }}>
        <div style={{ ...row, gap: 28 }}>
          <div style={{ transform: `scale(${pop(frame, 0)})` }}>
            <BrandMark size={110} progress={draw} />
          </div>
          <div style={{ fontSize: 104, fontWeight: 800, color: C.white, letterSpacing: -2, opacity: ease(frame, 14) }}>BridgeAI</div>
        </div>
        <div style={{ marginTop: 34, fontSize: 40, fontWeight: 500, color: C.muted, opacity: ease(frame, 40), lineHeight: 1.3 }}>
          The demand-to-deal app for ASEAN startups.
        </div>
        <ol style={{ listStyle: 'none', padding: 0, margin: '56px 0 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {steps.map((s, i) => {
            const p = ease(frame, 90 + i * 34);
            return (
              <li key={s} style={{ ...row, gap: 22, opacity: p, transform: `translateX(${(1 - p) * -30}px)` }}>
                <span
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: C.jadeBright,
                    color: C.ink,
                    fontWeight: 800,
                    fontSize: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontSize: 44, fontWeight: 700, color: C.white }}>{s}</span>
              </li>
            );
          })}
        </ol>
      </div>
      <div style={{ transform: `translateY(${(1 - phoneIn) * 120}px) rotate(${(1 - phoneIn) * 4}deg)`, opacity: phoneIn }}>
        <PhoneFrame>
          <Footage src={f.src} start={f.start} end={f.end} fitFrames={scene.duration - 70} />
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 3-8. Demo scenes ---------- */
const DEMO_COPY: Partial<Record<SceneId, { step: number; title: string; bullets: string[]; tech: string }>> = {
  profile: {
    step: 1,
    title: 'Describe it once. AI fills the profile.',
    bullets: ['Plain-language description', 'Sector, stage and markets extracted', 'Unknowns flagged, never guessed'],
    tech: 'Gemma 4 on OpenRouter',
  },
  discover: {
    step: 2,
    title: 'Challenges ranked for you',
    bullets: ['Rule-based fit score on every card', 'Must-have coverage at a glance', 'Demo data clearly labelled', 'Filters in a bottom sheet'],
    tech: 'Deterministic matcher',
  },
  match: {
    step: 3,
    title: 'See exactly why it fits',
    bullets: ['Top reasons and open questions', 'Five weighted checks, 100 points', 'A fit score, not funding odds'],
    tech: 'Explainable scoring',
  },
  pilot: {
    step: 4,
    title: 'A 75-day pilot plan in one tap',
    bullets: ['Goal, timeline and success measures', 'Legal questions to settle first', 'Outreach in English, Malay, Indonesian', 'Always marked as a draft'],
    tech: 'Editable draft, redraft with Gemma 4',
  },
  deals: {
    step: 5,
    title: 'Follow through, honestly',
    bullets: ['What needs attention today', 'Reminders at 30, 90 or 180 days', 'Stages move only when you record them'],
    tech: 'Event-based deal history',
  },
  outcomes: {
    step: 6,
    title: 'Outcomes you can trust',
    bullets: ['Real numerators and denominators', 'Investor readiness self-check'],
    tech: 'Computed from your events',
  },
};

export const DemoScene: React.FC<{ scene: TimedScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const copy = DEMO_COPY[scene.id]!;
  const f = FOOTAGE[scene.id]!;
  const phoneIn = pop(frame, 0, 20);
  const window = scene.narrationFrames * 0.7;
  const tilt = interpolate(frame, [0, scene.duration], [-3, 3]);
  return (
    <AbsoluteFill style={{ ...row, justifyContent: 'space-between', padding: '0 160px 0 140px', fontFamily: FONT }}>
      <div style={{ width: 860, marginTop: -90 }}>
        <div style={{ ...row, gap: 16, opacity: ease(frame, 4) }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: C.jadeBright }}>Step {copy.step} of 6</span>
          <div style={{ ...row, gap: 6 }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <span
                key={n}
                style={{
                  width: n === copy.step ? 34 : 12,
                  height: 6,
                  borderRadius: 3,
                  background: n <= copy.step ? C.jadeBright : 'rgba(255,255,255,0.18)',
                }}
              />
            ))}
          </div>
        </div>
        <h2
          style={{
            margin: '22px 0 0',
            fontSize: 70,
            lineHeight: 1.06,
            fontWeight: 800,
            color: C.white,
            letterSpacing: -1,
            opacity: ease(frame, 8),
            transform: `translateY(${(1 - ease(frame, 8)) * 30}px)`,
          }}
        >
          {copy.title}
        </h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: '44px 0 0', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {copy.bullets.map((b, i) => {
            const at = scene.lead + (i * window) / copy.bullets.length;
            const p = ease(frame, at);
            return (
              <li key={b} style={{ ...row, gap: 20, opacity: p, transform: `translateX(${(1 - p) * -24}px)` }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: C.jadeBright, flexShrink: 0 }} />
                <span style={{ fontSize: 36, fontWeight: 600, color: 'rgba(255,255,255,0.92)' }}>{b}</span>
              </li>
            );
          })}
        </ul>
        <div style={{ marginTop: 44, opacity: ease(frame, 30), transform: `scale(${0.9 + 0.1 * pop(frame, 30)})`, transformOrigin: 'left' }}>
          <Chip color="#C9C1FF" bg="rgba(139,124,246,0.18)" size={24}>
            {copy.tech}
          </Chip>
        </div>
      </div>
      <div
        style={{
          transform: `perspective(1600px) rotateY(${tilt}deg) translateY(${(1 - phoneIn) * 80}px) scale(${0.92 + 0.08 * phoneIn})`,
          opacity: phoneIn,
        }}
      >
        <PhoneFrame>
          <Footage src={f.src} start={f.start} end={f.end} fitFrames={scene.duration} />
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 9. What makes it different ---------- */
export const UniqueScene: React.FC<{ scene: TimedScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const f = FOOTAGE.unique!;
  const pillars = [
    { title: 'Demand-first', body: 'Start from real corporate problems' },
    { title: 'Explainable', body: 'Every score shows its working' },
    { title: 'Human-confirmed', body: 'AI drafts, you decide' },
    { title: 'Voice briefings', body: 'Kokoro reads plans aloud' },
  ];
  const browserIn = pop(frame, 6, 20);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, padding: '90px 140px' }}>
      <h2 style={{ margin: 0, fontSize: 64, fontWeight: 800, color: C.white, opacity: ease(frame, 2), letterSpacing: -1 }}>
        Honesty by design
      </h2>
      <div style={{ ...row, alignItems: 'flex-start', gap: 60, marginTop: 50 }}>
        <div style={{ transform: `translateY(${(1 - browserIn) * 60}px)`, opacity: browserIn }}>
          <BrowserFrame width={1040}>
            <Footage src={f.src} start={f.start} end={f.end} fitFrames={scene.duration} />
          </BrowserFrame>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, flex: 1 }}>
          {pillars.map((p, i) => {
            const s = pop(frame, 30 + i * 40);
            return (
              <div
                key={p.title}
                style={{
                  padding: '24px 28px',
                  borderRadius: 22,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  transform: `translateX(${(1 - s) * 60}px)`,
                  opacity: s,
                }}
              >
                <div style={{ fontSize: 34, fontWeight: 800, color: C.jadeBright }}>{p.title}</div>
                <div style={{ marginTop: 6, fontSize: 26, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>{p.body}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 10. Stack ---------- */
const STACK: Array<{ group: string; items: string[] }> = [
  { group: 'App', items: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS 4'] },
  { group: 'AI', items: ['Gemma 4', 'Kokoro TTS', 'OpenRouter'] },
  { group: 'Quality and delivery', items: ['Zod', 'Vitest', 'Vercel', 'Mobile-first PWA'] },
];

export const StackScene: React.FC<{ scene: TimedScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  let k = 0;
  const flow = ['Phone', 'Next.js API routes', 'OpenRouter', 'Gemma 4 + Kokoro'];
  return (
    <AbsoluteFill style={{ fontFamily: FONT, padding: '100px 140px' }}>
      <h2 style={{ margin: 0, fontSize: 64, fontWeight: 800, color: C.white, opacity: ease(frame, 2), letterSpacing: -1 }}>
        How it is built
      </h2>
      <div style={{ ...row, alignItems: 'flex-start', gap: 40, marginTop: 56 }}>
        {STACK.map((g) => (
          <div key={g.group} style={{ flex: 1 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: C.muted, opacity: ease(frame, 10) }}>{g.group}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 20 }}>
              {g.items.map((item) => {
                const s = pop(frame, 20 + k++ * 14);
                return (
                  <span
                    key={item}
                    style={{
                      padding: '18px 26px',
                      borderRadius: 18,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1.5px solid rgba(255,255,255,0.14)',
                      color: C.white,
                      fontWeight: 700,
                      fontSize: 32,
                      transform: `scale(${s})`,
                      opacity: s,
                    }}
                  >
                    {item}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...row, gap: 0, marginTop: 110, justifyContent: 'center' }}>
        {flow.map((node, i) => {
          const p = ease(frame, 260 + i * 30);
          return (
            <React.Fragment key={node}>
              {i > 0 ? (
                <div style={{ position: 'relative', width: 120, height: 4 }}>
                  <div style={{ width: `${ease(frame, 245 + i * 30) * 100}%`, borderTop: `4px dashed ${C.jadeBright}`, opacity: 0.7 }} />
                </div>
              ) : null}
              <div
                style={{
                  padding: '20px 30px',
                  borderRadius: 18,
                  background: i === flow.length - 1 ? 'rgba(139,124,246,0.2)' : 'rgba(18,184,134,0.14)',
                  color: C.white,
                  fontWeight: 700,
                  fontSize: 30,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 20}px)`,
                }}
              >
                {node}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 11. Outro ---------- */
export const OutroScene: React.FC<{ scene: TimedScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily: FONT, alignItems: 'center', justifyContent: 'center', gap: 44 }}>
      <div style={{ ...row, gap: 30, transform: `scale(${pop(frame, 0)})` }}>
        <BrandMark size={120} progress={ease(frame, 4, 30)} />
        <span style={{ fontSize: 120, fontWeight: 800, color: C.white, letterSpacing: -3 }}>BridgeAI</span>
      </div>
      <div style={{ opacity: ease(frame, 20) }}>
        <Route from="MY" to="ID" progress={ease(frame, 24, 50)} size={52} />
      </div>
      <div style={{ fontSize: 46, fontWeight: 600, color: 'rgba(255,255,255,0.9)', opacity: ease(frame, 50) }}>
        From discovery to deal, across ASEAN.
      </div>
      <div style={{ fontSize: 26, fontWeight: 500, color: C.muted, opacity: ease(frame, 80) }}>
        github.com/LuqmanNurhakimRosli/BridgeAI-Hacktoberfest-
      </div>
    </AbsoluteFill>
  );
};
