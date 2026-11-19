// Generates a 100% self-contained single-file HTML/CSS/JS program
// designed to be pasted directly into Google Sites -> Insert -> Embed -> Embed code.

export function generateGoogleSitesHtml(): string {
  return `<!--
================================================================================
TEACHER NOTE — GRADE 12 FOLEY SOUND LAB (GOOGLE SITES SELF-CONTAINED EMBED)
================================================================================
1. HOW TO UPLOAD A VIDEO CLIP:
   - Students or teachers can click "Upload Video Clip" inside the tool to load
     any MP4/WebM/MOV video directly from a Chromebook or computer.
   - Or paste a direct MP4 URL into the "Sample / Video URL" box and click Load.
   - If no video is uploaded, the built-in 18-second "Rainy Alleyway" visual
     scene runs automatically so students can begin experimenting right away.

2. WHERE TO ADD CUSTOM SOUND FILES:
   - All 12 built-in Foley sound effects (across Footsteps, Movement, and
     Specifics including Explosion, Thunder Clap, and Quick Whoosh) are
     synthesized live using the browser's Web Audio API—so they require ZERO
     external audio files and never break on school networks!
   - To add your own recorded MP3/WAV sound files (Extension Mode), students
     can use the "+ Upload Custom Sound" button right inside the Soundboard, OR
     teachers can add entries to the SOUNDS array in the <script> below.

3. HOW TO EMBED THIS PAGE IN GOOGLE SITES:
   - Open your Google Site -> right-hand panel -> click "Insert" -> "Embed".
   - Choose the "Embed code" tab.
   - Copy and paste this ENTIRE code block into the box and click "Next" -> "Insert".
   - Drag the bottom and side handles of the embed frame on your Google Site
     to give it plenty of vertical room (recommended: full page width, ~980px tall).
================================================================================
-->
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Foley Sound Lab — Grade 12 Film Sound Design</title>
<style>
  :root {
    --bg: #0B0F17;
    --panel: #131A26;
    --panel-alt: #1A2333;
    --border: #263248;
    --text: #F8FAFC;
    --muted: #94A3B8;
    --accent: #F59E0B;
    --accent-text: #0B0F17;
    --sky: #38BDF8;
    --danger: #F43F5E;
    --ok: #10B981;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.5;
    padding: 16px;
  }
  .container { max-width: 1240px; margin: 0 auto; }
  header {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
    gap: 12px; padding-bottom: 14px; border-bottom: 1px solid var(--border); margin-bottom: 16px;
  }
  h1 { margin: 0; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }
  .subtitle { color: var(--muted); font-size: 0.9rem; margin: 2px 0 0; }
  .toolbar {
    display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
    background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
    padding: 12px; margin-bottom: 16px;
  }
  button, .file-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    min-height: 44px; padding: 10px 16px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--panel-alt); color: var(--text); font-size: 0.95rem; font-weight: 600;
    cursor: pointer; transition: transform 0.12s ease, background 0.15s ease;
  }
  button:hover, .file-btn:hover { background: #233047; }
  button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible {
    outline: 3px solid var(--accent); outline-offset: 2px;
  }
  .btn-primary { background: var(--accent); color: var(--accent-text); border-color: var(--accent); }
  .btn-primary:hover { background: #FBBF24; }
  .btn-strip-active { background: #78350F; border-color: #F59E0B; color: #FEF3C7; }
  .btn-danger-active { background: #881337; border-color: var(--danger); color: #FFE4E6; }
  .btn-ok-active { background: #064E3B; border-color: var(--ok); color: #D1FAE5; }
  input[type="url"], input[type="text"], textarea, select {
    background: #0B0F17; color: var(--text); border: 1px solid var(--border);
    border-radius: 8px; padding: 10px 12px; font-size: 0.95rem; font-family: inherit;
  }
  .grid { display: grid; grid-template-columns: 1.55fr 1fr; gap: 16px; align-items: start; }
  @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
  .card {
    background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 16px;
  }
  .stage-wrap {
    position: relative; width: 100%; aspect-ratio: 16/9; background: #05080F;
    border-radius: 10px; overflow: hidden; border: 1px solid var(--border);
  }
  video, canvas { width: 100%; height: 100%; display: block; object-fit: contain; }
  #overlayCanvas { position: absolute; inset: 0; pointer-events: none; }
  .state-badge {
    position: absolute; top: 10px; left: 10px; padding: 6px 12px; border-radius: 6px;
    font-size: 0.8rem; font-weight: 700; letter-spacing: 0.03em; border: 1px solid;
    pointer-events: none;
  }
  .state-on { background: rgba(6, 78, 59, 0.9); border-color: #10B981; color: #D1FAE5; }
  .state-strip { background: rgba(120, 53, 15, 0.92); border-color: #F59E0B; color: #FEF3C7; }
  .state-off { background: rgba(136, 19, 55, 0.9); border-color: #F43F5E; color: #FFE4E6; }
  .transport { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 12px; }
  .timecode {
    margin-left: auto; font-family: ui-monospace, monospace; font-size: 1rem;
    font-weight: 600; color: var(--sky);
  }
  .timeline-box { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border); }
  .timeline-shell {
    display: flex; margin-top: 8px; background: #0B0F17; border: 1px solid var(--border);
    border-radius: 8px; overflow: visible;
  }
  .layer-labels { width: 112px; flex-shrink: 0; border-right: 1px solid var(--border); }
  .layer-label {
    height: 52px; padding: 0 10px; display: flex; align-items: center; gap: 7px;
    font-size: 0.78rem; font-weight: 700; border-bottom: 1px solid var(--border);
    background: #0E1420;
  }
  .layer-label:last-child { border-bottom: none; }
  .layer-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
  .timeline-track {
    position: relative; flex: 1; cursor: pointer; overflow: visible; touch-action: none; user-select: none;
  }
  .lane-row { position: relative; height: 52px; border-bottom: 1px solid var(--border); }
  .lane-row:last-child { border-bottom: none; }
  .playhead {
    position: absolute; top: 0; bottom: 0; width: 3px; background: var(--accent);
    pointer-events: none; z-index: 4;
  }
  .cue-pin {
    position: absolute; top: 8px; height: 34px; min-width: 18px; padding: 0 6px;
    border-radius: 6px; font-size: 0.72rem; font-weight: 700; color: #0B0F17;
    display: inline-flex; align-items: center; justify-content: space-between; gap: 4px; border: 2px solid #0B0F17;
    cursor: grab; z-index: 2; touch-action: none; text-align: left;
  }
  .cue-pin.dragging { cursor: grabbing; z-index: 6; box-shadow: 0 0 0 2px var(--accent); }
  .cue-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
  .cue-remove {
    display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
    width: 15px; height: 15px; border-radius: 4px; background: rgba(11,15,23,0.22);
    font-size: 0.72rem; line-height: 1; cursor: pointer;
  }
  .cue-time-tip {
    position: absolute; top: -24px; left: 0;
    background: #0B0F17; color: var(--accent); border: 1px solid var(--accent);
    border-radius: 4px; padding: 1px 5px; font-family: ui-monospace, monospace; font-size: 0.7rem;
    pointer-events: none; white-space: nowrap;
  }
  .layer-group-title {
    font-size: 0.78rem; font-weight: 700; color: var(--muted); margin: 14px 0 6px;
    display: flex; align-items: center; gap: 6px;
  }
  .sound-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .sound-btn {
    flex-direction: column; align-items: flex-start; text-align: left; min-height: 70px;
    padding: 10px 12px; position: relative;
  }
  .sound-title { font-size: 0.94rem; font-weight: 700; }
  .sound-desc { font-size: 0.75rem; color: var(--muted); font-weight: 400; }
  .reflection-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 16px; }
  @media (max-width: 900px) { .reflection-grid { grid-template-columns: 1fr; } }
  .q-card label { display: block; font-weight: 700; margin-bottom: 6px; font-size: 0.95rem; }
  .q-card textarea { width: 100%; min-height: 110px; resize: vertical; }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
</style>
</head>
<body>
<div class="container">
  <header>
    <div>
      <h1>Foley Sound Lab</h1>
      <p class="subtitle">Grade 12 Film &amp; Media Production · 3-Layer Foley Timeline (Footsteps, Movement, Specifics)</p>
    </div>
    <div style="display:flex; gap:8px; flex-wrap:wrap;">
      <button id="modeToggleBtn" type="button" aria-pressed="false">Mode: Full Studio (12 Sounds)</button>
    </div>
  </header>

  <section class="toolbar" aria-label="Video Source Controls">
    <label class="file-btn" for="videoUploadInput">
      Upload Video Clip
      <input id="videoUploadInput" type="file" accept="video/*" class="sr-only" />
    </label>
    <input id="videoUrlInput" type="url" placeholder="Paste sample MP4 URL..." aria-label="Sample video URL" style="flex:1; min-width:200px;" />
    <button id="loadUrlBtn" type="button">Load URL</button>
    <button id="loadDemoBtn" type="button">Use Built-In Demo Scene</button>
  </section>

  <div class="grid">
    <section class="card" aria-label="Video Player and 3-Layer Timeline">
      <div class="stage-wrap">
        <video id="videoEl" playsinline style="display:none;"></video>
        <canvas id="demoCanvas" width="960" height="540" aria-label="Built-in demo scene"></canvas>
        <canvas id="overlayCanvas" width="960" height="540" aria-hidden="true"></canvas>
        <div id="stateBadge" class="state-badge state-on">VIDEO AUDIO ON · FOLEY LAYERS ACTIVE</div>
      </div>

      <div class="transport">
        <button id="playPauseBtn" type="button" class="btn-primary" aria-label="Play or pause video">Play</button>
        <button id="restartBtn" type="button" aria-label="Restart video from beginning">Restart</button>
        <button id="stripBtn" type="button" aria-pressed="false" aria-label="Strip original video audio only while keeping Foley">Strip Video Sound: Off</button>
        <button id="compareBtn" type="button" aria-pressed="true" class="btn-ok-active" aria-label="Toggle Before and After Foley layer comparison">After: Foley Mix On</button>
        <span id="timeDisplay" class="timecode" aria-live="off">00:00.0 / 00:18.0</span>
      </div>

      <div class="timeline-box">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <strong>3-Layer Foley Timeline (drag cues across time or layers · scrub back to replay)</strong>
          <div style="display:flex; gap:8px;">
            <button id="loadPresetMixBtn" type="button" style="min-height:36px; padding:6px 12px; font-size:0.85rem;">Load Example Mix</button>
            <button id="clearTimelineBtn" type="button" style="min-height:36px; padding:6px 12px; font-size:0.85rem;">Clear Timeline</button>
          </div>
        </div>
        <div class="timeline-shell">
          <div class="layer-labels">
            <div class="layer-label"><span class="layer-dot" style="background:#F59E0B;"></span>Footsteps</div>
            <div class="layer-label"><span class="layer-dot" style="background:#10B981;"></span>Movement</div>
            <div class="layer-label"><span class="layer-dot" style="background:#38BDF8;"></span>Specifics</div>
          </div>
          <div id="timelineTrack" class="timeline-track" role="slider" tabindex="0" aria-label="3-layer Foley timeline scrubber" aria-valuemin="0" aria-valuemax="18" aria-valuenow="0">
            <div class="lane-row" data-layer="footsteps"></div>
            <div class="lane-row" data-layer="movement"></div>
            <div class="lane-row" data-layer="specifics"></div>
            <div id="playhead" class="playhead" style="left:0%;"></div>
          </div>
        </div>
      </div>
    </section>

    <aside class="card" aria-label="Foley Soundboard">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
        <h2 style="margin:0; font-size:1.15rem;">Foley Soundboard</h2>
        <span style="font-size:0.82rem; color:var(--muted);">Click to Play &amp; Stamp</span>
      </div>
      <p style="font-size:0.85rem; color:var(--muted); margin:6px 0 0;">
        Press any Foley button to audition the effect and stamp it onto its matching timeline layer.
      </p>

      <div id="soundGridContainer" style="max-height:540px; overflow-y:auto; padding-right:4px;"></div>

      <div id="extensionBox" style="margin-top:14px; padding-top:12px; border-top:1px solid var(--border);">
        <label class="file-btn" for="customAudioInput" style="width:100%;">
          + Upload Custom Sound (MP3 / WAV Extension)
          <input id="customAudioInput" type="file" accept="audio/*" class="sr-only" />
        </label>
      </div>
    </aside>
  </div>

  <section class="card" style="margin-top:16px;" aria-label="Guided Reflection Questions">
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <h2 style="margin:0; font-size:1.15rem;">Guided Reflection (DOK 2–3)</h2>
      <button id="copyNotesBtn" type="button" style="min-height:38px; padding:8px 14px; font-size:0.88rem;">Copy Reflections &amp; Cue Log</button>
    </div>
    <div class="reflection-grid">
      <div class="q-card">
        <label for="q1">1. Which sound made the biggest difference to the scene's realism, and why?</label>
        <textarea id="q1" placeholder="Describe how one Foley layer anchored space, weight, or physics..."></textarea>
      </div>
      <div class="q-card">
        <label for="q2">2. How would the emotion change if a key sound were exaggerated or removed?</label>
        <textarea id="q2" placeholder="Compare silent detachment vs. heightened suspense or impact..."></textarea>
      </div>
      <div class="q-card">
        <label for="q3">3. Why do Foley artists re-record everyday sounds in a studio instead of relying only on set mics?</label>
        <textarea id="q3" placeholder="Consider clean dialogue tracks, international mixes, and creative exaggeration..."></textarea>
      </div>
    </div>
  </section>
</div>

<script>
(function() {
  const LAYERS = [
    { id: 'footsteps', label: 'Footsteps', color: '#F59E0B' },
    { id: 'movement', label: 'Movement', color: '#10B981' },
    { id: 'specifics', label: 'Specifics', color: '#38BDF8' }
  ];

  const SOUNDS = [
    { id: 'footsteps', label: 'Stone Footsteps', layer: 'footsteps', dur: 1.1, desc: 'Heel-toe steps on wet stone', color: '#F59E0B', simple: true },
    { id: 'gravelSteps', label: 'Gravel Steps', layer: 'footsteps', dur: 0.95, desc: 'Crunching boots on gravel', color: '#FBBF24', simple: false },
    { id: 'waterSplash', label: 'Puddle Splash', layer: 'footsteps', dur: 0.85, desc: 'Boot hitting a deep puddle', color: '#06B6D4', simple: true },
    { id: 'clothRustle', label: 'Cloth Rustle', layer: 'movement', dur: 0.68, desc: 'Coat sleeve friction', color: '#10B981', simple: true },
    { id: 'whoosh', label: 'Quick Whoosh', layer: 'movement', dur: 0.55, desc: 'Fast camera whip or turn', color: '#34D399', simple: false },
    { id: 'doorCreak', label: 'Door Creak', layer: 'movement', dur: 1.45, desc: 'Slow rusty iron hinge', color: '#0EA5E9', simple: true },
    { id: 'explosion', label: 'Explosion', layer: 'specifics', dur: 2.1, desc: 'Sub-bass boom & fireball roar', color: '#F97316', simple: true },
    { id: 'punchImpact', label: 'Heavy Impact', layer: 'specifics', dur: 0.35, desc: 'Deep body thud & snap', color: '#EF4444', simple: true },
    { id: 'glassBreak', label: 'Glass Breaking', layer: 'specifics', dur: 0.75, desc: 'Sharp shatter & shards', color: '#EC4899', simple: false },
    { id: 'paperCrinkle', label: 'Paper Crinkle', layer: 'specifics', dur: 0.65, desc: 'Folded note handling', color: '#A855F7', simple: false },
    { id: 'thunder', label: 'Thunder Clap', layer: 'specifics', dur: 2.6, desc: 'Rolling lightning thunder', color: '#818CF8', simple: false },
    { id: 'rain', label: 'Rain Ambience', layer: 'specifics', dur: 2.6, desc: 'Steady nocturnal rainfall', color: '#38BDF8', simple: false }
  ];

  let audioCtx = null;
  const customBuffers = new Map();
  let mode = 'demo';
  let isPlaying = false;
  let currentTime = 0;
  let duration = 18;
  let isStripped = false;
  let compareAfter = true;
  let simplifiedMode = false;
  let isSeeking = false;
  let cues = [
    { uid: 1, id: 'rain', label: 'Rain Ambience', layer: 'specifics', time: 0.2, duration: 2.6, color: '#38BDF8' },
    { uid: 2, id: 'footsteps', label: 'Stone Footsteps', layer: 'footsteps', time: 1.8, duration: 1.1, color: '#F59E0B' },
    { uid: 3, id: 'doorCreak', label: 'Door Creak', layer: 'movement', time: 7.5, duration: 1.45, color: '#0EA5E9' },
    { uid: 4, id: 'glassBreak', label: 'Glass Breaking', layer: 'specifics', time: 14.2, duration: 0.75, color: '#EC4899' }
  ];
  let lastTickTime = -0.01;
  let lastRafStamp = performance.now();
  const particles = [];

  const videoEl = document.getElementById('videoEl');
  const demoCanvas = document.getElementById('demoCanvas');
  const overlayCanvas = document.getElementById('overlayCanvas');
  const dctx = demoCanvas.getContext('2d');
  const octx = overlayCanvas.getContext('2d');
  const stateBadge = document.getElementById('stateBadge');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const stripBtn = document.getElementById('stripBtn');
  const compareBtn = document.getElementById('compareBtn');
  const timeDisplay = document.getElementById('timeDisplay');
  const timelineTrack = document.getElementById('timelineTrack');
  const playhead = document.getElementById('playhead');
  const soundGridContainer = document.getElementById('soundGridContainer');

  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function noiseBuffer(ctx, sec) {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * sec), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function playFoley(id, color, bypassCompare) {
    if (!compareAfter && !bypassCompare) return;
    const ctx = ensureAudio();
    const now = ctx.currentTime;
    spawnParticles(color || '#F59E0B');

    if (customBuffers.has(id)) {
      const src = ctx.createBufferSource();
      src.buffer = customBuffers.get(id);
      src.connect(ctx.destination);
      src.start();
      return;
    }

    if (id === 'footsteps') {
      [0, 0.4, 0.82].forEach(off => {
        const t = now + off;
        const n = ctx.createBufferSource(); n.buffer = noiseBuffer(ctx, 0.12);
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 520;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        n.connect(f); f.connect(g); g.connect(ctx.destination); n.start(t); n.stop(t + 0.11);
      });
    } else if (id === 'gravelSteps') {
      [0, 0.36, 0.72].forEach(off => {
        const t = now + off;
        const n = ctx.createBufferSource(); n.buffer = noiseBuffer(ctx, 0.22);
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(2200, t); f.frequency.exponentialRampToValueAtTime(1100, t + 0.18);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        n.connect(f); f.connect(g); g.connect(ctx.destination); n.start(t); n.stop(t + 0.21);
      });
    } else if (id === 'doorCreak') {
      const osc = ctx.createOscillator(); osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now); osc.frequency.linearRampToValueAtTime(260, now + 0.9); osc.frequency.linearRampToValueAtTime(135, now + 1.4);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 820; bp.Q.value = 6;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.01, now); g.gain.linearRampToValueAtTime(0.38, now + 0.2); g.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      osc.connect(bp); bp.connect(g); g.connect(ctx.destination); osc.start(now); osc.stop(now + 1.42);
    } else if (id === 'whoosh') {
      const n = ctx.createBufferSource(); n.buffer = noiseBuffer(ctx, 0.55);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(280, now); bp.frequency.exponentialRampToValueAtTime(2000, now + 0.22); bp.frequency.exponentialRampToValueAtTime(340, now + 0.55);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.01, now); g.gain.linearRampToValueAtTime(0.68, now + 0.2); g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      n.connect(bp); bp.connect(g); g.connect(ctx.destination); n.start(now); n.stop(now + 0.56);
    } else if (id === 'explosion') {
      const sub = ctx.createOscillator(); sub.type = 'sine';
      sub.frequency.setValueAtTime(115, now); sub.frequency.exponentialRampToValueAtTime(26, now + 0.55);
      const sg = ctx.createGain(); sg.gain.setValueAtTime(1.0, now); sg.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      sub.connect(sg); sg.connect(ctx.destination); sub.start(now); sub.stop(now + 0.78);
      const roar = ctx.createBufferSource(); roar.buffer = noiseBuffer(ctx, 2.0);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(2200, now); lp.frequency.exponentialRampToValueAtTime(140, now + 2.0);
      const rg = ctx.createGain(); rg.gain.setValueAtTime(0.95, now); rg.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
      roar.connect(lp); lp.connect(rg); rg.connect(ctx.destination); roar.start(now); roar.stop(now + 2.05);
    } else if (id === 'thunder') {
      const n = ctx.createBufferSource(); n.buffer = noiseBuffer(ctx, 2.4);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(1000, now); lp.frequency.exponentialRampToValueAtTime(110, now + 2.4);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.85, now); g.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
      n.connect(lp); lp.connect(g); g.connect(ctx.destination); n.start(now); n.stop(now + 2.45);
    } else if (id === 'glassBreak') {
      const n = ctx.createBufferSource(); n.buffer = noiseBuffer(ctx, 0.5);
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2200;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.7, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      n.connect(hp); hp.connect(g); g.connect(ctx.destination); n.start(now); n.stop(now + 0.48);
      [2800, 3900, 5200, 6400].forEach((fr, idx) => {
        const o = ctx.createOscillator(); o.frequency.value = fr;
        const sg = ctx.createGain(); sg.gain.setValueAtTime(0.2, now + idx * 0.05); sg.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);
        o.connect(sg); sg.connect(ctx.destination); o.start(now + idx * 0.05); o.stop(now + idx * 0.05 + 0.22);
      });
    } else if (id === 'rain') {
      const n = ctx.createBufferSource(); n.buffer = noiseBuffer(ctx, 2.2);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1350; bp.Q.value = 0.7;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.01, now); g.gain.linearRampToValueAtTime(0.32, now + 0.3); g.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
      n.connect(bp); bp.connect(g); g.connect(ctx.destination); n.start(now); n.stop(now + 2.22);
    } else if (id === 'clothRustle') {
      const n = ctx.createBufferSource(); n.buffer = noiseBuffer(ctx, 0.6);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(950, now); bp.frequency.exponentialRampToValueAtTime(2100, now + 0.3);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.01, now); g.gain.linearRampToValueAtTime(0.35, now + 0.15); g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      n.connect(bp); bp.connect(g); g.connect(ctx.destination); n.start(now); n.stop(now + 0.62);
    } else if (id === 'punchImpact') {
      const o = ctx.createOscillator(); o.frequency.setValueAtTime(140, now); o.frequency.exponentialRampToValueAtTime(36, now + 0.18);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.95, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      o.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now + 0.24);
    } else if (id === 'paperCrinkle') {
      for (let i = 0; i < 8; i++) {
        const t = now + i * 0.06;
        const n = ctx.createBufferSource(); n.buffer = noiseBuffer(ctx, 0.06);
        const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 2800 + Math.random() * 2000;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.32, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        n.connect(hp); hp.connect(g); g.connect(ctx.destination); n.start(t); n.stop(t + 0.055);
      }
    } else if (id === 'waterSplash') {
      const n = ctx.createBufferSource(); n.buffer = noiseBuffer(ctx, 0.7);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(650, now); bp.frequency.exponentialRampToValueAtTime(2400, now + 0.2);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.6, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      n.connect(bp); bp.connect(g); g.connect(ctx.destination); n.start(now); n.stop(now + 0.72);
    }
  }

  function spawnParticles(color) {
    const cx = 180 + Math.random() * 600;
    const cy = 140 + Math.random() * 260;
    for (let i = 0; i < 22; i++) {
      const ang = (Math.PI * 2 * i) / 22;
      const spd = 1.5 + Math.random() * 3.5;
      particles.push({ x: cx, y: cy, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, a: 1, c: color });
    }
  }

  function fmt(t) {
    const m = Math.floor(t / 60);
    const s = (t % 60).toFixed(1).padStart(4, '0');
    return String(m).padStart(2, '0') + ':' + s;
  }

  function syncAudioBanner() {
    if (mode === 'video') {
      // Strip Sound ONLY affects the original video track, never added Foley layers
      videoEl.muted = isStripped;
    }
    stateBadge.textContent = isStripped
      ? (compareAfter ? 'VIDEO AUDIO STRIPPED · FOLEY LAYERS ACTIVE' : 'VIDEO AUDIO STRIPPED · FOLEY MUTED (SILENT)')
      : (compareAfter ? 'VIDEO AUDIO ON · FOLEY LAYERS ACTIVE' : 'VIDEO AUDIO ON · FOLEY MUTED (BEFORE)');
    stateBadge.className = 'state-badge ' + (!compareAfter ? 'state-off' : isStripped ? 'state-strip' : 'state-on');
    stripBtn.textContent = isStripped ? 'Strip Video Sound: ON' : 'Strip Video Sound: Off';
    stripBtn.setAttribute('aria-pressed', String(isStripped));
    stripBtn.className = isStripped ? 'btn-strip-active' : '';
    compareBtn.textContent = compareAfter ? 'After: Foley Mix On' : 'Before: Foley Muted';
    compareBtn.setAttribute('aria-pressed', String(compareAfter));
    compareBtn.className = compareAfter ? 'btn-ok-active' : 'btn-danger-active';
  }

  function renderSoundboard() {
    soundGridContainer.innerHTML = '';
    const visible = simplifiedMode ? SOUNDS.filter(s => s.simple || s.custom) : SOUNDS;
    LAYERS.forEach(layer => {
      const group = visible.filter(s => s.layer === layer.id);
      if (!group.length) return;
      const title = document.createElement('div');
      title.className = 'layer-group-title';
      title.innerHTML = '<span class="layer-dot" style="background:' + layer.color + ';"></span>' + layer.label;
      soundGridContainer.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'sound-grid';
      group.forEach(s => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sound-btn';
        btn.style.borderTop = '3px solid ' + s.color;
        btn.innerHTML = '<span class="sound-title">' + s.label + '</span><span class="sound-desc">' + s.desc + '</span>';
        btn.addEventListener('click', () => {
          playFoley(s.id, s.color, true);
          cues.push({ uid: Date.now() + Math.random(), id: s.id, label: s.label, layer: s.layer, time: Number(currentTime.toFixed(2)), duration: s.dur || 0.8, color: s.color });
          renderTimeline();
        });
        grid.appendChild(btn);
      });
      soundGridContainer.appendChild(grid);
    });
  }

  function renderTimeline() {
    timelineTrack.querySelectorAll('.cue-pin').forEach(el => el.remove());
    const safeDur = Math.max(0.1, duration);
    cues.forEach(c => {
      const laneEl = timelineTrack.querySelector('.lane-row[data-layer="' + (c.layer || 'specifics') + '"]') || timelineTrack.querySelector('.lane-row[data-layer="specifics"]');
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'cue-pin';
      const leftPct = Math.min(99.2, Math.max(0, (c.time / safeDur) * 100));
      const cueDur = c.duration || (SOUNDS.find(s => s.id === c.id) || {}).dur || 0.8;
      const widthPct = Math.max(1.8, Math.min(100 - leftPct, (cueDur / safeDur) * 100));
      pin.style.left = leftPct + '%';
      pin.style.width = widthPct + '%';
      pin.style.background = c.color;
      pin.title = c.label + ' at ' + fmt(c.time) + ' (' + cueDur.toFixed(1) + 's) — drag to adjust timing or layer';

      const textSpan = document.createElement('span');
      textSpan.className = 'cue-label';
      textSpan.textContent = c.label;
      pin.appendChild(textSpan);

      const rmSpan = document.createElement('span');
      rmSpan.className = 'cue-remove';
      rmSpan.textContent = '×';
      rmSpan.title = 'Remove ' + c.label;
      rmSpan.addEventListener('pointerdown', (e) => e.stopPropagation());
      rmSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        cues = cues.filter(x => x.uid !== c.uid);
        renderTimeline();
      });
      pin.appendChild(rmSpan);

      pin.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        const startRect = timelineTrack.getBoundingClientRect();
        const startRatio = Math.min(1, Math.max(0, (e.clientX - startRect.left) / startRect.width));
        const grabOffsetSec = startRatio * duration - c.time;
        let hasMoved = false;
        let tip = null;

        const onMove = (ev) => {
          if (!hasMoved && Math.abs(ev.clientX - startX) < 4 && Math.abs(ev.clientY - startY) < 4) return;
          if (!hasMoved) {
            hasMoved = true;
            pin.classList.add('dragging');
            tip = document.createElement('span');
            tip.className = 'cue-time-tip';
            pin.appendChild(tip);
          }
          const rect = timelineTrack.getBoundingClientRect();
          const ratio = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
          const pointerTime = ratio * duration;
          const maxStart = Math.max(0, duration - 0.1);
          c.time = Number(Math.min(maxStart, Math.max(0, pointerTime - grabOffsetSec)).toFixed(2));
          const relY = Math.min(rect.height - 1, Math.max(0, ev.clientY - rect.top));
          const laneIdx = Math.min(LAYERS.length - 1, Math.floor((relY / rect.height) * LAYERS.length));
          const targetLayer = LAYERS[laneIdx].id;
          if (c.layer !== targetLayer) {
            c.layer = targetLayer;
            const targetRow = timelineTrack.querySelector('.lane-row[data-layer="' + targetLayer + '"]');
            if (targetRow && pin.parentElement !== targetRow) targetRow.appendChild(pin);
          }
          const nextLeft = Math.min(99.2, Math.max(0, (c.time / Math.max(0.1, duration)) * 100));
          const nextWidth = Math.max(1.8, Math.min(100 - nextLeft, (cueDur / Math.max(0.1, duration)) * 100));
          pin.style.left = nextLeft + '%';
          pin.style.width = nextWidth + '%';
          pin.title = c.label + ' at ' + fmt(c.time);
          if (tip) tip.textContent = fmt(c.time);
        };

        const onUp = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('pointercancel', onUp);
          pin.classList.remove('dragging');
          if (tip) tip.remove();
          if (!hasMoved) {
            seekTo(c.time);
            playFoley(c.id, c.color, true);
          }
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
      });

      laneEl.appendChild(pin);
    });
  }

  function seekTo(targetTime) {
    const clamped = Math.min(duration, Math.max(0, targetTime));
    currentTime = clamped;
    lastTickTime = clamped - 0.01;
    if (mode === 'video') {
      isSeeking = true;
      videoEl.currentTime = clamped;
      setTimeout(() => { isSeeking = false; }, 80);
    }
    updateUI();
  }

  function updateUI() {
    playhead.style.left = Math.min(100, (currentTime / Math.max(0.1, duration)) * 100) + '%';
    timeDisplay.textContent = fmt(currentTime) + ' / ' + fmt(duration);
    playPauseBtn.textContent = isPlaying ? 'Pause' : 'Play';
  }

  function drawDemoScene() {
    const w = 960, h = 540;
    dctx.fillStyle = '#0A101B';
    dctx.fillRect(0, 0, w, h);
    dctx.fillStyle = '#141E30';
    dctx.fillRect(0, h * 0.74, w, h * 0.26);
    const doorOpen = currentTime >= 7.4 ? Math.min(1, (currentTime - 7.4) / 1.5) : 0;
    dctx.fillStyle = '#05080F'; dctx.fillRect(730, 180, 90, 220);
    dctx.fillStyle = '#1E293B'; dctx.fillRect(730, 180, 90 * (1 - doorOpen * 0.72), 220);
    const figX = 140 + (currentTime / duration) * 520;
    dctx.fillStyle = '#38BDF8';
    dctx.fillRect(figX - 16, 305, 32, 95);
    dctx.beginPath(); dctx.arc(figX, 286, 15, 0, Math.PI * 2); dctx.fill();
  }

  function loop(now) {
    const dt = Math.min(0.1, (now - lastRafStamp) / 1000);
    lastRafStamp = now;

    if (!isSeeking) {
      if (isPlaying && mode === 'demo') {
        currentTime = Math.min(duration, currentTime + dt);
      } else if (mode === 'video' && !videoEl.paused) {
        if (videoEl.currentTime < lastTickTime - 0.25) {
          lastTickTime = videoEl.currentTime - 0.01;
        }
        currentTime = videoEl.currentTime;
      }

      if (isPlaying && currentTime > lastTickTime) {
        cues.forEach(c => {
          if (c.time > lastTickTime && c.time <= currentTime) {
            playFoley(c.id, c.color, false);
          }
        });
        lastTickTime = currentTime;
      }

      if (isPlaying && mode === 'demo' && currentTime >= duration) {
        isPlaying = false;
      }
    }

    if (mode === 'demo') drawDemoScene();

    octx.clearRect(0, 0, 960, 540);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.a -= 0.025;
      if (p.a <= 0) { particles.splice(i, 1); continue; }
      octx.globalAlpha = p.a; octx.fillStyle = p.c;
      octx.beginPath(); octx.arc(p.x, p.y, 3, 0, Math.PI * 2); octx.fill();
    }
    octx.globalAlpha = 1;

    updateUI();
    requestAnimationFrame(loop);
  }

  playPauseBtn.addEventListener('click', () => {
    ensureAudio();
    isPlaying = !isPlaying;
    if (isPlaying) {
      if (currentTime >= duration - 0.05) {
        seekTo(0);
      } else {
        lastTickTime = currentTime - 0.01;
      }
    }
    if (mode === 'video') {
      if (isPlaying) videoEl.play(); else videoEl.pause();
    }
  });

  document.getElementById('restartBtn').addEventListener('click', () => {
    seekTo(0);
  });

  stripBtn.addEventListener('click', () => { isStripped = !isStripped; syncAudioBanner(); });
  compareBtn.addEventListener('click', () => { compareAfter = !compareAfter; syncAudioBanner(); });

  document.getElementById('modeToggleBtn').addEventListener('click', function() {
    simplifiedMode = !simplifiedMode;
    this.textContent = simplifiedMode ? 'Mode: Simplified (6 Sounds)' : 'Mode: Full Studio (12 Sounds)';
    this.setAttribute('aria-pressed', String(simplifiedMode));
    renderSoundboard();
  });

  document.getElementById('videoUploadInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    mode = 'video';
    videoEl.src = URL.createObjectURL(file);
    videoEl.style.display = 'block';
    demoCanvas.style.display = 'none';
    isPlaying = false;
    seekTo(0);
    syncAudioBanner();
  });

  document.getElementById('loadUrlBtn').addEventListener('click', () => {
    const url = document.getElementById('videoUrlInput').value.trim();
    if (!url) return;
    mode = 'video';
    videoEl.src = url;
    videoEl.style.display = 'block';
    demoCanvas.style.display = 'none';
    isPlaying = false;
    seekTo(0);
    syncAudioBanner();
  });

  document.getElementById('loadDemoBtn').addEventListener('click', () => {
    mode = 'demo'; duration = 18; isPlaying = false;
    videoEl.pause(); videoEl.style.display = 'none'; demoCanvas.style.display = 'block';
    seekTo(0);
    renderTimeline();
  });

  videoEl.addEventListener('loadedmetadata', () => {
    duration = videoEl.duration || 18;
    renderTimeline();
  });

  timelineTrack.addEventListener('pointerdown', (e) => {
    isSeeking = true;
    const scrub = (clientX) => {
      const rect = timelineTrack.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      seekTo(ratio * duration);
    };
    scrub(e.clientX);
    const onMove = (ev) => scrub(ev.clientX);
    const onUp = () => {
      isSeeking = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  });

  timelineTrack.addEventListener('wheel', (e) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 1) return;
    e.preventDefault();
    seekTo(currentTime + (delta / 100) * 0.5);
  }, { passive: false });

  document.getElementById('loadPresetMixBtn').addEventListener('click', () => {
    cues = [
      { uid: 1, id: 'rain', label: 'Rain Ambience', layer: 'specifics', time: 0.2, duration: 2.6, color: '#38BDF8' },
      { uid: 2, id: 'footsteps', label: 'Stone Footsteps', layer: 'footsteps', time: 1.8, duration: 1.1, color: '#F59E0B' },
      { uid: 3, id: 'doorCreak', label: 'Door Creak', layer: 'movement', time: 7.5, duration: 1.45, color: '#0EA5E9' },
      { uid: 4, id: 'glassBreak', label: 'Glass Breaking', layer: 'specifics', time: 14.2, duration: 0.75, color: '#EC4899' }
    ];
    renderTimeline();
  });

  document.getElementById('clearTimelineBtn').addEventListener('click', () => {
    cues = []; renderTimeline();
  });

  document.getElementById('customAudioInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ctx = ensureAudio();
    const buf = await ctx.decodeAudioData(await file.arrayBuffer());
    const id = 'custom_' + Date.now();
    customBuffers.set(id, buf);
    SOUNDS.push({ id, label: file.name.replace(/\\.[^/.]+$/, '').slice(0, 18), layer: 'specifics', dur: buf.duration || 1.0, desc: 'Uploaded student Foley', color: '#FBBF24', simple: true, custom: true });
    renderSoundboard();
  });

  document.getElementById('copyNotesBtn').addEventListener('click', function() {
    const txt = [
      'FOLEY SOUND LAB — STUDENT REFLECTION',
      'Placed Cues: ' + cues.map(c => c.label + ' [' + c.layer + '] @ ' + fmt(c.time)).join(', '),
      'Q1: ' + document.getElementById('q1').value,
      'Q2: ' + document.getElementById('q2').value,
      'Q3: ' + document.getElementById('q3').value
    ].join('\\n\\n');
    navigator.clipboard.writeText(txt);
    this.textContent = 'Copied to Clipboard!';
    setTimeout(() => { this.textContent = 'Copy Reflections & Cue Log'; }, 2000);
  });

  renderSoundboard();
  renderTimeline();
  syncAudioBanner();
  requestAnimationFrame(loop);
})();
</script>
</body>
</html>`;
}
