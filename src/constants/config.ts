export const config = {
  colors: {
    background: '#111111',
    surface: '#1C1C1E',
    border: '#2A2A2A',
    accent: '#7C3AED',
    accentMuted: 'rgba(124, 58, 237, 0.2)',
    textPrimary: '#F5F5F5',
    textSecondary: '#94A3B8',
    reveal: '#F59E0B',
  },
  game: {
    roomCodeLength: 6,
    maxRemovals: 5,
    timerOptions: [15, 30, 45, 60],
    defaultTimer: null,
  },
  decks: [
    { id: 'anime', name: 'Anime', slug: 'anime', isFree: true },
    { id: 'movies', name: 'Movies', slug: 'movies', isFree: true },
    { id: 'tv', name: 'TV', slug: 'tv', isFree: true },
    { id: 'cartoons', name: 'Cartoons', slug: 'cartoons', isFree: true },
  ],
  app: {
    name: 'Am I?',
    tagline: 'A long distance deduction game for two',
  },
} as const