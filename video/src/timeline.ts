import manifest from '../public/audio/manifest.json';
import marks from '../public/footage/marks.json';
import { FPS } from './theme';

export type SceneId =
  | 'problem'
  | 'solution'
  | 'profile'
  | 'discover'
  | 'match'
  | 'pilot'
  | 'deals'
  | 'outcomes'
  | 'unique'
  | 'stack'
  | 'outro';

export interface TimedScene {
  id: SceneId;
  text: string;
  audio: string;
  from: number;
  duration: number;
  /** Frames from scene start to narration start. */
  lead: number;
  narrationFrames: number;
}

const LEAD = 8;
const TAIL = 10;

let cursor = 0;
export const SCENES: TimedScene[] = manifest.scenes.map((s) => {
  const narrationFrames = Math.ceil(s.seconds * FPS);
  const scene: TimedScene = {
    id: s.id as SceneId,
    text: s.text,
    audio: s.file,
    from: cursor,
    duration: narrationFrames + LEAD + TAIL,
    lead: LEAD,
    narrationFrames,
  };
  cursor += scene.duration;
  return scene;
});

export const TOTAL_FRAMES = cursor;

/** Source window (seconds) in the recorded mobile/desktop footage for each demo scene. */
const m = marks.mobile;
export const FOOTAGE: Partial<Record<SceneId, { src: 'mobile' | 'desktop'; start: number; end: number }>> = {
  solution: { src: 'mobile', start: m.home, end: m.profile },
  profile: { src: 'mobile', start: m.profile, end: m.discover },
  discover: { src: 'mobile', start: m.discover, end: m.match },
  match: { src: 'mobile', start: m.match, end: m.pilot },
  pilot: { src: 'mobile', start: m.pilot, end: m.deals },
  deals: { src: 'mobile', start: m.deals, end: m.outcomes },
  outcomes: { src: 'mobile', start: m.outcomes, end: m.end },
  unique: { src: 'desktop', start: marks.desktop.home, end: marks.desktop.end },
};
