# Quick Reference - KTV Singer tvOS

## 🚀 Getting Started (5 Minutes)

### 1. Create Xcode Project
```bash
# In Xcode:
# File → New → Project → tvOS → App
# Name: KTVSinger
# Interface: SwiftUI
# Language: Swift
```

### 2. Add Dependencies
```swift
// File → Add Package Dependencies
https://github.com/supabase/supabase-swift.git
// Version: 2.0.0+
```

### 3. Set Environment Variables
```bash
# Product → Scheme → Edit Scheme → Arguments → Environment Variables
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-key-here
```

### 4. Copy Files
Copy all `.swift` files from this session into your project following the folder structure.

### 5. Build & Run
⌘B to build, ⌘R to run

## 📁 File Organization

```
Copy these files to your Xcode project:

Shared/Models/
  ├── Song.swift
  └── DeviceConnection.swift

Shared/Database/
  └── SupabaseClient.swift

Shared/Services/
  └── DevicePairingService.swift

Features/Player/
  ├── Views/PlayerView.swift
  ├── ViewModels/PlayerViewModel.swift
  └── Services/
      ├── YouTubePlayerService.swift
      └── LyricsSyncService.swift

Features/SongBrowser/
  ├── Views/SongBrowserView.swift
  └── ViewModels/SongBrowserViewModel.swift

Features/Authentication/
  └── Views/AuthenticationView.swift

Features/Favorites/
  └── Views/FavoritesView.swift

Features/Settings/
  └── Views/SettingsView.swift

Features/Pairing/
  └── Views/PairingView.swift

tvOS/
  └── KTVSingerApp.swift
```

## 🗄️ Supabase Quick Setup

### SQL Schema (Run in Supabase SQL Editor)

```sql
-- Songs table
CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    video_id TEXT UNIQUE NOT NULL,
    duration REAL NOT NULL,
    thumbnail_url TEXT,
    lyrics JSONB,
    genre TEXT,
    year INTEGER,
    language TEXT,
    popularity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User favorites
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, song_id)
);

-- Enable RLS
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Public read for songs
CREATE POLICY "Songs are viewable by everyone"
    ON songs FOR SELECT USING (true);

-- Users manage own favorites
CREATE POLICY "Users manage own favorites"
    ON user_favorites FOR ALL
    USING (auth.uid() = user_id);
```

### Sample Data

```sql
INSERT INTO songs (title, artist, video_id, duration, genre, popularity) VALUES
('Bohemian Rhapsody', 'Queen', 'fJ9rUzIMcZQ', 354, 'Rock', 100),
('Don''t Stop Believin''', 'Journey', '1k8craCGpgs', 251, 'Rock', 95);
```

## 🎯 Common Tasks

### Add New Song

```swift
let song = Song(
    title: "Song Title",
    artist: "Artist Name",
    videoId: "youtube_video_id",
    duration: 180,
    lyrics: []
)

try await SupabaseClient.shared.insertSong(song)
```

### Search Songs

```swift
let results = try await SupabaseClient.shared
    .searchSongs(query: "queen", limit: 20)
```

### Play Song

```swift
// In your view:
@State private var selectedSong: Song?

// Trigger:
selectedSong = song

// Sheet:
.fullScreenCover(item: $selectedSong) { song in
    PlayerView(song: song)
}
```

### Adjust Lyrics Sync

```swift
// In PlayerView, buttons already exist:
viewModel.adjustLyricsOffset(by: -0.5) // Earlier
viewModel.adjustLyricsOffset(by: 0.5)  // Later
viewModel.resetLyricsOffset()          // Reset
```

### Show Pairing QR Code

```swift
@State private var showPairing = false

Button("Connect Device") {
    showPairing = true
}
.sheet(isPresented: $showPairing) {
    PairingView()
}
```

## 🔧 Customization

### Change Theme Colors

```swift
// In PlayerView.swift, update colors:
private func lyricColor(isActive: Bool, isPast: Bool) -> Color {
    if isActive {
        return .cyan  // ← Change this
    } else if isPast {
        return .white.opacity(0.4)
    } else {
        return .white.opacity(0.6)
    }
}
```

### Adjust Lyrics Font Size

```swift
// In PlayerView.swift:
Text(line.text)
    .font(.system(size: isActive ? 48 : 36)) // ← Adjust these
```

### Change Video/Lyrics Split

```swift
// In PlayerView.swift:
HStack(spacing: 0) {
    videoPlayer
        .frame(maxWidth: .infinity) // ← Adjust ratio
    
    lyricsPanel
        .frame(width: 700) // ← Adjust width
}
```

## 🐛 Troubleshooting

### Build Errors

| Error | Solution |
|-------|----------|
| "Cannot find SupabaseClient" | Add Supabase package dependency |
| "Module 'Supabase' not found" | Product → Clean Build Folder, rebuild |
| "Missing environment variable" | Set SUPABASE_URL and SUPABASE_ANON_KEY |

### Runtime Issues

| Issue | Solution |
|-------|----------|
| Authentication fails | Check Supabase auth is enabled |
| No songs show | Insert sample data in Supabase |
| Video won't play | Implement YouTube URL extraction backend |
| Lyrics don't sync | Ensure lyrics have startTime/endTime |

## 📝 Code Snippets

### Custom Lyrics Format

```swift
let lyrics = [
    LyricLine(text: "First line", startTime: 0.0, endTime: 3.0),
    LyricLine(text: "Second line", startTime: 3.0, endTime: 6.0),
    // ...
]
```

### Add to Favorites

```swift
try await SupabaseClient.shared.addFavorite(songId: song.id)
```

### Get User's Favorites

```swift
let favorites = try await SupabaseClient.shared.fetchFavorites()
```

### Sign Out

```swift
try await SupabaseClient.shared.signOut()
```

## 🎮 tvOS Remote Controls

Focus management is automatic with SwiftUI's `@FocusState`:

```swift
@FocusState private var focusedButton: Button?

Button("Play") { }
    .focused($focusedButton, equals: .play)
```

Swipe to navigate, Click to select - handled automatically!

## 📱 iOS Companion (Future)

To scan QR code from iOS:

```swift
import AVFoundation

// Use AVCaptureMetadataOutput
// Detect QR code
// Parse PairingPayload
// Connect via WebSocket
```

## 🔗 Important URLs

- Supabase Dashboard: https://app.supabase.com
- Supabase Swift Docs: https://github.com/supabase/supabase-swift
- AVKit Docs: https://developer.apple.com/documentation/avkit/
- SwiftUI tvOS: https://developer.apple.com/design/human-interface-guidelines/tvos

## 📊 Project Status

- [x] ✅ Core architecture
- [x] ✅ Authentication
- [x] ✅ Song browsing
- [x] ✅ Player with lyrics
- [x] ✅ Favorites
- [x] ✅ Settings
- [x] ✅ Pairing UI
- [ ] ⏳ YouTube backend
- [ ] ⏳ iOS companion
- [ ] ⏳ Audio streaming

## 💡 Pro Tips

1. **Use Preview**: All views have `#Preview` - use Canvas in Xcode
2. **Test on Simulator**: Apple TV simulator works great
3. **Focus Debugging**: Use Accessibility Inspector to see focus
4. **Async/Await**: All network calls use Swift Concurrency
5. **Type Safety**: Leverage Swift's type system, avoid `Any`

## 🎉 Next Steps

1. Follow `PROJECT_SETUP.md` for detailed setup
2. Follow `SUPABASE_SETUP.md` for database
3. Implement YouTube URL extraction endpoint
4. Test on real Apple TV
5. Start iOS companion app

---

**Need help?** Check the full documentation in:
- `PROJECT_SETUP.md` - Detailed setup
- `SUPABASE_SETUP.md` - Database schema
- `README-TVOS.md` - Full overview
