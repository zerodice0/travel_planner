import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '#components/ui/Input';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="장소, 목록 검색..."
          className="pl-12 py-3 text-base rounded-xl"
          fullWidth
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground pointer-events-none">
          🔍
        </span>
      </div>
    </form>
  );
}
