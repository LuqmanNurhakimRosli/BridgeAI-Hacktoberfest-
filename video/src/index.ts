import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { BridgeAIDemo } from './Video';
import { TOTAL_FRAMES } from './timeline';
import { FPS, HEIGHT, WIDTH } from './theme';

const Root: React.FC = () =>
  React.createElement(Composition, {
    id: 'BridgeAIDemo',
    component: BridgeAIDemo,
    durationInFrames: TOTAL_FRAMES,
    fps: FPS,
    width: WIDTH,
    height: HEIGHT,
  });

registerRoot(Root);
