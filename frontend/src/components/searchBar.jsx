import React, { useState } from 'react';
import '../styles/pages/searchBar.css';

const SearchBar = ({ onSearch, placeholder = "Enter city name..." }) => {
  const [city, setCity] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const validateCity = (input) => {
    const cityRegex = /^[a-zA-Z\s'-]{1,100}$/;
    return cityRegex.test(input);
  };

  const sanitizeInput = (input) => {
    return input
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const sanitized = sanitizeInput(city);
    
    if (!sanitized) return;
    
    if (!validateCity(sanitized)) {
      alert('Please enter a valid city name');
      return;
    }

    if (isSearching) return;
    
    setIsSearching(true);
    try {
      await onSearch(sanitized);
      setCity('');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = (e) => {
    e.preventDefault();
    setCity('');
  };

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <div className="search-input-container">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={placeholder}
          className="search-input"
          maxLength={100}
          disabled={isSearching}
        />
      </div>
      <div className="buttons-container">
        <button 
          type="submit" 
          className="search-button" 
          disabled={isSearching || !city.trim()}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
        <button 
          type="button" 
          className="clear-button" 
          onClick={handleClear}
          disabled={isSearching || !city.trim()}
        >
          Clear
        </button>
      </div>
    </form>
  );
};

export default SearchBar;