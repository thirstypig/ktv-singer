import { Button } from '@common/components/ui/button';
import type { LRCLibSearchResult } from '../types/search.types';

interface SearchResultsProps {
  results: LRCLibSearchResult[];
  visibleResults: number;
  onPlayResult: (result: LRCLibSearchResult) => void;
  onLoadMore: () => void;
}

export default function SearchResults({
  results,
  visibleResults,
  onPlayResult,
  onLoadMore,
}: SearchResultsProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Songs with Synced Lyrics</h2>
      <p className="text-muted-foreground mb-4">
        Found {results.length} {results.length === 1 ? 'song' : 'songs'} with verified synchronized lyrics. Click to play with YouTube.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.slice(0, visibleResults).map((result, index) => (
          <div
            key={result.id}
            onClick={() => onPlayResult(result)}
            className="relative p-6 bg-card border rounded-lg hover-elevate cursor-pointer transition-all"
            data-testid={`lrclib-result-${result.id}`}
          >
            <h3 className="text-xl font-bold mb-1 line-clamp-2" data-testid={`text-track-${result.id}`}>
              {result.trackName}
            </h3>
            <p className="text-base text-muted-foreground mb-2" data-testid={`text-artist-${result.id}`}>
              {result.artistName}
            </p>
            {result.albumName && (
              <p className="text-xs text-muted-foreground/50 mb-2" data-testid={`text-album-${result.id}`}>
                Album: {result.albumName}
              </p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded" data-testid={`badge-duration-${result.id}`}>
                {Math.floor(result.duration / 60)}:{String(Math.floor(result.duration % 60)).padStart(2, '0')}
              </span>
              {index < 3 && (
                <span className="text-xs px-2 py-1 bg-accent/20 text-accent-foreground rounded" data-testid={`badge-top-${result.id}`}>
                  Top Match
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {visibleResults < results.length && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={onLoadMore}
            data-testid="button-load-more"
          >
            Load More ({results.length - visibleResults} more {results.length - visibleResults === 1 ? 'song' : 'songs'})
          </Button>
        </div>
      )}
    </div>
  );
}
