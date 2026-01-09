import React, { useState, useEffect, useRef } from 'react'
import { useStock } from '../context/StockContext'
import { X, Plus, Search } from 'lucide-react'
import { searchStockSymbols } from '../services/stockApi'
import './Watchlist.css'

const Watchlist = () => {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useStock()
  const [searchInput, setSearchInput] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const searchRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Fetch suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchInput.length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setLoadingSuggestions(true)
      try {
        const results = await searchStockSymbols(searchInput)
        setSuggestions(results)
        setShowSuggestions(results.length > 0)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
      } finally {
        setLoadingSuggestions(false)
      }
    }

    const debounceTimer = setTimeout(() => {
      fetchSuggestions()
    }, 300) // Debounce for 300ms

    return () => clearTimeout(debounceTimer)
  }, [searchInput])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setShowSuggestions(false)
      }
    }

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSuggestions])

  const handleAdd = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      addToWatchlist(searchInput.trim().toUpperCase())
      setSearchInput('')
      setSuggestions([])
      setShowSuggestions(false)
      setIsAdding(false)
    }
  }

  const handleSuggestionSelect = (suggestion) => {
    addToWatchlist(suggestion.symbol.toUpperCase())
    setSearchInput('')
    setSuggestions([])
    setShowSuggestions(false)
    setIsAdding(false)
  }

  return (
    <div className="watchlist">
      <div className="watchlist-header">
        <h2>Watchlist</h2>
        <button 
          className="add-btn"
          onClick={() => setIsAdding(!isAdding)}
        >
          <Plus size={20} />
        </button>
      </div>

      {isAdding && (
        <div className="add-form-wrapper" style={{ position: 'relative' }}>
          <form onSubmit={handleAdd} className="add-form">
            <div className="input-group" ref={searchRef}>
              <Search className="input-icon" size={18} />
              <input
                type="text"
                placeholder="Search stock symbol or name (e.g., RELIANCE or Apple)"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true)
                  }
                }}
                className="stock-input"
                autoFocus
              />
              {loadingSuggestions && (
                <div className="suggestion-loading" style={{ 
                  position: 'absolute', 
                  right: '10px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#718096',
                  fontSize: '0.75rem'
                }}>
                  Searching...
                </div>
              )}
            </div>
          </form>
          
          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="suggestions-dropdown"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                background: '#141a2e',
                border: '1px solid #1e3a5f',
                borderRadius: '8px',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
              }}
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.symbol}-${index}`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  style={{
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    borderBottom: index < suggestions.length - 1 ? '1px solid #1e3a5f' : 'none',
                    transition: 'background 0.2s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1e3a5f'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      color: '#fff', 
                      fontWeight: 600, 
                      fontSize: '0.9rem',
                      marginBottom: '0.25rem'
                    }}>
                      {suggestion.symbol}
                    </div>
                    <div style={{ 
                      color: '#a0aec0', 
                      fontSize: '0.8rem' 
                    }}>
                      {suggestion.name}
                    </div>
                    {suggestion.exchange && (
                      <div style={{ 
                        color: '#718096', 
                        fontSize: '0.75rem',
                        marginTop: '0.25rem'
                      }}>
                        {suggestion.exchange}
                      </div>
                    )}
                  </div>
                  {watchlist.includes(suggestion.symbol.toUpperCase()) && (
                    <div style={{
                      padding: '0.25rem 0.5rem',
                      background: '#00d4aa',
                      color: '#0a0e27',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      Added
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {showSuggestions && searchInput.length >= 2 && suggestions.length === 0 && !loadingSuggestions && (
            <div 
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                background: '#141a2e',
                border: '1px solid #1e3a5f',
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'center',
                color: '#718096',
                fontSize: '0.85rem',
                zIndex: 1000
              }}
            >
              No results found for "{searchInput}"
            </div>
          )}
        </div>
      )}

      <div className="watchlist-items">
        {watchlist.map((symbol) => (
          <div key={symbol} className="watchlist-item">
            <span className="watchlist-symbol">{symbol}</span>
            <button
              className="remove-btn"
              onClick={() => removeFromWatchlist(symbol)}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Watchlist
