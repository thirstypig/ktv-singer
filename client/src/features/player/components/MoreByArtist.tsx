import type { Song } from '@shared/schema';

interface MoreByArtistProps {
  currentSong: Song;
  allSongs: Song[];
  onPlaySong: (id: string) => void;
}

export default function MoreByArtist({ currentSong, allSongs, onPlaySong }: MoreByArtistProps) {
  const moreSongs = allSongs
    .filter(song =>
      song.artist.toLowerCase() === currentSong.artist.toLowerCase() &&
      song.id !== currentSong.id
    )
    .slice(0, 3);

  if (moreSongs.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold mb-4">More by {currentSong.artist}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {moreSongs.map(song => (
          <div
            key={song.id}
            onClick={() => onPlaySong(song.id)}
            className="flex items-center gap-3 p-3 bg-card border rounded-lg hover-elevate cursor-pointer transition-all"
            data-testid={`more-song-${song.id}`}
          >
            <img
              src={song.thumbnailUrl || ''}
              alt={song.title}
              className="w-16 h-16 rounded object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm line-clamp-1" data-testid={`text-more-title-${song.id}`}>
                {song.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {song.genre} &bull; {song.year}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
