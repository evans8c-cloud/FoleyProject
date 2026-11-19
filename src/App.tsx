import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AudioLines,
  Code2,
  Eye,
  Film,
  Layers,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { foleyAudio } from './audio/foleySynth';
import {
  DEFAULT_DEMO_CUES,
  FOLEY_LAYERS,
  FOLEY_SOUNDS,
  FoleyLayer,
  FoleySoundDef,
  SAMPLE_VIDEO_OPTIONS,
  TimelineCue,
} from './data/foleyPresets';
import { ParticleBurst, StageCanvas } from './components/StageCanvas';
import { ReflectionSection } from './components/ReflectionSection';
import { EmbedExportModal } from './components/EmbedExportModal';

function formatTimecode(seconds: number): string {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = (safe % 60).toFixed(1).padStart(4, '0');
  return `${String(mins).padStart(2, '0')}:${secs}`;
}

const STORAGE_KEY_ANSWERS = 'foley_lab_reflection_v1';

export default function App() {
  // Video & Playback state
  const [stageMode, setStageMode] = useState<'demo' | 'video'>('demo');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>(SAMPLE_VIDEO_OPTIONS[1].url);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(18);

  // Sound & Comparison state
  const [isStripped, setIsStripped] = useState<boolean>(false);
  const [comparisonMode, setComparisonMode] = useState<'after' | 'before'>('after');
  const [stampOnClick, setStampOnClick] = useState<boolean>(true);
  const [showParticles, setShowParticles] = useState<boolean>(true);

  // Differentiation & Custom Sounds
  const [simplifiedMode, setSimplifiedMode] = useState<boolean>(false);
  const [sounds, setSounds] = useState<FoleySoundDef[]>(FOLEY_SOUNDS);
  const [customUploadNote, setCustomUploadNote] = useState<string | null>(null);

  // Timeline Cues & Particle Art bursts
  const [cues, setCues] = useState<TimelineCue[]>(DEFAULT_DEMO_CUES);
  const [activeBursts, setActiveBursts] = useState<ParticleBurst[]>([]);
  const burstCounterRef = useRef<number>(0);

  // Reflection Notes
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ANSWERS);
      return saved ? (JSON.parse(saved) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });

  // Google Sites Embed Modal
  const [isEmbedOpen, setIsEmbedOpen] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timelineTrackRef = useRef<HTMLDivElement | null>(null);
  const currentTimeRef = useRef<number>(0);
  const lastTriggeredTimeRef = useRef<number>(-0.01);
  const isSeekingRef = useRef<boolean>(false);
  const rafRef = useRef<number>(0);
  const lastRafStampRef = useRef<number>(0);
  const objectUrlRef = useRef<string | null>(null);

  const [draggingCueUid, setDraggingCueUid] = useState<string | null>(null);
  const cuesRef = useRef<TimelineCue[]>(cues);
  cuesRef.current = cues;
  const durationRef = useRef<number>(duration);
  durationRef.current = duration;

  // Save reflection notes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ANSWERS, JSON.stringify(answers));
    } catch {
      // Ignore storage quota errors
    }
  }, [answers]);

  // Strip Sound ONLY affects original video audio, never added Foley effects.
  // Before/After comparison toggles added Foley effects on/off.
  useEffect(() => {
    foleyAudio.setMuted(comparisonMode === 'before');
    if (videoRef.current) {
      videoRef.current.muted = isStripped;
    }
  }, [isStripped, comparisonMode]);

  const spawnBurst = useCallback((color: string, label: string) => {
    burstCounterRef.current += 1;
    const newBurst: ParticleBurst = {
      id: burstCounterRef.current,
      x: 180 + Math.random() * 600,
      y: 120 + Math.random() * 280,
      color,
      label,
      createdAt: Date.now(),
    };
    setActiveBursts((prev) => [...prev.slice(-14), newBurst]);
  }, []);

  const triggerFoleySound = useCallback(
    (sound: FoleySoundDef, forcePlay = false) => {
      const foleyMuted = comparisonMode === 'before';
      if (!foleyMuted || forcePlay) {
        foleyAudio.playSound(sound.id, false);
        spawnBurst(sound.color, sound.label);
      }
    },
    [comparisonMode, spawnBurst]
  );

  // Trigger cues strictly within (prevTime, nextTime] forward window
  const processCueWindow = useCallback(
    (prevTime: number, nextTime: number) => {
      if (comparisonMode === 'before') return;
      if (nextTime <= prevTime) return;
      cuesRef.current.forEach((cue) => {
        if (cue.time > prevTime && cue.time <= nextTime) {
          foleyAudio.playSound(cue.soundId, false);
          spawnBurst(cue.color, cue.label);
        }
      });
    },
    [comparisonMode, spawnBurst]
  );

  // Demo scene playback loop (when in 'demo' mode)
  useEffect(() => {
    if (stageMode !== 'demo' || !isPlaying) return;

    lastRafStampRef.current = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.1, (now - lastRafStampRef.current) / 1000);
      lastRafStampRef.current = now;

      if (!isSeekingRef.current) {
        const prev = currentTimeRef.current;
        const next = Math.min(durationRef.current, prev + dt);
        processCueWindow(lastTriggeredTimeRef.current, next);
        lastTriggeredTimeRef.current = next;
        currentTimeRef.current = next;
        setCurrentTime(next);

        if (next >= durationRef.current) {
          setIsPlaying(false);
          return;
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [stageMode, isPlaying, processCueWindow]);

  const handlePlayPause = useCallback(() => {
    if (stageMode === 'video' && videoRef.current) {
      if (videoRef.current.paused) {
        if (videoRef.current.currentTime >= duration - 0.05) {
          videoRef.current.currentTime = 0;
          currentTimeRef.current = 0;
          setCurrentTime(0);
          lastTriggeredTimeRef.current = -0.01;
        } else {
          lastTriggeredTimeRef.current = videoRef.current.currentTime - 0.01;
        }
        void videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    setIsPlaying((prev) => {
      if (!prev) {
        if (currentTimeRef.current >= duration - 0.05) {
          currentTimeRef.current = 0;
          setCurrentTime(0);
          lastTriggeredTimeRef.current = -0.01;
        } else {
          lastTriggeredTimeRef.current = currentTimeRef.current - 0.01;
        }
      }
      return !prev;
    });
  }, [stageMode, duration]);

  const handleRestart = useCallback(() => {
    foleyAudio.stopAll();
    currentTimeRef.current = 0;
    setCurrentTime(0);
    lastTriggeredTimeRef.current = -0.01;
    if (stageMode === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, [stageMode]);

  const handleSeek = useCallback(
    (targetTime: number) => {
      const clamped = Math.min(durationRef.current, Math.max(0, targetTime));
      const movedBackward = clamped < currentTimeRef.current - 0.02;
      if (movedBackward) {
        foleyAudio.stopAll();
      }
      currentTimeRef.current = clamped;
      setCurrentTime(clamped);
      // Re-arm all cues at or after the new playhead timestamp so scrolling back replays them
      lastTriggeredTimeRef.current = clamped - 0.01;

      if (stageMode === 'video' && videoRef.current) {
        isSeekingRef.current = true;
        videoRef.current.currentTime = clamped;
        window.setTimeout(() => {
          isSeekingRef.current = false;
        }, 80);
      }
    },
    [stageMode]
  );

  const handleSoundButtonClick = useCallback(
    (sound: FoleySoundDef) => {
      // Play Foley sound directly (Strip Sound never silences added Foley effects)
      foleyAudio.playSound(sound.id, false);
      spawnBurst(sound.color, sound.label);

      if (stampOnClick) {
        const stampedTime = Number(currentTimeRef.current.toFixed(2));
        setCues((prev) => [
          ...prev,
          {
            uid: `${sound.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            soundId: sound.id,
            label: sound.label,
            layer: sound.layer,
            time: stampedTime,
            duration: sound.durationHint,
            color: sound.color,
          },
        ]);
      }
    },
    [spawnBurst, stampOnClick]
  );

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const localUrl = URL.createObjectURL(file);
    objectUrlRef.current = localUrl;
    setVideoError(null);
    setStageMode('video');
    setVideoUrl(localUrl);
    setIsPlaying(false);
    currentTimeRef.current = 0;
    setCurrentTime(0);
    lastTriggeredTimeRef.current = -0.01;
  };

  const handleLoadUrl = (targetUrl?: string) => {
    const clean = (targetUrl ?? urlInput).trim();
    if (!clean) return;
    setVideoError(null);
    setStageMode('video');
    setVideoUrl(clean);
    setIsPlaying(false);
    currentTimeRef.current = 0;
    setCurrentTime(0);
    lastTriggeredTimeRef.current = -0.01;
  };

  const handleUseDemoScene = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setVideoError(null);
    setStageMode('demo');
    setDuration(18);
    currentTimeRef.current = 0;
    setCurrentTime(0);
    lastTriggeredTimeRef.current = -0.01;
    setIsPlaying(false);
  };

  const handleCustomAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const id = `custom_${Date.now()}`;
      const audioDur = await foleyAudio.registerCustomAudio(id, file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 22);
      const customSound: FoleySoundDef = {
        id,
        label: cleanName || 'Custom Foley',
        layer: 'specifics',
        description: `Student upload (${audioDur.toFixed(1)}s)`,
        color: '#FBBF24',
        badgeText: 'CUSTOM',
        shortcut: String(sounds.length + 1),
        simplified: true,
        isCustom: true,
        durationHint: audioDur,
      };
      setSounds((prev) => [...prev, customSound]);
      setCustomUploadNote(`Added "${cleanName}" to Specifics layer`);
      setTimeout(() => setCustomUploadNote(null), 3000);
    } catch {
      setCustomUploadNote('Could not decode audio file. Please use MP3, WAV, or OGG.');
      setTimeout(() => setCustomUploadNote(null), 4000);
    }
    e.target.value = '';
  };

  const visibleSounds = useMemo(() => {
    return simplifiedMode ? sounds.filter((s) => s.simplified || s.isCustom) : sounds;
  }, [simplifiedMode, sounds]);

  const sortedCues = useMemo(() => [...cues].sort((a, b) => a.time - b.time), [cues]);

  // Global keyboard shortcuts (disabled while typing in inputs/textareas)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleRestart();
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setComparisonMode((prev) => (prev === 'after' ? 'before' : 'after'));
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        setIsStripped((prev) => !prev);
      } else {
        const matchIdx = visibleSounds.findIndex((s) => s.shortcut === e.key);
        if (matchIdx >= 0) {
          e.preventDefault();
          handleSoundButtonClick(visibleSounds[matchIdx]);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlePlayPause, handleRestart, visibleSounds, handleSoundButtonClick]);

  const handleVideoTimeUpdate = (time: number) => {
    if (isSeekingRef.current) return;
    currentTimeRef.current = time;
    setCurrentTime(time);
    if (isPlaying) {
      if (time < lastTriggeredTimeRef.current - 0.25) {
        // Backward scrub detected via native video controls -> re-arm cues from new time
        lastTriggeredTimeRef.current = time - 0.01;
      } else {
        processCueWindow(lastTriggeredTimeRef.current, time);
        lastTriggeredTimeRef.current = time;
      }
    } else {
      lastTriggeredTimeRef.current = time - 0.01;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="border-b border-slate-800/90 bg-[#0B0F17]/95 backdrop-blur-sm">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#stage"
            className="text-xl font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0 font-display"
          >
            Foley Sound Lab
          </a>

          {/* Zone 2: 4 single-line nav links */}
          <nav
            aria-label="Primary sections"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300"
          >
            <a
              href="#stage"
              className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              Stage
            </a>
            <a
              href="#soundboard"
              className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              Soundboard
            </a>
            <a
              href="#timeline"
              className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              Timeline
            </a>
            <a
              href="#reflect"
              className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              Reflect
            </a>
          </nav>

          {/* Zone 3: 1 primary CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setIsEmbedOpen(true)}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold hover:bg-amber-400 inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Code2 className="w-4 h-4" />
              Google Sites Embed
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 py-6">
        {/* Compact Studio Intro & Source Controls */}
        <section aria-label="Studio Controls and Video Loader" className="mb-6">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">
                Grade 12 Film &amp; Media Production · Acoustic Storytelling &amp; Foley Layering
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight text-balance">
                Layer, Strip, and Compare Film Soundscapes
              </h1>
            </div>

            {/* Scaffolding & Particle Art Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="inline-flex items-center p-1 rounded-lg bg-[#131A26] border border-slate-800"
                role="group"
                aria-label="Differentiation complexity mode"
              >
                <button
                  type="button"
                  onClick={() => setSimplifiedMode(true)}
                  aria-pressed={simplifiedMode}
                  className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    simplifiedMode
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Simplified (6 Sounds)
                </button>
                <button
                  type="button"
                  onClick={() => setSimplifiedMode(false)}
                  aria-pressed={!simplifiedMode}
                  className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    !simplifiedMode
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Full Studio (12+ Custom)
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowParticles((prev) => !prev)}
                aria-pressed={showParticles}
                className={`min-h-[44px] px-3.5 py-2 rounded-lg border text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                  showParticles
                    ? 'bg-sky-950/70 border-sky-500/60 text-sky-200'
                    : 'bg-[#131A26] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Particle Art: {showParticles ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {/* Video Source Toolbar */}
          <div className="bg-[#131A26] border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center gap-3">
            <label
              htmlFor="video-file-upload"
              className="min-h-[44px] px-4 py-2 rounded-lg bg-[#1A2333] hover:bg-slate-700 border border-slate-700 text-sm font-semibold text-slate-100 inline-flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              Upload Video Clip
              <input
                id="video-file-upload"
                type="file"
                accept="video/*"
                onChange={handleVideoFileUpload}
                className="sr-only"
              />
            </label>

            <div className="flex flex-1 min-w-[240px] items-center gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste direct MP4 / WebM video URL..."
                aria-label="Sample or custom video URL"
                className="flex-1 min-h-[44px] px-3.5 py-2 rounded-lg bg-[#0B0F17] border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => handleLoadUrl()}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold text-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                Load URL
              </button>
            </div>

            <button
              type="button"
              onClick={handleUseDemoScene}
              className={`min-h-[44px] px-4 py-2 rounded-lg border text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                stageMode === 'demo'
                  ? 'bg-sky-950/70 border-sky-500/60 text-sky-200'
                  : 'bg-[#1A2333] border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Film className="w-4 h-4" />
              Built-In Demo Scene
            </button>
          </div>

          {videoError && (
            <div
              role="alert"
              className="mt-3 p-3 rounded-lg bg-rose-950/60 border border-rose-500/50 text-sm text-rose-200 flex items-center justify-between gap-4"
            >
              <span>{videoError}</span>
              <button
                type="button"
                onClick={handleUseDemoScene}
                className="px-3 py-1.5 rounded-md bg-rose-900 hover:bg-rose-800 text-xs font-semibold text-white whitespace-nowrap shrink-0"
              >
                Switch to Built-In Demo
              </button>
            </div>
          )}
        </section>

        {/* Two-Zone Studio Sandbox: Stage + Timeline (Left) | Foley Soundboard (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Zone (65% -> 7/12 or 8/12) */}
          <section id="stage" aria-label="Video Stage and Foley Timeline" className="lg:col-span-7 xl:col-span-8 space-y-5">
            <div className="bg-[#131A26] border border-slate-800 rounded-xl p-4 sm:p-5">
              <StageCanvas
                mode={stageMode}
                videoRef={videoRef}
                videoUrl={videoUrl}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                isStripped={isStripped}
                comparisonMode={comparisonMode}
                showParticles={showParticles}
                activeBursts={activeBursts}
                onVideoLoadedMetadata={(dur) => setDuration(dur)}
                onVideoTimeUpdate={handleVideoTimeUpdate}
                onVideoEnded={() => setIsPlaying(false)}
                onVideoError={() =>
                  setVideoError(
                    'The video URL could not be loaded (network or CORS restriction). Try uploading a local MP4 file or switch back to the Built-In Demo Scene.'
                  )
                }
              />

              {/* Large Projector-Friendly Transport & Comparison Controls */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handlePlayPause}
                  aria-label={isPlaying ? 'Pause playback (Space)' : 'Play playback (Space)'}
                  className="min-h-[48px] px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </button>

                <button
                  type="button"
                  onClick={handleRestart}
                  aria-label="Restart scene from beginning (R)"
                  className="min-h-[48px] px-4 py-2.5 rounded-lg bg-[#1A2333] hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restart
                </button>

                <button
                  type="button"
                  onClick={() => setIsStripped((prev) => !prev)}
                  aria-pressed={isStripped}
                  aria-label="Strip original video audio only while keeping added Foley layers (S)"
                  className={`min-h-[48px] px-4 py-2.5 rounded-lg border font-semibold text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                    isStripped
                      ? 'bg-amber-950 border-amber-500 text-amber-100 hover:bg-amber-900'
                      : 'bg-[#1A2333] border-slate-700 text-slate-100 hover:bg-slate-700'
                  }`}
                >
                  {isStripped ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
                  Strip Video Sound: {isStripped ? 'ON' : 'Off'}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setComparisonMode((prev) => (prev === 'after' ? 'before' : 'after'))
                  }
                  aria-pressed={comparisonMode === 'after'}
                  aria-label="Toggle Before and After Foley layer comparison (B)"
                  className={`min-h-[48px] px-4 py-2.5 rounded-lg border font-semibold text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                    comparisonMode === 'after'
                      ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-100 hover:bg-emerald-900/80'
                      : 'bg-rose-950/90 border-rose-500/80 text-rose-100 hover:bg-rose-900/80'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  {comparisonMode === 'after' ? 'After: Foley Mix On' : 'Before: Foley Muted'}
                </button>

                <div className="ml-auto px-3 py-2 rounded-lg bg-[#0B0F17] border border-slate-800 font-mono-tabular text-base font-semibold text-sky-400">
                  {formatTimecode(currentTime)} / {formatTimecode(duration)}
                </div>
              </div>

              {/* Keyboard Shortcut Hint Bar (quiet unboxed text) */}
              <div className="mt-3 text-xs text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>Shortcuts: Space Play/Pause</span>
                <span>·</span>
                <span>R Restart</span>
                <span>·</span>
                <span>S Strip Video Audio</span>
                <span>·</span>
                <span>B Before/After</span>
                <span>·</span>
                <span>1–9 Trigger Foley</span>
              </div>
            </div>

            {/* Interactive Visual Foley Timeline */}
            <div id="timeline" className="bg-[#131A26] border border-slate-800 rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100 inline-flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-400" />
                    Visual Foley Timeline
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {cues.length} placed cue{cues.length === 1 ? '' : 's'} · Drag cues horizontally to adjust time or vertically across Footsteps, Movement &amp; Specifics · Scrub back to replay
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCues(DEFAULT_DEMO_CUES)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#1A2333] hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors whitespace-nowrap shrink-0"
                  >
                    Load Example Mix
                  </button>
                  <button
                    type="button"
                    onClick={() => setCues([])}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#1A2333] hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/50 text-xs font-semibold text-slate-200 transition-colors whitespace-nowrap shrink-0"
                  >
                    Clear Track
                  </button>
                </div>
              </div>

              {/* 3-Layer Multi-Track Foley Timeline */}
              <div className="rounded-xl bg-[#0B0F17] border border-slate-800 overflow-visible">
                {/* Timecode Ruler Header */}
                <div className="flex border-b border-slate-800/90">
                  <div className="w-28 sm:w-36 shrink-0 px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-r border-slate-800/90">
                    Foley Layer
                  </div>
                  <div className="flex-1 flex justify-between px-2 py-1.5">
                    {[0, 0.25, 0.5, 0.75, 1].map((mark) => (
                      <span key={mark} className="text-[11px] font-mono-tabular text-slate-400">
                        {formatTimecode(duration * mark)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Scrubbable 3-Row Track Container */}
                <div className="flex relative">
                  {/* Left Layer Labels */}
                  <div className="w-28 sm:w-36 shrink-0 divide-y divide-slate-800/80 border-r border-slate-800/90">
                    {FOLEY_LAYERS.map((layer) => {
                      const layerCount = sortedCues.filter((c) => c.layer === layer.id).length;
                      return (
                        <div
                          key={layer.id}
                          className="h-14 px-3 flex flex-col justify-center bg-[#0E1420]"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-sm shrink-0"
                              style={{ backgroundColor: layer.accentColor }}
                              aria-hidden="true"
                            />
                            <span className="text-xs font-semibold text-slate-100 truncate">
                              {layer.label}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono-tabular mt-0.5">
                            {layerCount} cue{layerCount === 1 ? '' : 's'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Interactive 3-Lane Area */}
                  <div
                    ref={timelineTrackRef}
                    role="slider"
                    tabIndex={0}
                    aria-label="3-layer Foley timeline scrubber"
                    aria-valuemin={0}
                    aria-valuemax={Math.round(duration)}
                    aria-valuenow={Math.round(currentTime)}
                    onPointerDown={(e) => {
                      const track = timelineTrackRef.current;
                      if (!track) return;
                      isSeekingRef.current = true;
                      const updateScrub = (clientX: number) => {
                        const rect = track.getBoundingClientRect();
                        const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
                        handleSeek(ratio * durationRef.current);
                      };
                      updateScrub(e.clientX);
                      const onMove = (ev: PointerEvent) => updateScrub(ev.clientX);
                      const onUp = () => {
                        isSeekingRef.current = false;
                        window.removeEventListener('pointermove', onMove);
                        window.removeEventListener('pointerup', onUp);
                        window.removeEventListener('pointercancel', onUp);
                      };
                      window.addEventListener('pointermove', onMove);
                      window.addEventListener('pointerup', onUp);
                      window.addEventListener('pointercancel', onUp);
                    }}
                    onWheel={(e) => {
                      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                      if (Math.abs(delta) < 1) return;
                      e.preventDefault();
                      const step = (delta / 100) * 0.5;
                      handleSeek(currentTimeRef.current + step);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight') handleSeek(currentTime + 0.5);
                      if (e.key === 'ArrowLeft') handleSeek(currentTime - 0.5);
                    }}
                    className="flex-1 relative cursor-pointer select-none touch-none divide-y divide-slate-800/80"
                  >
                    {/* Vertical Beat Grid Lines */}
                    <div className="absolute inset-0 flex justify-between pointer-events-none px-2">
                      {[0, 0.25, 0.5, 0.75, 1].map((mark) => (
                        <div key={mark} className="h-full border-l border-slate-800/60" />
                      ))}
                    </div>

                    {/* Shared Playhead across all 3 layers */}
                    <div
                      style={{ left: `${Math.min(100, (currentTime / Math.max(0.1, duration)) * 100)}%` }}
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-20 pointer-events-none"
                    >
                      <div className="w-3 h-3 -ml-[5px] bg-amber-400 rotate-45 -mt-1.5" />
                    </div>

                    {/* Render Each Layer Lane */}
                    {FOLEY_LAYERS.map((layer) => {
                      const laneCues = sortedCues.filter((c) => c.layer === layer.id);
                      return (
                        <div key={layer.id} className="relative h-14">
                          {laneCues.map((cue) => {
                            const safeDuration = Math.max(0.1, duration);
                            const leftPct = Math.min(99.2, Math.max(0, (cue.time / safeDuration) * 100));
                            const cueDur =
                              cue.duration ||
                              sounds.find((s) => s.id === cue.soundId)?.durationHint ||
                              0.8;
                            const widthPct = Math.max(
                              1.8,
                              Math.min(100 - leftPct, (cueDur / safeDuration) * 100)
                            );
                            const isDragging = draggingCueUid === cue.uid;
                            return (
                              <button
                                key={cue.uid}
                                type="button"
                                title={`${cue.label} (${layer.label}) · ${formatTimecode(cue.time)} (${cueDur.toFixed(1)}s) — Drag to adjust timing or layer, click to preview`}
                                aria-label={`${cue.label} in ${layer.label} layer at ${formatTimecode(cue.time)}, duration ${cueDur.toFixed(1)} seconds. Use Left or Right arrow keys to adjust timing, or Delete to remove.`}
                                onPointerDown={(e) => {
                                  e.stopPropagation();
                                  const track = timelineTrackRef.current;
                                  if (!track) return;
                                  const startX = e.clientX;
                                  const startY = e.clientY;
                                  const startRect = track.getBoundingClientRect();
                                  const startRatio = Math.min(
                                    1,
                                    Math.max(0, (e.clientX - startRect.left) / startRect.width)
                                  );
                                  const grabOffsetSec = startRatio * durationRef.current - cue.time;
                                  let hasMoved = false;

                                  const onMove = (ev: PointerEvent) => {
                                    if (
                                      !hasMoved &&
                                      Math.abs(ev.clientX - startX) < 4 &&
                                      Math.abs(ev.clientY - startY) < 4
                                    ) {
                                      return;
                                    }
                                    if (!hasMoved) {
                                      hasMoved = true;
                                      setDraggingCueUid(cue.uid);
                                    }
                                    const rect = track.getBoundingClientRect();
                                    const ratio = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
                                    const pointerTime = ratio * durationRef.current;
                                    const maxStart = Math.max(0, durationRef.current - 0.1);
                                    const newTime = Number(
                                      Math.min(maxStart, Math.max(0, pointerTime - grabOffsetSec)).toFixed(2)
                                    );

                                    // Determine target layer from vertical pointer offset inside 3-lane track
                                    const relY = Math.min(rect.height - 1, Math.max(0, ev.clientY - rect.top));
                                    const laneIdx = Math.min(
                                      FOLEY_LAYERS.length - 1,
                                      Math.floor((relY / rect.height) * FOLEY_LAYERS.length)
                                    );
                                    const targetLayer: FoleyLayer = FOLEY_LAYERS[laneIdx].id;

                                    setCues((prev) =>
                                      prev.map((item) =>
                                        item.uid === cue.uid
                                          ? { ...item, time: newTime, layer: targetLayer }
                                          : item
                                      )
                                    );
                                  };

                                  const onUp = () => {
                                    window.removeEventListener('pointermove', onMove);
                                    window.removeEventListener('pointerup', onUp);
                                    window.removeEventListener('pointercancel', onUp);
                                    setDraggingCueUid(null);
                                    if (!hasMoved) {
                                      const latest = cuesRef.current.find((item) => item.uid === cue.uid);
                                      const targetTime = latest ? latest.time : cue.time;
                                      handleSeek(targetTime);
                                      const match = sounds.find((s) => s.id === cue.soundId);
                                      if (match) triggerFoleySound(match);
                                    }
                                  };

                                  window.addEventListener('pointermove', onMove);
                                  window.addEventListener('pointerup', onUp);
                                  window.addEventListener('pointercancel', onUp);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const step = e.shiftKey ? 0.5 : 0.1;
                                    const delta = e.key === 'ArrowRight' ? step : -step;
                                    const nextTime = Number(
                                      Math.min(duration, Math.max(0, cue.time + delta)).toFixed(2)
                                    );
                                    setCues((prev) =>
                                      prev.map((item) =>
                                        item.uid === cue.uid ? { ...item, time: nextTime } : item
                                      )
                                    );
                                  } else if (e.key === 'Delete' || e.key === 'Backspace') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setCues((prev) => prev.filter((item) => item.uid !== cue.uid));
                                  }
                                }}
                                style={{
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                  backgroundColor: cue.color,
                                }}
                                className={`absolute top-2 h-10 px-1.5 rounded-md text-[11px] font-bold text-slate-950 border-2 border-[#0B0F17] shadow-sm transition-transform flex items-center text-left touch-none ${
                                  isDragging
                                    ? 'z-30 cursor-grabbing ring-2 ring-amber-400'
                                    : 'z-10 cursor-grab hover:brightness-110'
                                }`}
                              >
                                {isDragging && (
                                  <span className="absolute -top-7 left-0 px-1.5 py-0.5 rounded bg-slate-950 border border-amber-400 text-amber-300 font-mono-tabular text-[11px] pointer-events-none shadow whitespace-nowrap">
                                    {formatTimecode(cue.time)}
                                  </span>
                                )}
                                <span className="truncate block w-full leading-none">
                                  {cue.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Cue List for Easy Removal & Inspection */}
              {sortedCues.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {sortedCues.map((cue) => (
                    <div
                      key={cue.uid}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#0B0F17] border border-slate-800 text-sm"
                    >
                      <button
                        type="button"
                        onClick={() => handleSeek(cue.time)}
                        className="flex items-center gap-2 text-left hover:text-amber-300 transition-colors min-w-0"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: cue.color }}
                          aria-hidden="true"
                        />
                        <span className="font-medium text-slate-200 truncate">{cue.label}</span>
                        <span className="text-xs text-slate-500 shrink-0">
                          · {cue.layer}
                        </span>
                        <span className="font-mono-tabular text-xs text-slate-400 shrink-0">
                          {formatTimecode(cue.time)}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCues((prev) => prev.filter((item) => item.uid !== cue.uid))}
                        aria-label={`Remove ${cue.label} cue at ${formatTimecode(cue.time)}`}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-400">
                  Timeline is empty. Play the scene and press any Foley sound button to stamp markers onto its layer.
                </p>
              )}
            </div>
          </section>

          {/* Right Zone: Foley Soundboard Deck */}
          <aside
            id="soundboard"
            aria-label="Foley Soundboard"
            className="lg:col-span-5 xl:col-span-4 bg-[#131A26] border border-slate-800 rounded-xl p-5"
          >
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-semibold text-slate-100 inline-flex items-center gap-2">
                  <AudioLines className="w-5 h-5 text-amber-400" />
                  Foley Soundboard
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {simplifiedMode
                    ? 'Scaffolded Mode: 6 core sounds across 3 layers'
                    : 'Full Studio: 12 synthesized Foley effects + custom uploads'}
                </p>
              </div>
            </div>

            {/* Stamp vs Audition Segmented Mode */}
            <div className="mt-4 flex items-center justify-between gap-2 p-1 rounded-lg bg-[#0B0F17] border border-slate-800">
              <button
                type="button"
                onClick={() => setStampOnClick(true)}
                aria-pressed={stampOnClick}
                className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  stampOnClick ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                Play &amp; Stamp at Playhead
              </button>
              <button
                type="button"
                onClick={() => setStampOnClick(false)}
                aria-pressed={!stampOnClick}
                className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  !stampOnClick ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                Audition Only
              </button>
            </div>

            {/* Foley Effect Buttons grouped by Layer */}
            <div className="space-y-5 mt-4 max-h-[580px] overflow-y-auto pr-1">
              {FOLEY_LAYERS.map((layer) => {
                const layerSounds = visibleSounds.filter((s) => s.layer === layer.id);
                if (layerSounds.length === 0) return null;
                return (
                  <div key={layer.id}>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-slate-200 flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-sm shrink-0"
                          style={{ backgroundColor: layer.accentColor }}
                          aria-hidden="true"
                        />
                        {layer.label}
                      </span>
                      <span className="text-slate-400">{layer.subtitle}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2.5">
                      {layerSounds.map((sound) => (
                        <button
                          key={sound.id}
                          type="button"
                          onClick={() => handleSoundButtonClick(sound)}
                          aria-label={`${sound.label} (${layer.label} layer): ${sound.description}. Shortcut key ${sound.shortcut}`}
                          className="group min-h-[78px] p-3 rounded-xl bg-[#0B0F17] hover:bg-[#192234] border border-slate-800 hover:border-slate-600 text-left flex flex-col justify-between transition-colors"
                        >
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="text-[11px] font-medium text-slate-400">
                              {layer.label}
                            </span>
                            <span
                              className="text-[11px] font-mono-tabular font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-200"
                              title={`Keyboard shortcut ${sound.shortcut}`}
                            >
                              {sound.shortcut}
                            </span>
                          </div>

                          <div className="mt-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-sm shrink-0"
                                style={{ backgroundColor: sound.color }}
                                aria-hidden="true"
                              />
                              <span className="text-sm font-semibold text-slate-100 group-hover:text-amber-300 transition-colors">
                                {sound.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                              {sound.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Extension Option: Upload Custom Foley Audio Files */}
            {!simplifiedMode && (
              <div className="mt-5 pt-4 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-300 mb-2">
                  Extension · Record &amp; Import Your Own Foley
                </div>
                <label
                  htmlFor="custom-foley-audio"
                  className="min-h-[48px] w-full px-4 py-2.5 rounded-lg border border-dashed border-slate-600 hover:border-amber-400 bg-[#0B0F17] hover:bg-[#151D2C] text-sm font-semibold text-slate-200 inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  Upload Custom Audio (.mp3 / .wav)
                  <input
                    id="custom-foley-audio"
                    type="file"
                    accept="audio/*"
                    onChange={handleCustomAudioUpload}
                    className="sr-only"
                  />
                </label>
                {customUploadNote && (
                  <p className="text-xs text-amber-300 mt-2" role="status">
                    {customUploadNote}
                  </p>
                )}
              </div>
            )}
          </aside>
        </div>

        {/* Guided Reflection Prompts (DOK 2-3) */}
        <ReflectionSection
          answers={answers}
          onChangeAnswer={(id, val) => setAnswers((prev) => ({ ...prev, [id]: val }))}
          onResetAnswers={() => setAnswers({})}
          cues={cues}
        />
      </main>

      <EmbedExportModal isOpen={isEmbedOpen} onClose={() => setIsEmbedOpen(false)} />
    </div>
  );
}
