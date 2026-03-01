import { useState } from 'react';
import Header from '@common/components/Header';
import { useToast } from '@common/hooks/use-toast';
import { queryClient } from '@common/lib/queryClient';
import type { Song } from '@shared/schema';

// Feature imports
import { SearchBar, SearchResults, useSearch, useVideoDetails } from '@features/search';
import type { LRCLibSearchResult, SearchResult } from '@features/search';
import { SongGrid, useFilters, useSongs } from '@features/library';
import { VideoPlayer, LyricsPanel, PlayerControls, MoreByArtist, usePlayer, useLyricsSync } from '@features/player';
import { ScoringModal, useRecording, usePerformance } from '@features/scoring';
import { PlaylistManager, usePlaylistQueue } from '@features/playlist';
import { useVocalSeparation } from '@features/vocal-separation';

export default function Home() {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const { toast } = useToast();

  // -- Vocal Separation --
  const { gaudioStatus, setGaudioStatus, gaudioSeparateMutation, checkGaudioStatus } = useVocalSeparation();

  // -- Lyrics Sync --
  const { lyricsOffset, setLyricsOffset, lyricsPosition, setLyricsPosition, saveLyricsOffset, adjustOffset, resetOffset } = useLyricsSync();

  // -- Search --
  const { lrclibResults, showSearchResults, setShowSearchResults, visibleResults, searchMutation, handleSearch: rawSearch, loadMore } = useSearch();

  const handleSearch = (query: string) => {
    setCurrentSong(null);
    rawSearch(query);
  };

  // -- Video Details --
  const { handleVideoLink } = useVideoDetails({
    onSongReady: (song) => setCurrentSong(song),
    onDismissSearch: () => setShowSearchResults(false),
  });

  // -- Player (declared before useSongs so playerHook.setCurrentTime is available) --
  const playerHook = usePlayer();

  // -- Songs & Library --
  const { songs, handlePlaySong } = useSongs({
    onSongReady: (song) => setCurrentSong(song),
    onDismissSearch: () => setShowSearchResults(false),
    setGaudioStatus,
    checkGaudioStatus,
    setLyricsOffset,
    setCurrentTime: (t) => playerHook.setCurrentTime(t),
  });

  // -- Filters --
  const { selectedGenders, selectedGenres, selectedDecades, setSelectedGenders, setSelectedGenres, setSelectedDecades, filteredSongs, clearAll } = useFilters(songs);

  // -- Playlist Queue --
  const playlistQueue = usePlaylistQueue({ onPlaySong: handlePlaySong });

  // Set up video ended handler (playlist auto-advance)
  playerHook.onVideoEndedRef.current = () => {
    if (playlistQueue.isPlaylistActive) {
      playlistQueue.advanceToNextSong();
    }
  };

  // -- Recording & Scoring --
  const recording = useRecording({ currentSong, currentTime: playerHook.currentTime });
  const { handleSaveScore } = usePerformance();

  // -- LRCLIB Result handler --
  const handlePlayLRCLibResult = async (result: LRCLibSearchResult) => {
    try {
      toast({
        title: 'Finding YouTube Video...',
        description: `Searching for ${result.trackName} by ${result.artistName}`,
      });

      const youtubeQuery = `${result.trackName} ${result.artistName}`;
      const youtubeResponse = await fetch(`/api/youtube/search?q=${encodeURIComponent(youtubeQuery)}`);
      if (!youtubeResponse.ok) throw new Error('YouTube search failed');

      const youtubeResults: SearchResult[] = await youtubeResponse.json();
      if (youtubeResults.length === 0) {
        toast({ title: 'No Video Found', description: 'Could not find a YouTube video for this song.', variant: 'destructive' });
        return;
      }

      const videoResult = youtubeResults[0];

      const existingResponse = await fetch(`/api/songs/video/${videoResult.videoId}`);
      if (existingResponse.ok) {
        const existingSong = await existingResponse.json();
        setCurrentSong(existingSong);
        setShowSearchResults(false);
        await fetch(`/api/songs/${existingSong.id}/play`, { method: 'POST' });
        queryClient.invalidateQueries({ queryKey: ['/api/songs'] });
        return;
      }

      const lyricsResponse = await fetch(
        `/api/lyrics?track=${encodeURIComponent(result.trackName)}&artist=${encodeURIComponent(result.artistName)}&duration=${result.duration}`
      );
      if (!lyricsResponse.ok) {
        toast({ title: 'Lyrics Error', description: 'Could not load lyrics for this song.', variant: 'destructive' });
        return;
      }

      const lyrics = await lyricsResponse.json();

      const saveResponse = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: videoResult.videoId,
          title: result.trackName,
          artist: result.artistName,
          thumbnailUrl: videoResult.thumbnail,
          genre: 'Unknown',
          gender: 'male',
          year: new Date().getFullYear(),
          lyrics,
        }),
      });
      if (!saveResponse.ok) throw new Error('Failed to save song');

      const savedSong = await saveResponse.json();
      setCurrentSong(savedSong);
      queryClient.invalidateQueries({ queryKey: ['/api/songs'] });
      await fetch(`/api/songs/${savedSong.id}/play`, { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['/api/songs'] });
      toast({ title: 'Song Ready!', description: 'Playing with synchronized lyrics.' });
      setShowSearchResults(false);
    } catch (error) {
      console.error('Failed to play LRCLIB result:', error);
      toast({ title: 'Error', description: 'Failed to load this song. Please try another.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onLibraryClick={() => { setShowSearchResults(false); setCurrentSong(null); }}
        onSettingsClick={() => console.log('Settings')}
      />

      <main className="pb-48 md:pb-64">
        <div className="container mx-auto px-4 py-8 space-y-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full">
              <SearchBar onSearch={handleSearch} onVideoLink={handleVideoLink} />
            </div>
            <PlaylistManager currentSong={currentSong} />
          </div>

          {currentSong ? (
            <div className={lyricsPosition === 'right' ? 'flex gap-6' : 'space-y-6'}>
              <div className={lyricsPosition === 'right' ? 'flex-1' : 'w-full'}>
                <VideoPlayer
                  videoId={currentSong.videoId}
                  onReady={playerHook.handlePlayerReady}
                  onStateChange={playerHook.handlePlayerStateChange}
                />
                <PlayerControls
                  currentSong={currentSong}
                  lyricsPosition={lyricsPosition}
                  onToggleLyricsPosition={() => setLyricsPosition(lyricsPosition === 'bottom' ? 'right' : 'bottom')}
                  gaudioStatus={gaudioStatus}
                  onKaraokeReady={() => toast({ title: 'Karaoke Track Available!', description: 'Play the instrumental version below.' })}
                  onCreateKaraoke={() => currentSong.id && gaudioSeparateMutation.mutate(currentSong.id)}
                  isKaraokeCreating={gaudioSeparateMutation.isPending}
                  isMicMonitoring={recording.isMicMonitoring}
                  onToggleMicMonitoring={recording.toggleMicMonitoring}
                  isRecording={recording.isRecording}
                  onStartRecording={recording.startRecording}
                  onStopRecording={recording.stopRecordingAndShowScore}
                  lyricsOffset={lyricsOffset}
                  onAdjustOffset={adjustOffset}
                  onResetOffset={resetOffset}
                  onSaveOffset={() => saveLyricsOffset(currentSong.id)}
                  isOffsetChanged={lyricsOffset !== (currentSong.lyricsOffset || 0)}
                />
                <MoreByArtist currentSong={currentSong} allSongs={songs} onPlaySong={handlePlaySong} />
              </div>
              {lyricsPosition === 'right' && (
                <LyricsPanel
                  lines={currentSong.lyrics || []}
                  currentTime={playerHook.currentTime + lyricsOffset}
                  isPlaying={playerHook.isPlaying}
                  position="right"
                />
              )}
            </div>
          ) : showSearchResults ? (
            <SearchResults
              results={lrclibResults}
              visibleResults={visibleResults}
              onPlayResult={handlePlayLRCLibResult}
              onLoadMore={loadMore}
            />
          ) : (
            <SongGrid
              songs={songs}
              filteredSongs={filteredSongs}
              selectedGenders={selectedGenders}
              selectedGenres={selectedGenres}
              selectedDecades={selectedDecades}
              onGenderChange={setSelectedGenders}
              onGenreChange={setSelectedGenres}
              onDecadeChange={setSelectedDecades}
              onClearAll={clearAll}
              onPlaySong={handlePlaySong}
            />
          )}
        </div>
      </main>

      {currentSong && lyricsPosition === 'bottom' && (
        <LyricsPanel
          lines={currentSong.lyrics || []}
          currentTime={playerHook.currentTime + lyricsOffset}
          isPlaying={playerHook.isPlaying}
          position="bottom"
        />
      )}

      <ScoringModal
        open={recording.showScoring}
        onClose={() => recording.setShowScoring(false)}
        totalScore={recording.calculatedScores.totalScore}
        breakdown={{
          pitch: recording.calculatedScores.pitchScore,
          timing: recording.calculatedScores.timingScore,
          rhythm: recording.calculatedScores.rhythmScore,
        }}
        songTitle={currentSong?.title || 'Song'}
        onTryAgain={() => {
          recording.setShowScoring(false);
          recording.resetScores();
          if (playerHook.player) {
            playerHook.player.seekTo(0);
            playerHook.player.playVideo();
          }
        }}
        onNextSong={() => {
          handleSaveScore(currentSong?.id || '', recording.calculatedScores);
          recording.setShowScoring(false);
          setCurrentSong(null);
          recording.resetScores();
        }}
      />
    </div>
  );
}
