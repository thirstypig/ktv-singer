//
//  YouTubePlayerService.swift
//  KTVSinger-tvOS
//
//  Service for playing YouTube videos using AVPlayer
//  Note: Direct YouTube playback requires extracting the stream URL
//

import Foundation
import AVFoundation
import Combine

/// Service that manages YouTube video playback
@MainActor
final class YouTubePlayerService: ObservableObject {
    
    // MARK: - Published Properties
    
    @Published var player: AVPlayer?
    @Published var currentTime: TimeInterval = 0
    @Published var duration: TimeInterval = 0
    @Published var isPlaying = false
    @Published var isLoading = false
    @Published var error: PlayerError?
    @Published var rate: Float = 1.0
    
    // MARK: - Private Properties
    
    private var timeObserver: Any?
    private var cancellables = Set<AnyCancellable>()
    private var statusObservation: NSKeyValueObservation?
    private var currentVideoId: String?
    
    // MARK: - Lifecycle
    
    deinit {
        cleanup()
    }
    
    // MARK: - Public Methods
    
    /// Load and play a YouTube video
    func loadVideo(videoId: String) async {
        currentVideoId = videoId
        isLoading = true
        error = nil
        
        do {
            // Extract YouTube stream URL
            let streamURL = try await extractYouTubeURL(videoId: videoId)
            
            // Create player
            let playerItem = AVPlayerItem(url: streamURL)
            let newPlayer = AVPlayer(playerItem: playerItem)
            
            // Observe player status
            statusObservation = playerItem.observe(\.status) { [weak self] item, _ in
                Task { @MainActor in
                    switch item.status {
                    case .readyToPlay:
                        self?.isLoading = false
                        self?.duration = item.duration.seconds
                        self?.play()
                    case .failed:
                        self?.error = .playbackFailed(item.error?.localizedDescription ?? "Unknown error")
                        self?.isLoading = false
                    default:
                        break
                    }
                }
            }
            
            self.player = newPlayer
            setupTimeObserver()
            
        } catch {
            self.error = .urlExtractionFailed(error.localizedDescription)
            self.isLoading = false
        }
    }
    
    /// Play the video
    func play() {
        player?.play()
        isPlaying = true
    }
    
    /// Pause the video
    func pause() {
        player?.pause()
        isPlaying = false
    }
    
    /// Toggle play/pause
    func togglePlayPause() {
        if isPlaying {
            pause()
        } else {
            play()
        }
    }
    
    /// Seek to specific time
    func seek(to time: TimeInterval) {
        let cmTime = CMTime(seconds: time, preferredTimescale: 600)
        player?.seek(to: cmTime, toleranceBefore: .zero, toleranceAfter: .zero)
    }
    
    /// Seek forward by seconds
    func seekForward(by seconds: TimeInterval = 10) {
        seek(to: currentTime + seconds)
    }
    
    /// Seek backward by seconds
    func seekBackward(by seconds: TimeInterval = 10) {
        seek(to: max(0, currentTime - seconds))
    }
    
    /// Set playback rate
    func setRate(_ rate: Float) {
        self.rate = rate
        player?.rate = rate
    }
    
    /// Stop and cleanup
    func stop() {
        cleanup()
        currentVideoId = nil
    }
    
    // MARK: - Private Methods
    
    private func setupTimeObserver() {
        // Remove existing observer
        if let observer = timeObserver {
            player?.removeTimeObserver(observer)
        }
        
        // Add periodic time observer
        let interval = CMTime(seconds: 0.1, preferredTimescale: 600)
        timeObserver = player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            self?.currentTime = time.seconds
        }
    }
    
    private func cleanup() {
        if let observer = timeObserver {
            player?.removeTimeObserver(observer)
            timeObserver = nil
        }
        statusObservation?.invalidate()
        statusObservation = nil
        player?.pause()
        player = nil
        isPlaying = false
    }
    
    /// Extract direct YouTube stream URL
    /// Note: This is a simplified version. In production, you'd want to:
    /// 1. Use a backend service to extract URLs (more reliable)
    /// 2. Use YouTube Data API + a proxy server
    /// 3. Use a library like youtube-dl or yt-dlp
    private func extractYouTubeURL(videoId: String) async throws -> URL {
        // Option 1: Use your Node.js backend to extract URL
        // This is the recommended approach for production
        if let backendURL = URL(string: "https://your-backend.com/api/youtube/stream/\(videoId)") {
            let (data, response) = try await URLSession.shared.data(from: backendURL)
            
            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                throw PlayerError.urlExtractionFailed("Backend returned error")
            }
            
            struct StreamResponse: Codable {
                let streamURL: String
            }
            
            let streamResponse = try JSONDecoder().decode(StreamResponse.self, from: data)
            guard let url = URL(string: streamResponse.streamURL) else {
                throw PlayerError.urlExtractionFailed("Invalid stream URL")
            }
            
            return url
        }
        
        // Option 2: Use YouTube's iframe player API (web-only)
        // Not available for native AVPlayer
        
        // Option 3: For development, use a test video URL
        // You'll need to implement proper YouTube URL extraction
        throw PlayerError.urlExtractionFailed("YouTube URL extraction not configured. Please set up backend service.")
    }
}

// MARK: - Errors

enum PlayerError: LocalizedError {
    case urlExtractionFailed(String)
    case playbackFailed(String)
    case networkError
    
    var errorDescription: String? {
        switch self {
        case .urlExtractionFailed(let message):
            return "Failed to extract video URL: \(message)"
        case .playbackFailed(let message):
            return "Playback failed: \(message)"
        case .networkError:
            return "Network error occurred"
        }
    }
}

// MARK: - Preview Helpers

#if DEBUG
extension YouTubePlayerService {
    static let preview: YouTubePlayerService = {
        let service = YouTubePlayerService()
        service.duration = 354.0
        service.currentTime = 45.0
        service.isPlaying = true
        return service
    }()
}
#endif
