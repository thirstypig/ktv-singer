import { VideoPlayer } from '@features/player';

export default function VideoPlayerExample() {
  return (
    <div className="p-8 bg-background">
      <VideoPlayer
        videoId="dQw4w9WgXcQ"
        onReady={(player: any) => console.log('Player ready:', player)}
        onStateChange={(event: any) => console.log('State changed:', event)}
      />
    </div>
  );
}
