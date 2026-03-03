//
//  LyricsSyncService.swift
//  KTVSinger-Shared
//
//  Service for synchronizing lyrics with video playback
//  Ported from React Native useLyricsSync hook
//

import Foundation
import Combine

/// Service that manages lyrics synchronization with video playback
@MainActor
final class LyricsSyncService: ObservableObject {
    
    // MARK: - Published Properties
    
    @Published var currentTime: TimeInterval = 0
    @Published var lyricsOffset: TimeInterval = 0
    @Published var activeLine: LyricLine?
    @Published var activeLineIndex: Int?
    @Published var activeWord: LyricWord?
    @Published var activeWordIndex: Int?
    
    // MARK: - Private Properties
    
    private var lyrics: [LyricLine] = []
    private var estimatedWords: [EstimatedWord] = []
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Persistence
    
    private let offsetKey = "lyrics_offset"
    
    init() {
        // Load saved offset
        lyricsOffset = UserDefaults.standard.double(forKey: offsetKey)
        
        // Observe offset changes to save them
        $lyricsOffset
            .dropFirst()
            .sink { [weak self] offset in
                guard let self = self else { return }
                UserDefaults.standard.set(offset, forKey: self.offsetKey)
            }
            .store(in: &cancellables)
        
        // Observe time changes to update active lyrics
        Publishers.CombineLatest($currentTime, $lyricsOffset)
            .sink { [weak self] time, offset in
                self?.updateActiveLyrics(at: time + offset)
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Public Methods
    
    /// Load lyrics for synchronization
    func loadLyrics(_ lyrics: [LyricLine]) {
        self.lyrics = lyrics
        self.estimatedWords = estimateWordTiming(from: lyrics)
        updateActiveLyrics(at: currentTime + lyricsOffset)
    }
    
    /// Update current playback time
    func updateTime(_ time: TimeInterval) {
        self.currentTime = time
    }
    
    /// Adjust lyrics offset
    func adjustOffset(by delta: TimeInterval) {
        lyricsOffset += delta
    }
    
    /// Reset offset to zero
    func resetOffset() {
        lyricsOffset = 0
    }
    
    /// Set offset to specific value
    func setOffset(_ offset: TimeInterval) {
        lyricsOffset = offset
    }
    
    // MARK: - Private Methods
    
    private func updateActiveLyrics(at adjustedTime: TimeInterval) {
        // Find active line
        if let lineIndex = lyrics.firstIndex(where: { $0.isActive(at: adjustedTime) }) {
            activeLineIndex = lineIndex
            activeLine = lyrics[lineIndex]
        } else {
            // Find the line that's about to start or just finished
            let sortedLines = lyrics.enumerated().sorted { 
                guard let start1 = $0.element.startTime, let start2 = $1.element.startTime else {
                    return false
                }
                return start1 < start2
            }
            
            if let lineIndex = sortedLines.last(where: { 
                guard let start = $0.element.startTime else { return false }
                return start <= adjustedTime
            })?.offset {
                activeLineIndex = lineIndex
                activeLine = lyrics[lineIndex]
            } else {
                activeLineIndex = nil
                activeLine = nil
            }
        }
        
        // Find active word from estimated words
        if let wordIndex = estimatedWords.firstIndex(where: { 
            adjustedTime >= $0.startTime && adjustedTime < $0.endTime 
        }) {
            activeWordIndex = wordIndex
            let estimated = estimatedWords[wordIndex]
            activeWord = LyricWord(
                text: estimated.text,
                startTime: estimated.startTime,
                endTime: estimated.endTime
            )
        } else {
            activeWordIndex = nil
            activeWord = nil
        }
    }
    
    // MARK: - Word Timing Estimation
    
    /// Estimates word-level timing from line-level lyrics
    /// Ported from estimateWordTiming function in React Native
    private func estimateWordTiming(from lyrics: [LyricLine]) -> [EstimatedWord] {
        var words: [EstimatedWord] = []
        
        for (lineIndex, line) in lyrics.enumerated() {
            guard let startTime = line.startTime else { continue }
            
            let endTime: TimeInterval
            if let lineEnd = line.endTime {
                endTime = lineEnd
            } else if lineIndex < lyrics.count - 1, let nextStart = lyrics[lineIndex + 1].startTime {
                endTime = nextStart
            } else {
                endTime = startTime + 5.0 // Default 5 seconds if no end time
            }
            
            let duration = endTime - startTime
            let lineWords = line.text.split(separator: " ").map { String($0) }
            
            guard !lineWords.isEmpty else { continue }
            
            let wordDuration = duration / TimeInterval(lineWords.count)
            
            for (wordIndex, word) in lineWords.enumerated() {
                let wordStart = startTime + (wordDuration * TimeInterval(wordIndex))
                let wordEnd = wordStart + wordDuration
                
                words.append(EstimatedWord(
                    text: word,
                    startTime: wordStart,
                    endTime: wordEnd,
                    lineIndex: lineIndex
                ))
            }
        }
        
        return words
    }
}

// MARK: - Supporting Types

/// Internal word representation with line association
private struct EstimatedWord {
    let text: String
    let startTime: TimeInterval
    let endTime: TimeInterval
    let lineIndex: Int
}

// MARK: - Preview Helpers

#if DEBUG
extension LyricsSyncService {
    static let preview: LyricsSyncService = {
        let service = LyricsSyncService()
        service.loadLyrics([
            LyricLine(text: "Is this the real life?", startTime: 0.5, endTime: 3.0),
            LyricLine(text: "Is this just fantasy?", startTime: 3.0, endTime: 5.5),
            LyricLine(text: "Caught in a landslide", startTime: 5.5, endTime: 8.0),
            LyricLine(text: "No escape from reality", startTime: 8.0, endTime: 11.0),
        ])
        service.updateTime(3.5)
        return service
    }()
}
#endif
