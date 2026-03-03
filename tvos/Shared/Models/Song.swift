//
//  Song.swift
//  KTVSinger-Shared
//
//  Core song model shared across tvOS and iOS
//

import Foundation

/// Represents a karaoke song with video and lyrics
struct Song: Identifiable, Codable, Hashable, Sendable {
    let id: UUID
    let title: String
    let artist: String
    let videoId: String // YouTube video ID
    let duration: TimeInterval
    let thumbnailURL: URL?
    let lyrics: [LyricLine]
    let createdAt: Date
    let updatedAt: Date
    
    /// Optional metadata
    var genre: String?
    var year: Int?
    var language: String?
    var popularity: Int?
    
    init(
        id: UUID = UUID(),
        title: String,
        artist: String,
        videoId: String,
        duration: TimeInterval,
        thumbnailURL: URL? = nil,
        lyrics: [LyricLine] = [],
        genre: String? = nil,
        year: Int? = nil,
        language: String? = nil,
        popularity: Int? = nil,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.title = title
        self.artist = artist
        self.videoId = videoId
        self.duration = duration
        self.thumbnailURL = thumbnailURL
        self.lyrics = lyrics
        self.genre = genre
        self.year = year
        self.language = language
        self.popularity = popularity
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

/// Represents a single line of lyrics
struct LyricLine: Identifiable, Codable, Hashable, Sendable {
    let id: UUID
    let text: String
    let startTime: TimeInterval? // nil for unsynced lyrics
    let endTime: TimeInterval?
    let words: [LyricWord]?
    
    init(
        id: UUID = UUID(),
        text: String,
        startTime: TimeInterval? = nil,
        endTime: TimeInterval? = nil,
        words: [LyricWord]? = nil
    ) {
        self.id = id
        self.text = text
        self.startTime = startTime
        self.endTime = endTime
        self.words = words
    }
    
    /// Check if this line is active at the given time
    func isActive(at time: TimeInterval) -> Bool {
        guard let start = startTime else { return false }
        if let end = endTime {
            return time >= start && time < end
        }
        return time >= start
    }
}

/// Represents a single word in a lyric line (for word-level sync)
struct LyricWord: Identifiable, Codable, Hashable, Sendable {
    let id: UUID
    let text: String
    let startTime: TimeInterval
    let endTime: TimeInterval
    
    init(
        id: UUID = UUID(),
        text: String,
        startTime: TimeInterval,
        endTime: TimeInterval
    ) {
        self.id = id
        self.text = text
        self.startTime = startTime
        self.endTime = endTime
    }
    
    /// Check if this word is active at the given time
    func isActive(at time: TimeInterval) -> Bool {
        return time >= startTime && time < endTime
    }
}

// MARK: - Supabase Mapping

extension Song {
    /// Database table name
    static let tableName = "songs"
    
    /// Convert from Supabase row
    init?(from row: [String: Any]) {
        guard
            let idString = row["id"] as? String,
            let id = UUID(uuidString: idString),
            let title = row["title"] as? String,
            let artist = row["artist"] as? String,
            let videoId = row["video_id"] as? String,
            let duration = row["duration"] as? TimeInterval
        else {
            return nil
        }
        
        self.id = id
        self.title = title
        self.artist = artist
        self.videoId = videoId
        self.duration = duration
        
        if let urlString = row["thumbnail_url"] as? String {
            self.thumbnailURL = URL(string: urlString)
        } else {
            self.thumbnailURL = nil
        }
        
        // Parse lyrics JSON
        if let lyricsData = row["lyrics"] as? Data,
           let lyrics = try? JSONDecoder().decode([LyricLine].self, from: lyricsData) {
            self.lyrics = lyrics
        } else {
            self.lyrics = []
        }
        
        self.genre = row["genre"] as? String
        self.year = row["year"] as? Int
        self.language = row["language"] as? String
        self.popularity = row["popularity"] as? Int
        
        if let createdAtString = row["created_at"] as? String,
           let createdAt = ISO8601DateFormatter().date(from: createdAtString) {
            self.createdAt = createdAt
        } else {
            self.createdAt = Date()
        }
        
        if let updatedAtString = row["updated_at"] as? String,
           let updatedAt = ISO8601DateFormatter().date(from: updatedAtString) {
            self.updatedAt = updatedAt
        } else {
            self.updatedAt = Date()
        }
    }
    
    /// Convert to Supabase row for insert/update
    func toSupabaseRow() -> [String: Any] {
        var row: [String: Any] = [
            "id": id.uuidString,
            "title": title,
            "artist": artist,
            "video_id": videoId,
            "duration": duration
        ]
        
        if let thumbnailURL = thumbnailURL {
            row["thumbnail_url"] = thumbnailURL.absoluteString
        }
        
        if let lyricsData = try? JSONEncoder().encode(lyrics) {
            row["lyrics"] = lyricsData
        }
        
        row["genre"] = genre
        row["year"] = year
        row["language"] = language
        row["popularity"] = popularity
        row["created_at"] = ISO8601DateFormatter().string(from: createdAt)
        row["updated_at"] = ISO8601DateFormatter().string(from: updatedAt)
        
        return row
    }
}

// MARK: - Preview Helpers

#if DEBUG
extension Song {
    static let preview = Song(
        title: "Bohemian Rhapsody",
        artist: "Queen",
        videoId: "fJ9rUzIMcZQ",
        duration: 354,
        thumbnailURL: URL(string: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg"),
        lyrics: [
            LyricLine(text: "Is this the real life?", startTime: 0.5, endTime: 3.0),
            LyricLine(text: "Is this just fantasy?", startTime: 3.0, endTime: 5.5),
            LyricLine(text: "Caught in a landslide", startTime: 5.5, endTime: 8.0),
            LyricLine(text: "No escape from reality", startTime: 8.0, endTime: 11.0),
        ],
        genre: "Rock",
        year: 1975,
        language: "en"
    )
    
    static let previewList = [
        Song(
            title: "Bohemian Rhapsody",
            artist: "Queen",
            videoId: "fJ9rUzIMcZQ",
            duration: 354,
            genre: "Rock"
        ),
        Song(
            title: "Don't Stop Believin'",
            artist: "Journey",
            videoId: "1k8craCGpgs",
            duration: 251,
            genre: "Rock"
        ),
        Song(
            title: "Sweet Child O' Mine",
            artist: "Guns N' Roses",
            videoId: "1w7OgIMMRc4",
            duration: 356,
            genre: "Rock"
        ),
    ]
}
#endif
