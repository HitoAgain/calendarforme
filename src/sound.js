// Paper whoosh synthesised with Web Audio: band-passed noise sweeping up, panned in the direction of travel. No audio files.
let ctx;
let muted = (() => { try { return localStorage.getItem('muted') === '1'; } catch { return false; } })();

export const isMuted = () => muted;

export function setMuted(value) {
  muted = value;
  try { localStorage.setItem('muted', value ? '1' : '0'); } catch { /* private window: the choice lasts this visit only */ }
}

export function paperWhoosh(direction = 1) {
  if (muted) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    const dur = 0.34;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Mostly soft noise with sparse louder grains: the crackle of a page edge.
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (Math.random() < 0.04 ? 1 : 0.35);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 0.8;
    band.frequency.setValueAtTime(650, t);
    band.frequency.exponentialRampToValueAtTime(3600, t + dur * 0.55);
    band.frequency.exponentialRampToValueAtTime(1800, t + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.32, t + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const pan = ctx.createStereoPanner();
    pan.pan.setValueAtTime(0.55 * direction, t);
    pan.pan.linearRampToValueAtTime(-0.55 * direction, t + dur);

    source.connect(band).connect(gain).connect(pan).connect(ctx.destination);
    source.start(t);
    source.stop(t + dur);
  } catch {
    // No audio device or autoplay refused: the page turns silently.
  }
}
