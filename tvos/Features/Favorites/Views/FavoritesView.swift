//
//  FavoritesView.swift
//  KTVSinger-tvOS
//
//  View for displaying user's favorite songs
//

import SwiftUI

struct FavoritesView: View {
    @EnvironmentObject var supabase: SupabaseClient
    @State private var favorites: [Song] = []
    @State private var isLoading = false
    @State private var selectedSong: Song?
    
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [.black, .purple.opacity(0.3)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("❤️ My Favorites")
                            .font(.system(size: 56, weight: .bold))
                            .foregroundColor(.white)
                        
                        Text("\(favorites.count) songs")
                            .font(.title3)
                            .foregroundColor(.white.opacity(0.7))
                    }
                    
                    Spacer()
                    
                    Button {
                        Task {
                            await loadFavorites()
                        }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                            .font(.title2)
                            .foregroundColor(.white)
                            .padding(16)
                            .background(Color.white.opacity(0.1))
                            .clipShape(Circle())
                    }
                }
                .padding(.horizontal, 48)
                .padding(.top, 40)
                .padding(.bottom, 20)
                
                // Content
                if isLoading {
                    Spacer()
                    ProgressView()
                        .scaleEffect(2)
                    Spacer()
                } else if favorites.isEmpty {
                    emptyView
                } else {
                    favoritesList
                }
            }
        }
        .fullScreenCover(item: $selectedSong) { song in
            PlayerView(song: song)
        }
        .task {
            await loadFavorites()
        }
    }
    
    private var favoritesList: some View {
        ScrollView {
            LazyVGrid(
                columns: [
                    GridItem(.adaptive(minimum: 400, maximum: 500), spacing: 30)
                ],
                spacing: 30
            ) {
                ForEach(favorites) { song in
                    SongCard(song: song)
                        .onTapGesture {
                            selectedSong = song
                        }
                }
            }
            .padding(.horizontal, 48)
            .padding(.bottom, 60)
        }
    }
    
    private var emptyView: some View {
        VStack(spacing: 30) {
            Image(systemName: "heart.slash")
                .font(.system(size: 100))
                .foregroundColor(.white.opacity(0.3))
            
            Text("No favorites yet")
                .font(.title)
                .foregroundColor(.white)
            
            Text("Browse songs and add them to your favorites")
                .font(.title3)
                .foregroundColor(.white.opacity(0.6))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private func loadFavorites() async {
        isLoading = true
        
        do {
            favorites = try await supabase.fetchFavorites()
        } catch {
            print("Failed to load favorites: \(error)")
        }
        
        isLoading = false
    }
}

// MARK: - Preview

#Preview {
    FavoritesView()
        .environmentObject(SupabaseClient.shared)
}
