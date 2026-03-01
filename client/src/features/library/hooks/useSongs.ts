import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@common/lib/queryClient';
import { useToast } from '@common/hooks/use-toast';
import type { Song } from '@shared/schema';

interface UseSongsOptions {
  onSongReady: (song: Song) => void;
  onDismissSearch: () => void;
  setGaudioStatus: (status: 'idle' | 'processing' | 'completed') => void;
  checkGaudioStatus: (songId: string) => void;
  setLyricsOffset: (offset: number) => void;
  setCurrentTime: (time: number) => void;
}

export function useSongs({
  onSongReady,
  onDismissSearch,
  setGaudioStatus,
  checkGaudioStatus,
  setLyricsOffset,
  setCurrentTime,
}: UseSongsOptions) {
  const { toast } = useToast();

  const { data: songs = [] } = useQuery<Song[]>({
    queryKey: ['/api/songs'],
  });

  const handlePlaySong = async (id: string) => {
    const song = songs.find((s) => s.id === id);
    if (song) {
      // Load saved lyrics offset for this song
      setLyricsOffset(song.lyricsOffset || 0);

      // Increment play count
      await fetch(`/api/songs/${id}/play`, { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['/api/songs'] });

      // Set Gaudio status based on song state
      if (song.instrumentalUrl) {
        setGaudioStatus('completed');
      } else if (song.gaudioJobId) {
        setGaudioStatus('processing');
        // Check status
        checkGaudioStatus(song.id);
      } else {
        setGaudioStatus('idle');
      }

      // Try to fetch fresh synced lyrics from LRCLIB if not already present
      let updatedSong = { ...song };
      if (!song.lyrics || song.lyrics.length === 0) {
        try {
          const lyricsResponse = await fetch(
            `/api/lyrics?track=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist)}`
          );
          if (lyricsResponse.ok) {
            const lyrics = await lyricsResponse.json();
            updatedSong.lyrics = lyrics;

            // Save the lyrics back to storage
            try {
              await fetch(`/api/songs/${song.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lyrics }),
              });
              console.log('Lyrics saved to storage for:', song.title);
            } catch (saveError) {
              console.error('Failed to save lyrics to storage:', saveError);
            }

            toast({
              title: 'Synced Lyrics Loaded!',
              description: 'Using latest synchronized lyrics from LRCLIB.',
            });
          }
        } catch (error) {
          console.log('Using existing lyrics, LRCLIB fetch failed');
        }
      }

      onSongReady(updatedSong);
      setCurrentTime(0);
      onDismissSearch();
    }
  };

  return {
    songs,
    handlePlaySong,
  };
}
