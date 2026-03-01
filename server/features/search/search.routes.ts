import type { Express } from "express";
import { searchYouTubeVideos, getVideoDetails, extractVideoId } from "./youtube.service";
import { searchLyrics, searchLRCLibDatabase } from "./lrclib.service";

export function registerSearchRoutes(app: Express) {
  // YouTube search route
  app.get("/api/youtube/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      const results = await searchYouTubeVideos(query, 20);
      res.json(results);
    } catch (error) {
      console.error("YouTube search error:", error);
      res.status(500).json({ error: "Failed to search YouTube" });
    }
  });

  // Get video details from URL
  app.post("/api/youtube/video-details", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const videoId = extractVideoId(url);
      if (!videoId) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
      }

      const details = await getVideoDetails(videoId);
      if (!details) {
        return res.status(404).json({ error: "Video not found" });
      }

      res.json(details);
    } catch (error) {
      console.error("Video details error:", error);
      res.status(500).json({ error: "Failed to get video details" });
    }
  });

  // Search LRCLIB database for songs with synced lyrics
  app.get("/api/lrclib/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      const results = await searchLRCLibDatabase(query);
      res.json(results);
    } catch (error) {
      console.error("LRCLIB search error:", error);
      res.status(500).json({ error: "Failed to search LRCLIB" });
    }
  });

  // Get synced lyrics from LRCLIB
  app.get("/api/lyrics", async (req, res) => {
    try {
      const { track, artist, duration } = req.query;

      if (!track || !artist) {
        return res.status(400).json({ error: "Track and artist are required" });
      }

      const durationNum = duration ? parseInt(duration as string) : undefined;
      const lyrics = await searchLyrics(track as string, artist as string, durationNum);

      if (!lyrics) {
        return res.status(404).json({ error: "No synced lyrics found" });
      }

      res.json(lyrics);
    } catch (error) {
      console.error("Lyrics search error:", error);
      res.status(500).json({ error: "Failed to search lyrics" });
    }
  });
}
