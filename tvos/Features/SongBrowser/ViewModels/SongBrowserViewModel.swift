//
//  SongBrowserViewModel.swift
//  KTVSinger-tvOS
//
//  ViewModel for browsing and searching songs
//

import Foundation
import Combine

@MainActor
final class SongBrowserViewModel: ObservableObject {
    
    // MARK: - Published Properties
    
    @Published var songs: [Song] = []
    @Published var filteredSongs: [Song] = []
    @Published var searchQuery: String = ""
    @Published var selectedGenre: String?
    @Published var isLoading = false
    @Published var error: Error?
    
    @Published var sortOption: SortOption = .popularity
    
    enum SortOption: String, CaseIterable {
        case popularity = "Popularity"
        case titleAZ = "Title (A-Z)"
        case titleZA = "Title (Z-A)"
        case artist = "Artist"
        case newest = "Newest"
        
        var systemImage: String {
            switch self {
            case .popularity: return "star.fill"
            case .titleAZ: return "textformat.abc"
            case .titleZA: return "textformat.abc"
            case .artist: return "person.fill"
            case .newest: return "clock.fill"
            }
        }
    }
    
    // MARK: - Private Properties
    
    private let supabase = SupabaseClient.shared
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Available Genres
    
    var availableGenres: [String] {
        let genres = Set(songs.compactMap { $0.genre })
        return Array(genres).sorted()
    }
    
    // MARK: - Initialization
    
    init() {
        setupSearchObserver()
        Task {
            await loadSongs()
        }
    }
    
    // MARK: - Public Methods
    
    func loadSongs() async {
        isLoading = true
        error = nil
        
        do {
            songs = try await supabase.fetchSongs(limit: 100)
            applyFiltersAndSort()
            isLoading = false
        } catch {
            self.error = error
            isLoading = false
        }
    }
    
    func searchSongs() async {
        guard !searchQuery.isEmpty else {
            applyFiltersAndSort()
            return
        }
        
        isLoading = true
        
        do {
            let results = try await supabase.searchSongs(query: searchQuery, limit: 50)
            filteredSongs = results
            isLoading = false
        } catch {
            self.error = error
            isLoading = false
        }
    }
    
    func selectGenre(_ genre: String?) {
        selectedGenre = genre
        applyFiltersAndSort()
    }
    
    func changeSortOption(_ option: SortOption) {
        sortOption = option
        applyFiltersAndSort()
    }
    
    func refresh() async {
        await loadSongs()
    }
    
    func toggleFavorite(song: Song) async {
        // Check if already favorited
        do {
            let favorites = try await supabase.fetchFavorites()
            if favorites.contains(where: { $0.id == song.id }) {
                try await supabase.removeFavorite(songId: song.id)
            } else {
                try await supabase.addFavorite(songId: song.id)
            }
        } catch {
            self.error = error
        }
    }
    
    // MARK: - Private Methods
    
    private func setupSearchObserver() {
        $searchQuery
            .debounce(for: .milliseconds(500), scheduler: DispatchQueue.main)
            .sink { [weak self] _ in
                Task {
                    await self?.searchSongs()
                }
            }
            .store(in: &cancellables)
    }
    
    private func applyFiltersAndSort() {
        var result = songs
        
        // Apply genre filter
        if let genre = selectedGenre {
            result = result.filter { $0.genre == genre }
        }
        
        // Apply search filter (local)
        if !searchQuery.isEmpty {
            result = result.filter {
                $0.title.localizedCaseInsensitiveContains(searchQuery) ||
                $0.artist.localizedCaseInsensitiveContains(searchQuery)
            }
        }
        
        // Apply sorting
        switch sortOption {
        case .popularity:
            result.sort { ($0.popularity ?? 0) > ($1.popularity ?? 0) }
        case .titleAZ:
            result.sort { $0.title.localizedCompare($1.title) == .orderedAscending }
        case .titleZA:
            result.sort { $0.title.localizedCompare($1.title) == .orderedDescending }
        case .artist:
            result.sort { $0.artist.localizedCompare($1.artist) == .orderedAscending }
        case .newest:
            result.sort { $0.createdAt > $1.createdAt }
        }
        
        filteredSongs = result
    }
}

// MARK: - Preview

#if DEBUG
extension SongBrowserViewModel {
    static let preview: SongBrowserViewModel = {
        let vm = SongBrowserViewModel()
        vm.songs = Song.previewList
        vm.filteredSongs = Song.previewList
        return vm
    }()
}
#endif
