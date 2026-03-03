//
//  DeviceConnection.swift
//  KTVSinger-Shared
//
//  Models for multi-device connectivity (tvOS ↔ iOS)
//

import Foundation

/// Represents a connected device (iOS microphone companion)
struct ConnectedDevice: Identifiable, Codable, Hashable, Sendable {
    let id: UUID
    let name: String
    let type: DeviceType
    let connectionMethod: ConnectionMethod
    let connectedAt: Date
    var isActive: Bool
    
    enum DeviceType: String, Codable, Sendable {
        case iPhone
        case iPad
        case android
        case unknown
    }
    
    enum ConnectionMethod: String, Codable, Sendable {
        case qrCode
        case bonjour
        case bluetooth
    }
}

/// QR code payload for device pairing
struct PairingPayload: Codable, Sendable {
    let sessionId: String
    let serverURL: String
    let port: Int
    let deviceName: String
    let timestamp: Date
    
    /// Generate QR code string
    func toQRString() -> String? {
        guard let data = try? JSONEncoder().encode(self),
              let string = String(data: data, encoding: .utf8) else {
            return nil
        }
        return string
    }
    
    /// Parse from QR code string
    static func from(qrString: String) -> PairingPayload? {
        guard let data = qrString.data(using: .utf8),
              let payload = try? JSONDecoder().decode(PairingPayload.self, from: data) else {
            return nil
        }
        return payload
    }
}

/// WebSocket message types for device communication
enum DeviceMessage: Codable, Sendable {
    case ping
    case pong
    case pairRequest(deviceId: String, deviceName: String, deviceType: ConnectedDevice.DeviceType)
    case pairAccepted(sessionId: String)
    case pairRejected(reason: String)
    case audioData(Data)
    case playbackControl(PlaybackControl)
    case syncState(PlaybackState)
    case disconnect
    
    enum PlaybackControl: String, Codable, Sendable {
        case play
        case pause
        case stop
        case seekForward
        case seekBackward
        case nextSong
        case previousSong
        case adjustLyricsOffset
    }
    
    struct PlaybackState: Codable, Sendable {
        let currentTime: TimeInterval
        let isPlaying: Bool
        let songId: UUID?
        let lyricsOffset: TimeInterval
    }
}

/// Audio stream packet from iOS device
struct AudioPacket: Codable, Sendable {
    let deviceId: UUID
    let timestamp: TimeInterval
    let sampleRate: Double
    let channelCount: Int
    let format: AudioFormat
    let data: Data
    
    enum AudioFormat: String, Codable, Sendable {
        case pcm16
        case pcm32
        case aac
        case opus
    }
}

/// Network service info for Bonjour discovery
struct NetworkServiceInfo: Sendable {
    let name: String
    let type: String
    let domain: String
    let port: Int
    
    static let serviceType = "_ktvsinfer._tcp"
    static let serviceDomain = "local."
}
