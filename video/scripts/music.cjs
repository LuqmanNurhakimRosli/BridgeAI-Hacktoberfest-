/**
 * Procedural Audio Synthesizer for SaaS Commercial Motion Graphics Video Ads
 * 
 * Generates:
 * 1. public/audio/ad_soundtrack.wav (Full-length Rhodes + Drums + Kalimba score)
 * 2. public/audio/ios_tap.wav       (Tactile click)
 * 3. public/audio/notification.wav  (Melodic major sixth alert chime)
 * 4. public/audio/route_lock.wav    (3-tone ascending triad lock)
 * 
 * Zero external audio libraries required. Pure Node.js buffer synthesis.
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

function createWavHeader(dataLength, sampleRate = SAMPLE_RATE, numChannels = 1, bitsPerSample = 16) {
  const buffer = Buffer.alloc(44);
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

function writeWavFile(filePath, samples) {
  const dataLength = samples.length * 2;
  const header = createWavHeader(dataLength);
  const dataBuffer = Buffer.alloc(dataLength);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    dataBuffer.writeInt16LE(Math.floor(s < 0 ? s * 0x8000 : s * 0x7FFF), i * 2);
  }

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(filePath, Buffer.concat([header, dataBuffer]));
  console.log(`✓ Generated: ${filePath} (${(dataLength / 1024 / 1024).toFixed(2)} MB)`);
}

// ============================================================================
// 1. SOUNDTRACK GENERATION (Upbeat 124 BPM Rhodes + Kalimba + 4/4 Beat)
// ============================================================================
function generateSoundtrack(durationSec = 45.5, bpm = 124) {
  const totalSamples = Math.floor(SAMPLE_RATE * durationSec);
  const samples = new Float32Array(totalSamples);
  const beatSamples = Math.floor((60 / bpm) * SAMPLE_RATE);
  const barSamples = beatSamples * 4;

  const chords = [
    [261.63, 329.63, 392.00, 493.88], // Cmaj7
    [220.00, 261.63, 329.63, 392.00], // Am7
    [174.61, 220.00, 261.63, 329.63], // Fmaj7
    [196.00, 246.94, 293.66, 392.00], // G7
  ];

  for (let t = 0; t < totalSamples; t++) {
    const time = t / SAMPLE_RATE;
    const barIndex = Math.floor(t / barSamples);
    const chord = chords[barIndex % chords.length];
    const beatPos = t % beatSamples;
    const beatIndex = Math.floor((t % barSamples) / beatSamples);

    let mix = 0;

    // Rhodes Chords
    const chordPos = (t % (barSamples * 2)) / SAMPLE_RATE;
    const chordEnv = Math.exp(-chordPos * 0.45);
    for (let f of chord) {
      mix += Math.sin(2 * Math.PI * f * time) * 0.08 * chordEnv;
      mix += Math.sin(2 * Math.PI * f * 2 * time) * 0.03 * chordEnv; // 2nd harmonic
    }

    // Punch Kick (Beats 0 and 2)
    if (beatIndex === 0 || beatIndex === 2) {
      const kickTime = beatPos / SAMPLE_RATE;
      if (kickTime < 0.28) {
        const kickFreq = 125 * Math.exp(-kickTime * 28);
        const kickEnv = Math.exp(-kickTime * 14);
        mix += Math.sin(2 * Math.PI * kickFreq * kickTime) * 0.40 * kickEnv;
      }
    }

    // Snare Drum (Beats 1 and 3)
    if (beatIndex === 1 || beatIndex === 3) {
      const snareTime = beatPos / SAMPLE_RATE;
      if (snareTime < 0.25) {
        const noise = (Math.random() * 2 - 1) * Math.exp(-snareTime * 24);
        const body = Math.sin(2 * Math.PI * 180 * snareTime) * Math.exp(-snareTime * 18);
        mix += (noise * 0.25 + body * 0.20);
      }
    }

    // Kalimba Arpeggio (16th notes)
    const sixteenth = t % Math.floor(beatSamples / 4);
    const arpIndex = Math.floor((t % barSamples) / Math.floor(beatSamples / 4)) % chord.length;
    const arpTime = sixteenth / SAMPLE_RATE;
    if (arpTime < 0.18) {
      const arpFreq = chord[arpIndex] * 2;
      const arpEnv = Math.exp(-arpTime * 22);
      mix += Math.sin(2 * Math.PI * arpFreq * time) * 0.07 * arpEnv;
    }

    // Global Fade Out in last 2 seconds
    const remainingTime = durationSec - time;
    if (remainingTime < 2.0) {
      mix *= (remainingTime / 2.0);
    }

    samples[t] = mix;
  }

  return samples;
}

// ============================================================================
// 2. TACTILE TAP SFX (1.2 kHz UI Click)
// ============================================================================
function generateIosTap(durationSec = 0.03) {
  const totalSamples = Math.floor(SAMPLE_RATE * durationSec);
  const samples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    samples[i] = Math.sin(2 * Math.PI * 1200 * t) * Math.exp(-t * 120);
  }
  return samples;
}

// ============================================================================
// 3. NOTIFICATION CHIME (Major 6th Bell)
// ============================================================================
function generateNotification(durationSec = 0.4) {
  const totalSamples = Math.floor(SAMPLE_RATE * durationSec);
  const samples = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const tone1 = Math.sin(2 * Math.PI * 587.33 * t) * Math.exp(-t * 8); // D5
    const tone2 = t > 0.08 ? Math.sin(2 * Math.PI * 880.00 * (t - 0.08)) * Math.exp(-(t - 0.08) * 7) : 0; // A5
    samples[i] = (tone1 * 0.4 + tone2 * 0.5);
  }
  return samples;
}

// ============================================================================
// 4. ROUTE LOCK SFX (Ascending Triad C5-E5-G5)
// ============================================================================
function generateRouteLock(durationSec = 0.45) {
  const totalSamples = Math.floor(SAMPLE_RATE * durationSec);
  const samples = new Float32Array(totalSamples);
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;
    notes.forEach((freq, idx) => {
      const noteStart = idx * 0.07;
      if (t >= noteStart) {
        const noteTime = t - noteStart;
        s += Math.sin(2 * Math.PI * freq * noteTime) * Math.exp(-noteTime * 10) * 0.35;
      }
    });
    samples[i] = s;
  }
  return samples;
}

// Main Execution
// Usage: node scripts/music.cjs [durationSec]. Writes a soft 96 BPM bed plus a tap SFX.
const outputDir = path.join(__dirname, '..', 'public', 'audio');
const durationSec = Number(process.argv[2]) || 150;
fs.mkdirSync(outputDir, { recursive: true });
writeWavFile(path.join(outputDir, 'music.wav'), generateSoundtrack(durationSec, 96));
writeWavFile(path.join(outputDir, 'tap.wav'), generateIosTap());
writeWavFile(path.join(outputDir, 'chime.wav'), generateNotification());
console.log(`music.wav (${durationSec}s), tap.wav and chime.wav written to ${outputDir}`);
