//
//  SupabaseClient.swift
//  KTVSinger-Shared
//
//  Supabase client configuration and initialization
//

import Foundation
import Supabase

/// Centralized Supabase client for the app
@MainActor
final class SupabaseClient: ObservableObject {
    static let shared = SupabaseClient()
    
    private(set) var client: Supabase.Client!
    
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    
    private init() {
        // Configure with your Supabase project credentials
        guard let supabaseURL = URL(string: Configuration.supabaseURL),
              let supabaseKey = Configuration.supabaseAnonKey else {
            fatalError("Supabase configuration is missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY")
        }
        
        client = Supabase.Client(
            supabaseURL: supabaseURL,
            supabaseKey: supabaseKey,
            options: SupabaseClientOptions(
                db: SupabaseClientOptions.DatabaseOptions(
                    schema: "public"
                ),
                auth: SupabaseClientOptions.AuthOptions(
                    autoRefreshToken: true,
                    persistSession: true
                )
            )
        )
        
        // Listen for auth state changes
        Task {
            await observeAuthChanges()
        }
    }
    
    private func observeAuthChanges() async {
        for await state in await client.auth.authStateChanges {
            switch state {
            case .signedIn(let session):
                self.isAuthenticated = true
                self.currentUser = session.user
                
            case .signedOut:
                self.isAuthenticated = false
                self.currentUser = nil
                
            case .userUpdated(let session):
                self.currentUser = session.user
                
            default:
                break
            }
        }
    }
    
    // MARK: - Authentication
    
    func signUp(email: String, password: String) async throws {
        try await client.auth.signUp(email: email, password: password)
    }
    
    func signIn(email: String, password: String) async throws {
        try await client.auth.signIn(email: email, password: password)
    }
    
    func signInWithApple() async throws {
        // Implement Sign in with Apple
        // This requires additional setup with Apple Developer account
        throw SupabaseError.notImplemented
    }
    
    func signOut() async throws {
        try await client.auth.signOut()
    }
    
    func resetPassword(email: String) async throws {
        try await client.auth.resetPasswordForEmail(email)
    }
    
    // MARK: - Database Operations
    
    func fetchSongs(limit: Int = 50, offset: Int = 0) async throws -> [Song] {
        let response: [Song] = try await client.database
            .from(Song.tableName)
            .select()
            .limit(limit)
            .offset(offset)
            .order("popularity", ascending: false)
            .execute()
            .value
        
        return response
    }
    
    func searchSongs(query: String, limit: Int = 50) async throws -> [Song] {
        let response: [Song] = try await client.database
            .from(Song.tableName)
            .select()
            .or("title.ilike.%\(query)%,artist.ilike.%\(query)%")
            .limit(limit)
            .execute()
            .value
        
        return response
    }
    
    func fetchSong(id: UUID) async throws -> Song? {
        let response: Song? = try await client.database
            .from(Song.tableName)
            .select()
            .eq("id", value: id.uuidString)
            .single()
            .execute()
            .value
        
        return response
    }
    
    func insertSong(_ song: Song) async throws {
        try await client.database
            .from(Song.tableName)
            .insert(song)
            .execute()
    }
    
    func updateSong(_ song: Song) async throws {
        try await client.database
            .from(Song.tableName)
            .update(song)
            .eq("id", value: song.id.uuidString)
            .execute()
    }
    
    func deleteSong(id: UUID) async throws {
        try await client.database
            .from(Song.tableName)
            .delete()
            .eq("id", value: id.uuidString)
            .execute()
    }
    
    // MARK: - User Favorites
    
    func fetchFavorites() async throws -> [Song] {
        guard let userId = currentUser?.id else {
            throw SupabaseError.notAuthenticated
        }
        
        let response: [Song] = try await client.database
            .from("user_favorites")
            .select("*, songs(*)")
            .eq("user_id", value: userId.uuidString)
            .execute()
            .value
        
        return response
    }
    
    func addFavorite(songId: UUID) async throws {
        guard let userId = currentUser?.id else {
            throw SupabaseError.notAuthenticated
        }
        
        try await client.database
            .from("user_favorites")
            .insert([
                "user_id": userId.uuidString,
                "song_id": songId.uuidString,
                "created_at": ISO8601DateFormatter().string(from: Date())
            ])
            .execute()
    }
    
    func removeFavorite(songId: UUID) async throws {
        guard let userId = currentUser?.id else {
            throw SupabaseError.notAuthenticated
        }
        
        try await client.database
            .from("user_favorites")
            .delete()
            .eq("user_id", value: userId.uuidString)
            .eq("song_id", value: songId.uuidString)
            .execute()
    }
    
    // MARK: - Real-time Subscriptions
    
    func subscribeToSongUpdates(onChange: @escaping (Song) -> Void) async throws -> RealtimeChannel {
        let channel = await client.realtime.channel("songs")
        
        await channel.on(.postgresChanges(
            event: .all,
            schema: "public",
            table: Song.tableName
        )) { message in
            // Handle real-time updates
            if let song = Song(from: message.payload) {
                onChange(song)
            }
        }
        
        try await channel.subscribe()
        return channel
    }
}

// MARK: - Configuration

private enum Configuration {
    static var supabaseURL: String {
        // In production, read from Info.plist or environment
        ProcessInfo.processInfo.environment["SUPABASE_URL"] ?? ""
    }
    
    static var supabaseAnonKey: String {
        // In production, read from Info.plist or environment
        ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"] ?? ""
    }
}

// MARK: - Errors

enum SupabaseError: LocalizedError {
    case notAuthenticated
    case notImplemented
    case networkError
    case decodingError
    
    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "User is not authenticated"
        case .notImplemented:
            return "Feature not yet implemented"
        case .networkError:
            return "Network error occurred"
        case .decodingError:
            return "Failed to decode response"
        }
    }
}
