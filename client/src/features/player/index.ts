export { default as VideoPlayer } from './components/VideoPlayer';
export { default as LyricsPanel } from './components/LyricsPanel';
export { default as PlayerControls } from './components/PlayerControls';
export { default as MoreByArtist } from './components/MoreByArtist';
export { usePlayer } from './hooks/usePlayer';
export { useLyricsSync } from './hooks/useLyricsSync';
export { estimateWordTiming, findActiveWord } from './utils/lyricsUtils';
export type { LyricLine, LyricWord } from './types/player.types';
