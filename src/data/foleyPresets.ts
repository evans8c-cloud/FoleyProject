export type FoleyLayer = 'footsteps' | 'movement' | 'specifics';

export interface FoleyLayerDef {
  id: FoleyLayer;
  label: string;
  subtitle: string;
  accentColor: string;
}

export const FOLEY_LAYERS: FoleyLayerDef[] = [
  {
    id: 'footsteps',
    label: 'Footsteps',
    subtitle: 'Surface steps & stride rhythm',
    accentColor: '#F59E0B',
  },
  {
    id: 'movement',
    label: 'Movement',
    subtitle: 'Cloth, turns, doors & air swishes',
    accentColor: '#10B981',
  },
  {
    id: 'specifics',
    label: 'Specifics',
    subtitle: 'Props, impacts, explosions & ambience',
    accentColor: '#38BDF8',
  },
];

export interface FoleySoundDef {
  id: string;
  label: string;
  layer: FoleyLayer;
  description: string;
  color: string;
  badgeText: string;
  shortcut: string;
  simplified: boolean;
  isCustom?: boolean;
  durationHint: number;
}

export interface TimelineCue {
  uid: string;
  soundId: string;
  label: string;
  layer: FoleyLayer;
  time: number;
  duration: number;
  color: string;
}

export interface ReflectionPrompt {
  id: string;
  number: string;
  title: string;
  question: string;
  dokLevel: string;
  placeholder: string;
}

export const FOLEY_SOUNDS: FoleySoundDef[] = [
  // Layer 1: Footsteps
  {
    id: 'footsteps',
    label: 'Stone Footsteps',
    layer: 'footsteps',
    description: 'Measured heel-toe steps on wet stone pavement',
    color: '#F59E0B',
    badgeText: 'STEP',
    shortcut: '1',
    simplified: true,
    durationHint: 1.1,
  },
  {
    id: 'gravelSteps',
    label: 'Gravel Steps',
    layer: 'footsteps',
    description: 'Crunching boots across loose gravel path',
    color: '#FBBF24',
    badgeText: 'GRAVEL',
    shortcut: '2',
    simplified: false,
    durationHint: 0.95,
  },
  {
    id: 'waterSplash',
    label: 'Puddle Splash',
    layer: 'footsteps',
    description: 'Boot stepping sharply into a deep street puddle',
    color: '#06B6D4',
    badgeText: 'SPLASH',
    shortcut: '3',
    simplified: true,
    durationHint: 0.85,
  },

  // Layer 2: Movement
  {
    id: 'clothRustle',
    label: 'Cloth Rustle',
    layer: 'movement',
    description: 'Heavy coat sleeve friction as character turns',
    color: '#10B981',
    badgeText: 'CLOTH',
    shortcut: '4',
    simplified: true,
    durationHint: 0.68,
  },
  {
    id: 'whoosh',
    label: 'Quick Whoosh',
    layer: 'movement',
    description: 'Fast camera whip or sudden arm movement swish',
    color: '#34D399',
    badgeText: 'WHOOSH',
    shortcut: '5',
    simplified: false,
    durationHint: 0.55,
  },
  {
    id: 'doorCreak',
    label: 'Door Creak',
    layer: 'movement',
    description: 'Slow, rusted iron hinge swinging open',
    color: '#0EA5E9',
    badgeText: 'DOOR',
    shortcut: '6',
    simplified: true,
    durationHint: 1.45,
  },

  // Layer 3: Specifics
  {
    id: 'explosion',
    label: 'Explosion',
    layer: 'specifics',
    description: 'Deep sub-bass shockwave, fireball roar, and debris',
    color: '#F97316',
    badgeText: 'BOOM',
    shortcut: '7',
    simplified: true,
    durationHint: 2.1,
  },
  {
    id: 'punchImpact',
    label: 'Heavy Impact',
    layer: 'specifics',
    description: 'Low-end body thud and sharp leather contact',
    color: '#EF4444',
    badgeText: 'HIT',
    shortcut: '8',
    simplified: true,
    durationHint: 0.35,
  },
  {
    id: 'glassBreak',
    label: 'Glass Breaking',
    layer: 'specifics',
    description: 'High-frequency shatter with cascading shards',
    color: '#EC4899',
    badgeText: 'GLASS',
    shortcut: '9',
    simplified: false,
    durationHint: 0.75,
  },
  {
    id: 'paperCrinkle',
    label: 'Paper Crinkle',
    layer: 'specifics',
    description: 'Crisp folded note or envelope handled close to mic',
    color: '#A855F7',
    badgeText: 'PAPER',
    shortcut: '0',
    simplified: false,
    durationHint: 0.65,
  },
  {
    id: 'thunder',
    label: 'Thunder Clap',
    layer: 'specifics',
    description: 'Distant lightning crack rolling across the sky',
    color: '#818CF8',
    badgeText: 'THUNDER',
    shortcut: '-',
    simplified: false,
    durationHint: 2.6,
  },
  {
    id: 'rain',
    label: 'Rain Ambience',
    layer: 'specifics',
    description: 'Steady nocturnal rainfall across rooftop and alley',
    color: '#38BDF8',
    badgeText: 'RAIN',
    shortcut: '=',
    simplified: false,
    durationHint: 2.6,
  },
];

export const SAMPLE_VIDEO_OPTIONS = [
  {
    id: 'builtin-noir',
    label: 'Built-in Demo Scene: Rainy Alleyway Suspense (18s)',
    url: '',
    duration: 18,
  },
  {
    id: 'w3c-sintel',
    label: 'Sample Clip: Animated Action Sequence (MP4)',
    url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    duration: 52,
  },
  {
    id: 'w3c-bunny',
    label: 'Sample Clip: Nature & Forest Character (MP4)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 15,
  },
];

export const DEFAULT_DEMO_CUES: TimelineCue[] = [
  { uid: 'demo-1', soundId: 'rain', label: 'Rain Ambience', layer: 'specifics', time: 0.2, duration: 2.6, color: '#38BDF8' },
  { uid: 'demo-2', soundId: 'footsteps', label: 'Stone Footsteps', layer: 'footsteps', time: 1.6, duration: 1.1, color: '#F59E0B' },
  { uid: 'demo-3', soundId: 'waterSplash', label: 'Puddle Splash', layer: 'footsteps', time: 3.8, duration: 0.85, color: '#06B6D4' },
  { uid: 'demo-4', soundId: 'clothRustle', label: 'Cloth Rustle', layer: 'movement', time: 5.5, duration: 0.68, color: '#10B981' },
  { uid: 'demo-5', soundId: 'doorCreak', label: 'Door Creak', layer: 'movement', time: 7.6, duration: 1.45, color: '#0EA5E9' },
  { uid: 'demo-6', soundId: 'paperCrinkle', label: 'Paper Crinkle', layer: 'specifics', time: 10.9, duration: 0.65, color: '#A855F7' },
  { uid: 'demo-7', soundId: 'glassBreak', label: 'Glass Breaking', layer: 'specifics', time: 14.2, duration: 0.75, color: '#EC4899' },
];

export const REFLECTION_PROMPTS: ReflectionPrompt[] = [
  {
    id: 'q1',
    number: '01',
    title: 'Realism & Spatial Presence',
    question:
      'Which Foley sound made the biggest difference to the scene’s realism, and what felt missing when you switched to the silent Before version?',
    dokLevel: 'DOK 2 · Analyze',
    placeholder:
      'Identify the specific sound layer and explain how it anchored physical weight, distance, or environment...',
  },
  {
    id: 'q2',
    number: '02',
    title: 'Emotional Framing & Exaggeration',
    question:
      'How would the audience’s emotional tension change if one key sound (such as the footsteps or door creak) were exaggerated in volume or removed entirely?',
    dokLevel: 'DOK 3 · Strategic Thinking',
    placeholder:
      'Compare how silence creates detachment vs. how heightened Foley directs suspense, shock, or comedy...',
  },
  {
    id: 'q3',
    number: '03',
    title: 'The Creative Role of Foley Artists',
    question:
      'Why do film productions hire Foley artists to recreate everyday sounds in a studio instead of relying only on the microphone audio captured on set?',
    dokLevel: 'DOK 3 · Evaluate',
    placeholder:
      'Consider dialogue isolation, international dubbing mixes, and hyper-real sonic storytelling...',
  },
];
