import { Button } from '@common/components/ui/button';
import { Mic, MicOff, PanelBottom, PanelRight, Wand2, Loader2, Minus, Plus, RotateCcw, Save } from 'lucide-react';
import type { Song } from '@shared/schema';

interface PlayerControlsProps {
  currentSong: Song;
  lyricsPosition: 'bottom' | 'right';
  onToggleLyricsPosition: () => void;
  gaudioStatus: 'idle' | 'processing' | 'completed';
  onKaraokeReady: () => void;
  onCreateKaraoke: () => void;
  isKaraokeCreating: boolean;
  isMicMonitoring: boolean;
  onToggleMicMonitoring: () => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  lyricsOffset: number;
  onAdjustOffset: (delta: number) => void;
  onResetOffset: () => void;
  onSaveOffset: () => void;
  isOffsetChanged: boolean;
}

export default function PlayerControls({
  currentSong,
  lyricsPosition,
  onToggleLyricsPosition,
  gaudioStatus,
  onKaraokeReady,
  onCreateKaraoke,
  isKaraokeCreating,
  isMicMonitoring,
  onToggleMicMonitoring,
  isRecording,
  onStartRecording,
  onStopRecording,
  lyricsOffset,
  onAdjustOffset,
  onResetOffset,
  onSaveOffset,
  isOffsetChanged,
}: PlayerControlsProps) {
  return (
    <div className="space-y-4 mt-6">
      <div className="flex justify-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="default"
          onClick={onToggleLyricsPosition}
          data-testid="button-toggle-lyrics-position"
          className="flex-shrink-0"
        >
          {lyricsPosition === 'bottom' ? (
            <>
              <PanelRight className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Lyrics Right</span>
            </>
          ) : (
            <>
              <PanelBottom className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Lyrics Bottom</span>
            </>
          )}
        </Button>
        {currentSong.id && (
          <>
            {currentSong.instrumentalUrl ? (
              <Button
                variant="default"
                size="default"
                onClick={onKaraokeReady}
                data-testid="button-karaoke-ready"
                className="flex-shrink-0"
              >
                <Wand2 className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Karaoke Ready</span>
              </Button>
            ) : gaudioStatus === 'processing' ? (
              <Button
                variant="outline"
                size="default"
                disabled
                data-testid="button-karaoke-processing"
                className="flex-shrink-0"
              >
                <Loader2 className="w-4 h-4 md:mr-2 animate-spin" />
                <span className="hidden md:inline">Creating...</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="default"
                onClick={onCreateKaraoke}
                disabled={isKaraokeCreating}
                data-testid="button-create-karaoke"
                className="flex-shrink-0"
              >
                <Wand2 className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Karaoke</span>
              </Button>
            )}
          </>
        )}
        <Button
          variant={isMicMonitoring ? "default" : "outline"}
          size="default"
          onClick={onToggleMicMonitoring}
          data-testid="button-toggle-mic-monitoring"
          className="flex-shrink-0"
        >
          {isMicMonitoring ? (
            <>
              <Mic className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Mic ON</span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Mic OFF</span>
            </>
          )}
        </Button>
        {currentSong.lyrics && currentSong.lyrics.length > 0 && (
          <>
            {!isRecording ? (
              <Button
                variant="default"
                size="lg"
                onClick={onStartRecording}
                data-testid="button-start-recording"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Vocal Analysis
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                onClick={onStopRecording}
                data-testid="button-show-score"
                className="animate-pulse"
              >
                <Mic className="w-5 h-5 mr-2" />
                End Performance & View Score
              </Button>
            )}
          </>
        )}
      </div>

      {currentSong.lyrics && currentSong.lyrics.length > 0 && (
        <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
          <span className="text-sm text-muted-foreground">Lyrics Timing:</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onAdjustOffset(-0.5)}
            data-testid="button-lyrics-earlier"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-sm font-mono w-20 text-center" data-testid="text-lyrics-offset">
            {lyricsOffset > 0 ? '+' : ''}{lyricsOffset.toFixed(1)}s
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onAdjustOffset(0.5)}
            data-testid="button-lyrics-later"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onResetOffset}
            data-testid="button-lyrics-reset"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="default"
            size="default"
            onClick={onSaveOffset}
            disabled={!isOffsetChanged}
            data-testid="button-save-timing"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Timing
          </Button>
        </div>
      )}
    </div>
  );
}
