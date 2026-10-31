import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from 'remotion';
import { Backdrop, Captions } from './components';
import { DemoScene, OutroScene, ProblemScene, SceneShell, SolutionScene, StackScene, UniqueScene } from './scenes';
import { SCENES, TOTAL_FRAMES, type TimedScene } from './timeline';

const SCENE_COMPONENT: Record<string, React.FC<{ scene: TimedScene }>> = {
  problem: ProblemScene,
  solution: SolutionScene,
  profile: DemoScene,
  discover: DemoScene,
  match: DemoScene,
  pilot: DemoScene,
  deals: DemoScene,
  outcomes: DemoScene,
  unique: UniqueScene,
  stack: StackScene,
  outro: OutroScene,
};

const CENTERED_CAPTIONS = new Set(['problem', 'unique', 'stack']);

export const BridgeAIDemo: React.FC = () => {
  const solution = SCENES.find((s) => s.id === 'solution')!;
  const outro = SCENES.find((s) => s.id === 'outro')!;
  return (
    <AbsoluteFill>
      <Backdrop />

      {/* Music bed: low under the voice, faded in and out. */}
      <Audio
        src={staticFile('audio/music.wav')}
        volume={(f) =>
          interpolate(f, [0, 30, TOTAL_FRAMES - 60, TOTAL_FRAMES], [0, 0.1, 0.1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        }
      />
      <Sequence from={solution.from + 2} durationInFrames={20}>
        <Audio src={staticFile('audio/chime.wav')} volume={0.35} />
      </Sequence>
      <Sequence from={outro.from + 2} durationInFrames={20}>
        <Audio src={staticFile('audio/chime.wav')} volume={0.35} />
      </Sequence>

      {SCENES.map((scene) => {
        const Scene = SCENE_COMPONENT[scene.id];
        return (
          <Sequence key={scene.id} from={scene.from} durationInFrames={scene.duration} name={scene.id}>
            <SceneShell scene={scene}>
              <Scene scene={scene} />
            </SceneShell>
            <Sequence from={scene.lead} layout="none">
              <Audio src={staticFile(scene.audio)} />
            </Sequence>
            {scene.id === 'outro' ? null : (
              <Captions
                text={scene.text}
                lead={scene.lead}
                frames={scene.narrationFrames}
                align={CENTERED_CAPTIONS.has(scene.id) ? 'center' : 'left'}
              />
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
