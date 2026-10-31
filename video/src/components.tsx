import React from 'react';
import {
  AbsoluteFill,
  Freeze,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { C, FONT, FPS } from './theme';

export const ease = (frame: number, start: number, length = 18) =>
  interpolate(frame, [start, start + length], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });

export const pop = (frame: number, delay = 0, damping = 16) =>
  spring({ frame: frame - delay, fps: FPS, config: { damping, mass: 0.7, stiffness: 140 } });

/* Persistent backdrop: deep harbour navy with slow drifting route lines. */
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const routes = [
    { y: 180, speed: 0.35, opacity: 0.1 },
    { y: 470, speed: 0.22, opacity: 0.07 },
    { y: 760, speed: 0.3, opacity: 0.09 },
    { y: 980, speed: 0.18, opacity: 0.06 },
  ];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 800px at 78% 40%, ${C.inkSoft} 0%, ${C.ink} 45%, ${C.inkDeep} 100%)` }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {routes.map((r, i) => {
          const offset = (frame * r.speed * 4) % 48;
          return (
            <g key={i} opacity={r.opacity}>
              <line x1={-60} y1={r.y} x2={1980} y2={r.y - 120} stroke={C.white} strokeWidth={2} strokeDasharray="14 34" strokeDashoffset={-offset} />
            </g>
          );
        })}
      </svg>
      <AbsoluteFill
        style={{
          background: `radial-gradient(600px 400px at ${20 + Math.sin(frame / 120) * 6}% ${80 + Math.cos(frame / 140) * 5}%, rgba(18,184,134,0.10), transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/* App mark: a dashed route ending in a jade dot. `progress` draws the line. */
export const BrandMark: React.FC<{ size?: number; progress?: number }> = ({ size = 88, progress = 1 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.24,
      background: C.white,
      position: 'relative',
      boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: size * 0.18,
        top: '50%',
        width: (size * 0.58) * progress,
        borderTop: `${Math.max(2, size * 0.05)}px dashed ${C.ink}`,
        opacity: 0.55,
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: size * 0.18 + size * 0.58 * progress - size * 0.07,
        top: `calc(50% - ${size * 0.09}px)`,
        width: size * 0.18,
        height: size * 0.18,
        borderRadius: '50%',
        background: C.jadeBright,
      }}
    />
  </div>
);

/* Boarding-pass route between two country codes, drawn by `progress`. */
export const Route: React.FC<{ from: string; to: string; progress: number; size?: number }> = ({ from, to, progress, size = 64 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3, fontFamily: FONT, fontWeight: 800, fontSize: size, color: C.white, letterSpacing: 2 }}>
    <span>{from}</span>
    <div style={{ position: 'relative', width: size * 2.4, height: 6 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: `${progress * 100}%`, borderTop: '4px dashed rgba(255,255,255,0.45)' }} />
      <div
        style={{
          position: 'absolute',
          left: `calc(${progress * 100}% - 9px)`,
          top: -7,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: C.jadeBright,
          boxShadow: `0 0 24px ${C.jadeBright}`,
        }}
      />
    </div>
    <span style={{ opacity: progress > 0.95 ? 1 : 0.35 }}>{to}</span>
  </div>
);

/* Plays a window of recorded footage, fitted to `fitFrames`, holding the last frame if it runs out. */
export const Footage: React.FC<{
  src: 'mobile' | 'desktop';
  start: number;
  end: number;
  fitFrames: number;
  style?: React.CSSProperties;
}> = ({ src, start, end, fitFrames, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clipSeconds = end - start;
  const rate = Math.min(1.6, Math.max(0.7, clipSeconds / (fitFrames / fps)));
  const playableFrames = Math.floor((clipSeconds / rate) * fps);
  const video = (
    <OffthreadVideo
      src={staticFile(`footage/${src}.mp4`)}
      trimBefore={Math.round(start * fps)}
      trimAfter={Math.round(end * fps)}
      playbackRate={rate}
      muted
      style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }}
    />
  );
  return frame < playableFrames ? video : <Freeze frame={playableFrames - 1}>{video}</Freeze>;
};

export const PhoneFrame: React.FC<{ children: React.ReactNode; height?: number }> = ({ children, height = 930 }) => {
  const width = height * (780 / 1688) + 24;
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 64,
        padding: 12,
        background: 'linear-gradient(160deg, #26364F 0%, #0E1626 55%, #1B2A40 100%)',
        boxShadow: '0 50px 120px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(255,255,255,0.08)',
        position: 'relative',
      }}
    >
      <div style={{ width: '100%', height: '100%', borderRadius: 52, overflow: 'hidden', background: C.paper, position: 'relative' }}>
        {children}
      </div>
    </div>
  );
};

export const BrowserFrame: React.FC<{ children: React.ReactNode; width: number }> = ({ children, width }) => (
  <div style={{ width, borderRadius: 18, overflow: 'hidden', boxShadow: '0 50px 120px rgba(0,0,0,0.5)', background: C.white }}>
    <div style={{ height: 44, background: '#E8ECF2', display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px' }}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
        <span key={c} style={{ width: 13, height: 13, borderRadius: '50%', background: c }} />
      ))}
      <span style={{ marginLeft: 18, flex: 1, height: 26, borderRadius: 8, background: C.white, fontFamily: FONT, fontSize: 14, color: '#56657C', display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
        BridgeAI, desktop layout
      </span>
    </div>
    <div style={{ width, height: width * (900 / 1440) }}>{children}</div>
  </div>
);

/* Sentence-level captions spread across the narration by character count. */
export function captionChunks(text: string): string[] {
  const sentences = text.split(/(?<=[.?!:])\s+/);
  const out: string[] = [];
  for (const s of sentences) {
    if (s.length <= 92) {
      out.push(s);
      continue;
    }
    const mid = s.length / 2;
    let cut = -1;
    let best = Infinity;
    for (let i = s.indexOf(', '); i !== -1; i = s.indexOf(', ', i + 1)) {
      if (Math.abs(i - mid) < best) {
        best = Math.abs(i - mid);
        cut = i;
      }
    }
    if (cut === -1) out.push(s);
    else out.push(s.slice(0, cut + 1), s.slice(cut + 2));
  }
  return out;
}

export const Captions: React.FC<{ text: string; lead: number; frames: number; align?: 'left' | 'center' }> = ({
  text,
  lead,
  frames,
  align = 'left',
}) => {
  const frame = useCurrentFrame() - lead;
  if (frame < 0 || frame > frames) return null;
  const chunks = captionChunks(text);
  const weights = chunks.map((c) => c.length + 12);
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  let idx = 0;
  for (let i = 0; i < chunks.length; i++) {
    const end = ((acc + weights[i]) / total) * frames;
    if (frame < end) {
      idx = i;
      break;
    }
    acc += weights[i];
    idx = i;
  }
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 54,
        left: align === 'left' ? 140 : 0,
        right: align === 'left' ? undefined : 0,
        display: 'flex',
        justifyContent: align === 'left' ? 'flex-start' : 'center',
      }}
    >
      <div
        style={{
          maxWidth: align === 'left' ? 860 : 1300,
          padding: '12px 22px',
          borderRadius: 14,
          background: 'rgba(6,23,46,0.72)',
          color: C.white,
          fontFamily: FONT,
          fontSize: 28,
          fontWeight: 500,
          lineHeight: 1.35,
          textAlign: align,
        }}
      >
        {chunks[idx]}
      </div>
    </div>
  );
};

export const Chip: React.FC<{ children: React.ReactNode; color?: string; bg?: string; size?: number }> = ({
  children,
  color = C.jadeBright,
  bg = 'rgba(18,184,134,0.14)',
  size = 22,
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: `${size * 0.4}px ${size * 0.8}px`,
      borderRadius: 999,
      background: bg,
      color,
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: size,
    }}
  >
    {children}
  </span>
);
