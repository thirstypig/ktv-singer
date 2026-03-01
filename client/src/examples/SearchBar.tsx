import { SearchBar } from '@features/search';

export default function SearchBarExample() {
  return (
    <div className="p-8 bg-background">
      <SearchBar
        onSearch={(query: string) => console.log('Search:', query)}
        onVideoLink={(url: string) => console.log('Video URL:', url)}
      />
    </div>
  );
}
