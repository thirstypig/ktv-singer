import { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { ArrowLeft } from "lucide-react-native";
import { useLyricsSync, estimateWordTiming, findActiveWord } from "@features/player";
import { colors } from "@theme/colors";
import type { RootStackParamList } from "@navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "Player">;
type Route = RouteProp<RootStackParamList, "Player">;

// ─── YouTube Web Player ──────────────────────────────────────────────────────
// Uses the official YouTube IFrame Player API for reliable time tracking.

let ytApiReady = false;
let ytApiCallbacks: (() => void)[] = [];

function ensureYTApi(): Promise<void> {
  return new Promise((resolve) => {
    if (ytApiReady) return resolve();
    ytApiCallbacks.push(resolve);

    // Only inject the script once
    if (document.getElementById("yt-iframe-api")) return;
    const tag = document.createElement("script");
    tag.id = "yt-iframe-api";
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = () => {
      ytApiReady = true;
      ytApiCallbacks.forEach((cb) => cb());
      ytApiCallbacks = [];
    };
  });
}

function YouTubePlayer({
  videoId,
  onTimeUpdate,
  onStateChange,
}: {
  videoId: string;
  onTimeUpdate: (time: number) => void;
  onStateChange: (state: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let destroyed = false;

    const init = async () => {
      await ensureYTApi();
      if (destroyed || !containerRef.current) return;

      // Create a div for the player inside our container
      const el = document.createElement("div");
      el.id = "yt-player-" + videoId;
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(el);

      playerRef.current = new (window as any).YT.Player(el.id, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
          fs: 1,
        },
        events: {
          onReady: () => {
            onStateChange("ready");
          },
          onStateChange: (event: any) => {
            const stateMap: Record<number, string> = {
              [-1]: "unstarted",
              0: "ended",
              1: "playing",
              2: "paused",
              3: "buffering",
              5: "cued",
            };
            const state = stateMap[event.data] || "unknown";
            onStateChange(state);

            // Poll time while playing
            if (event.data === 1) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              intervalRef.current = setInterval(() => {
                if (playerRef.current?.getCurrentTime) {
                  onTimeUpdate(playerRef.current.getCurrentTime());
                }
              }, 150);
            } else {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }
          },
        },
      });
    };

    init();

    return () => {
      destroyed = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
      }
    };
  }, [videoId]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", background: "#000" }}
    />
  );
}

// ─── Player Screen ──────────────────────────────────────────────────────────

export default function PlayerScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const song = route.params.song;

  const [currentTime, setCurrentTime] = useState(0);
  const [playerState, setPlayerState] = useState("unstarted");
  const { lyricsOffset, adjustOffset } = useLyricsSync();

  const lyricsScrollRef = useRef<ScrollView>(null);
  const [lineLayouts, setLineLayouts] = useState<Record<number, number>>({});

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleStateChange = useCallback((state: string) => {
    setPlayerState(state);
  }, []);

  // Compute active line
  const words = song.lyrics ? estimateWordTiming(song.lyrics) : [];
  const activeWordIdx = findActiveWord(
    words,
    currentTime + lyricsOffset,
  );
  const activeLineIdx =
    activeWordIdx >= 0 ? words[activeWordIdx]?.lineIndex ?? -1 : -1;

  // Auto-scroll lyrics to keep the active line centered
  const prevActiveLineRef = useRef(-1);
  useEffect(() => {
    if (activeLineIdx >= 0 && activeLineIdx !== prevActiveLineRef.current) {
      prevActiveLineRef.current = activeLineIdx;
      const y = lineLayouts[activeLineIdx];
      if (y != null) {
        lyricsScrollRef.current?.scrollTo({
          y: Math.max(0, y - 120),
          animated: true,
        });
      }
    }
  }, [activeLineIdx, lineLayouts]);

  return (
    <View className="flex-1 bg-background">
      {/* Top bar */}
      <View className="flex-row items-center px-tv-4 py-tv-2">
        <Pressable
          className="mr-tv-2 p-tv-1"
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={28} color={colors.foreground} />
        </Pressable>
        <View className="flex-1">
          <Text
            className="text-tv-base font-bold text-foreground"
            numberOfLines={1}
          >
            {song.title}
          </Text>
          <Text className="text-tv-xs text-muted-foreground" numberOfLines={1}>
            {song.artist}
          </Text>
        </View>

        {/* Lyrics offset controls */}
        <Pressable
          className="mx-tv-1 p-tv-1 rounded-tv-md bg-muted"
          onPress={() => adjustOffset(-0.5)}
        >
          <Text className="text-tv-xs text-foreground">-0.5s</Text>
        </Pressable>
        <View className="mx-tv-1 px-tv-1">
          <Text className="text-tv-xs text-muted-foreground">
            {lyricsOffset === 0
              ? "sync"
              : `${lyricsOffset > 0 ? "+" : ""}${lyricsOffset.toFixed(1)}s`}
          </Text>
        </View>
        <Pressable
          className="mx-tv-1 p-tv-1 rounded-tv-md bg-muted"
          onPress={() => adjustOffset(0.5)}
        >
          <Text className="text-tv-xs text-foreground">+0.5s</Text>
        </Pressable>
      </View>

      {/* Main content: video + lyrics side by side */}
      <View className="flex-1 flex-row">
        {/* YouTube video */}
        <View style={{ flex: 1.2 }} className="bg-black">
          {Platform.OS === "web" ? (
            <YouTubePlayer
              videoId={song.videoId}
              onTimeUpdate={handleTimeUpdate}
              onStateChange={handleStateChange}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-tv-base text-muted-foreground">
                Video: {song.videoId}
              </Text>
              <Text className="text-tv-xs text-muted-foreground mt-tv-1">
                (YouTube player requires native build)
              </Text>
            </View>
          )}
        </View>

        {/* Lyrics panel */}
        <ScrollView
          ref={lyricsScrollRef}
          className="flex-1 px-tv-4 py-tv-2"
          contentContainerStyle={{ paddingBottom: 200, paddingTop: 100 }}
        >
          {song.lyrics && song.lyrics.length > 0 ? (
            song.lyrics.map((line, idx) => (
              <Text
                key={idx}
                onLayout={(e) => {
                  setLineLayouts((prev) => ({
                    ...prev,
                    [idx]: e.nativeEvent.layout.y,
                  }));
                }}
                style={{
                  fontSize: idx === activeLineIdx ? 28 : 22,
                  lineHeight: idx === activeLineIdx ? 40 : 32,
                  fontWeight: idx === activeLineIdx ? "700" : "400",
                  color:
                    idx === activeLineIdx
                      ? colors.primary
                      : idx < activeLineIdx
                        ? colors.mutedForeground
                        : "#666666",
                  paddingVertical: 6,
                }}
              >
                {line.text || "♪"}
              </Text>
            ))
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-tv-base text-muted-foreground">
                No lyrics available for this song.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
