import {useState} from "react";
import "../styles/SearchBar.css";

function SearchBar({onSearch}) {
  const [keyword, setKeyword] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(keyword.trim());
  };

  return (
    <form className="search-bar" onSubmit={handleSearch}>
      <input
        type="text"
        placeholder="제목, 작가명을 검색하세요."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      <button type="submit" aria-label="검색">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      </button>
    </form>
  );
}

export default SearchBar;
