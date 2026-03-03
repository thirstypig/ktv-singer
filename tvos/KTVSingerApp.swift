//
//  KTVSingerApp.swift
//  KTVSinger-tvOS
//
//  Main app entry point for tvOS
//

import SwiftUI

@main
struct KTVSingerApp: App {
    @StateObject private var supabase = SupabaseClient.shared
    @StateObject private var pairingService = DevicePairingService()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(supabase)
                .environmentObject(pairingService)
                .onAppear {
                    // Start listening for device connections
                    Task {
                        try? await pairingService.startListening()
                    }
                }
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var supabase: SupabaseClient
    @State private var showPairingSheet = false
    
    var body: some View {
        ZStack {
            if supabase.isAuthenticated {
                // Main app content
                TabView {
                    SongBrowserView()
                        .tabItem {
                            Label("Browse", systemImage: "music.note.list")
                        }
                    
                    FavoritesView()
                        .tabItem {
                            Label("Favorites", systemImage: "heart.fill")
                        }
                    
                    SettingsView()
                        .tabItem {
                            Label("Settings", systemImage: "gearshape.fill")
                        }
                }
                
                // Floating button to show pairing QR code
                VStack {
                    HStack {
                        Spacer()
                        Button {
                            showPairingSheet = true
                        } label: {
                            Image(systemName: "iphone.and.arrow.forward")
                                .font(.title)
                                .foregroundColor(.white)
                                .padding(20)
                                .background(Color.blue)
                                .clipShape(Circle())
                                .shadow(radius: 10)
                        }
                        .padding(.top, 60)
                        .padding(.trailing, 60)
                    }
                    Spacer()
                }
                .sheet(isPresented: $showPairingSheet) {
                    PairingView()
                }
            } else {
                // Authentication screen
                AuthenticationView()
            }
        }
    }
}

// MARK: - Preview

#Preview {
    ContentView()
        .environmentObject(SupabaseClient.shared)
        .environmentObject(DevicePairingService())
}
