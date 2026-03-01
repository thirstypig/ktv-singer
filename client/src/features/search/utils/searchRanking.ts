import type { LRCLibSearchResult } from '../types/search.types';

interface RankedResult extends LRCLibSearchResult {
  searchScore: number;
}

export function rankSearchResults(results: LRCLibSearchResult[], searchQuery: string): RankedResult[] {
  const queryLower = searchQuery.toLowerCase().trim();

  return results.map(result => {
    let score = 0;

    const fullArtist = result.artistName.toLowerCase().trim();
    const trackName = result.trackName.toLowerCase().trim();
    const albumName = result.albumName?.toLowerCase().trim() || '';

    // Get primary artist by taking everything before "feat.", ",", "&", "featuring", etc.
    const primaryArtist = result.artistName
      .split(/\s*(?:feat\.?|ft\.?|featuring|,|&)\s*/i)[0]
      .toLowerCase()
      .trim();

    // Check if query matches the PRIMARY artist (starts with query or exact match)
    const isPrimaryArtist =
      primaryArtist === queryLower ||
      primaryArtist.startsWith(queryLower) ||
      fullArtist.startsWith(queryLower);

    // Check if artist name contains "feat." or similar (indicating featured artist)
    const isFeatured = /(?:feat\.?|ft\.?|featuring)/i.test(result.artistName);

    // Priority 1: Primary artist exact match or starts with query
    if (isPrimaryArtist) {
      score += 1000;
      if (primaryArtist === queryLower) {
        score += 500; // Exact match bonus
      }
    }

    // Priority 2: Track name matches search query
    if (trackName.includes(queryLower) || queryLower.includes(trackName)) {
      score += 800;
      if (trackName === queryLower) {
        score += 300; // Exact track match bonus
      }
    }

    // Priority 3: Artist name contains query but not as primary
    if (!isPrimaryArtist && fullArtist.includes(queryLower)) {
      score += 400; // Lower priority for featured artists
    }

    // Priority 4: Album name matches
    if (albumName && (albumName === queryLower || albumName.includes(queryLower))) {
      score += 200;
    }

    // Heavy penalty for featured artist appearances when query matches a later artist
    if (isFeatured && !isPrimaryArtist && fullArtist.includes(queryLower)) {
      score -= 600; // Strong penalty for "feat. [query]"
    }

    return { ...result, searchScore: score };
  }).sort((a, b) => b.searchScore - a.searchScore);
}
