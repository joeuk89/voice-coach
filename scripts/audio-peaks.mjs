// Writes the waveform the audio player draws: <track>.peaks.json next to each track.
// Decodes with macOS afconvert, so it runs on a Mac only.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TRACKS = ['public/audio/roger-love-daily-warmup-male.mp3'];
const SAMPLE_RATE = 22050;
const BARS = 600;

function decode(mp3) {
  const dir = mkdtempSync(join(tmpdir(), 'audio-peaks-'));
  try {
    const wav = join(dir, 'track.wav');
    execFileSync('afconvert', ['-f', 'WAVE', '-d', `LEI16@${SAMPLE_RATE}`, '-c', '1', mp3, wav]);
    return readFileSync(wav);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The 16-bit mono samples in a WAV file's data chunk. afconvert puts other chunks before it. */
function samplesOf(wav) {
  let offset = 12;
  while (offset + 8 <= wav.length) {
    const id = wav.toString('ascii', offset, offset + 4);
    const size = wav.readUInt32LE(offset + 4);
    if (id === 'data') return new Int16Array(wav.buffer, wav.byteOffset + offset + 8, size / 2);
    offset += 8 + size + (size % 2);
  }
  throw new Error('No data chunk in the decoded WAV');
}

/** Loudness per bar as RMS, scaled so the loudest bar is 1. Peak values sit near 1 all through a mastered track. */
function peaksOf(samples) {
  const rms = [];
  for (let bar = 0; bar < BARS; bar++) {
    const from = Math.floor((bar * samples.length) / BARS);
    const to = Math.floor(((bar + 1) * samples.length) / BARS);
    let sum = 0;
    for (let i = from; i < to; i++) sum += samples[i] * samples[i];
    rms.push(Math.sqrt(sum / Math.max(1, to - from)));
  }
  const loudest = Math.max(...rms) || 1;
  return rms.map((value) => Math.round((value / loudest) * 1000) / 1000);
}

for (const mp3 of TRACKS) {
  const samples = samplesOf(decode(mp3));
  const duration = Math.round((samples.length / SAMPLE_RATE) * 100) / 100;
  const out = mp3.replace(/\.mp3$/, '.peaks.json');
  writeFileSync(out, JSON.stringify({ duration, peaks: peaksOf(samples) }) + '\n');
  console.log(`${out}: ${BARS} bars, ${duration} s`);
}
