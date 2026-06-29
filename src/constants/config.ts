export const config = {
 
  game: {
    roomCodeLength: 6,
    maxRemovals: 5,
    timerOptions: [15, 30, 45, 60],
    defaultTimer: null,
  },
  decks: [
    { id: 'anime', name: 'Anime', slug: 'anime', isFree: true },
    { id: 'movies', name: 'Movies', slug: 'movies', isFree: true },
    { id: 'tv', name: 'TV Shows', slug: 'tv', isFree: true },
    { id: 'cartoons', name: 'Cartoons', slug: 'cartoons', isFree: true },
    { id: 'games', name: 'Games', slug: 'games', isFree: true },
    { id: 'villains', name: 'Villains', slug: 'villains', isFree: true },
    
  ],
  app: {
    name: 'Am I?',
    tagline: 'A long distance deduction game for two',
  },
} as const