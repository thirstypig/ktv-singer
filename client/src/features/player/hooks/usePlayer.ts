import { useState, useEffect, useRef } from 'react';

export function usePlayer() {
  const [player, setPlayer] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const onVideoEndedRef = useRef<(() => void) | null>(null);

  const handlePlayerReady = (playerInstance: any) => {
    setPlayer(playerInstance);
    if (playerInstance.setVolume) {
      playerInstance.setVolume(volume);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (player && player.setVolume) {
      player.setVolume(newVolume);
    }
  };

  const handlePlayerStateChange = (event: any) => {
    // YouTube Player States:
    // -1 = unstarted, 0 = ended, 1 = playing, 2 = paused, 3 = buffering, 5 = video cued
    const playerState = event.data;

    // When video ends (state 0), notify parent
    if (playerState === 0) {
      onVideoEndedRef.current?.();
    }
  };

  useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      if (player && player.getCurrentTime) {
        setCurrentTime(player.getCurrentTime());
        const state = player.getPlayerState();
        setIsPlaying(state === 1);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [player]);

  return {
    player,
    currentTime,
    setCurrentTime,
    isPlaying,
    volume,
    onVideoEndedRef,
    handlePlayerReady,
    handleVolumeChange,
    handlePlayerStateChange,
  };
}
