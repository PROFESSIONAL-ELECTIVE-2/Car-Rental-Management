import React from 'react';
import './SearchBar.css';

// Destructure 'value' and 'onChange' from props
function SearchBar({ value, onChange, placeholder = "Search for a car..." }) {
  return (
    <div className="search-wrapper">
      <div className="search-input-container">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        {value && (
          <button 
            className="clear-button" 
            onClick={() => onChange({ target: { value: '' } })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchBar;