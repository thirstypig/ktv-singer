import { Filter } from 'lucide-react';
import { Button } from '@common/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@common/components/ui/sheet';
import type { Song } from '@shared/schema';
import SongCard from './SongCard';
import FilterPanel from './FilterPanel';

interface SongGridProps {
  songs: Song[];
  filteredSongs: Song[];
  selectedGenders: string[];
  selectedGenres: string[];
  selectedDecades: string[];
  onGenderChange: (genders: string[]) => void;
  onGenreChange: (genres: string[]) => void;
  onDecadeChange: (decades: string[]) => void;
  onClearAll: () => void;
  onPlaySong: (id: string) => void;
}

export default function SongGrid({
  songs,
  filteredSongs,
  selectedGenders,
  selectedGenres,
  selectedDecades,
  onGenderChange,
  onGenreChange,
  onDecadeChange,
  onClearAll,
  onPlaySong,
}: SongGridProps) {
  return (
    <div className="flex gap-6">
      <div className="hidden md:block">
        <FilterPanel
          selectedGenders={selectedGenders}
          selectedGenres={selectedGenres}
          selectedDecades={selectedDecades}
          onGenderChange={onGenderChange}
          onGenreChange={onGenreChange}
          onDecadeChange={onDecadeChange}
          onClearAll={onClearAll}
        />
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {filteredSongs.length === songs.length
              ? 'All Songs'
              : `Filtered Songs (${filteredSongs.length})`}
          </h2>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden" data-testid="button-filters-mobile">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <FilterPanel
                selectedGenders={selectedGenders}
                selectedGenres={selectedGenres}
                selectedDecades={selectedDecades}
                onGenderChange={onGenderChange}
                onGenreChange={onGenreChange}
                onDecadeChange={onDecadeChange}
                onClearAll={onClearAll}
              />
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSongs.map((song) => (
            <SongCard
              key={song.id}
              id={song.id}
              title={song.title}
              artist={song.artist}
              thumbnailUrl={song.thumbnailUrl || ''}
              genre={song.genre}
              gender={song.gender as 'male' | 'female' | 'duet'}
              year={song.year}
              playCount={song.playCount}
              onPlay={onPlaySong}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
