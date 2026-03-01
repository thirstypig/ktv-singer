import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@common/lib/queryClient';
import { useToast } from '@common/hooks/use-toast';
import type { GaudioStatus } from '../types/vocal-separation.types';

export function useVocalSeparation() {
  const [gaudioStatus, setGaudioStatus] = useState<GaudioStatus>('idle');
  const { toast } = useToast();

  const checkGaudioStatus = useCallback(async (songId: string) => {
    try {
      const response = await fetch(`/api/songs/${songId}/gaudio-status`);
      const data = await response.json();

      if (data.status === 'completed') {
        setGaudioStatus('completed');
        queryClient.invalidateQueries({ queryKey: ['/api/songs'] });
        toast({
          title: 'Karaoke Track Ready!',
          description: 'Your instrumental track is ready to play!',
        });
      } else if (data.status === 'processing') {
        // Poll again in 10 seconds
        setTimeout(() => checkGaudioStatus(songId), 10000);
      }
    } catch (error) {
      console.error('Failed to check Gaudio status:', error);
    }
  }, [toast]);

  const gaudioSeparateMutation = useMutation({
    mutationFn: async (songId: string) => {
      const response = await fetch(`/api/songs/${songId}/gaudio-separate`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start vocal separation');
      }
      return data;
    },
    onSuccess: (data, songId) => {
      if (data.status === 'processing') {
        setGaudioStatus('processing');
        toast({
          title: 'Processing Started!',
          description: 'Creating karaoke track with AI vocal removal...',
        });
        // Poll for status
        checkGaudioStatus(songId);
      } else if (data.status === 'completed') {
        setGaudioStatus('completed');
        toast({
          title: 'Karaoke Track Ready!',
          description: 'Instrumental track is ready to play.',
        });
      }
    },
    onError: (error: Error) => {
      setGaudioStatus('idle');
      toast({
        title: 'Feature Not Available',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    gaudioStatus,
    setGaudioStatus,
    gaudioSeparateMutation,
    checkGaudioStatus,
  };
}
