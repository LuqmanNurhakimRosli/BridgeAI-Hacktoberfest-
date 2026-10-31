import { loadFont } from '@remotion/google-fonts/PlusJakartaSans';

const { fontFamily } = loadFont('normal', { weights: ['400', '500', '600', '700', '800'], subsets: ['latin'] });

export const FONT = fontFamily;
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/* Same tokens as the app (frontend/src/app/globals.css). */
export const C = {
  ink: '#0B2545',
  inkDeep: '#06172E',
  inkSoft: '#1D3A63',
  paper: '#F3F5F8',
  white: '#FFFFFF',
  muted: '#8FA3BF',
  jade: '#0A7A5C',
  jadeBright: '#12B886',
  amber: '#F2B33D',
  risk: '#E5484D',
  ai: '#8B7CF6',
};
