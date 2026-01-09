import React, { useState, useEffect, useRef } from 'react'
import { useStock } from '../context/StockContext'
import { TrendingUp, TrendingDown, BarChart3, Calendar, X } from 'lucide-react'
import { getMarketStatus } from '../utils/marketStatus'
import { format, isSameDay } from 'date-fns'
import DateCalendar from './DateCalendar'
import StockChart from './StockChart'
import TradingSignals from './TradingSignals'
import './StockTable.css'

const StockTable = () => {
  const { stocks, loading, selectedDate, setSelectedDate } = useStock()
  const [selectedStock, setSelectedStock] = useState(null)
  const [showAllChartsView, setShowAllChartsView] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [showCalendar, setShowCalendar] = useState(false)
  const calendarRef = useRef(null)
  const marketStatus = getMarketStatus()

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false)
      }
    }

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCalendar])

  const isIndianStock = (symbol) => {
    return symbol && symbol.endsWith('.NS')
  }

  const formatNumber = (num, symbol) => {
    if (num === null || num === undefined || isNaN(num)) {
      return '-'
    }
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num)
    
    return isIndianStock(symbol) ? `₹${formatted}` : `$${formatted}`
  }

  const formatVolume = (num) => {
    if (num === null || num === undefined || isNaN(num)) {
      return '-'
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K'
    }
    return num.toString()
  }

  // Calculate confidence level for each stock
  const calculateConfidence = (stock) => {
    if (!stock.price || stock.changePercent === null || stock.changePercent === undefined) {
      return 'low'
    }

    const changePercent = Math.abs(stock.changePercent || 0)
    const hasVolume = stock.volume && stock.volume > 0
    const hasHighLow = stock.high && stock.low
    
    // Calculate volatility
    let volatility = 0
    if (hasHighLow && stock.price) {
      const spread = ((stock.high - stock.low) / stock.price) * 100
      volatility = spread
    }

    // Confidence scoring
    let confidenceScore = 0

    // Strong price movement indicates high confidence
    if (changePercent > 5) {
      confidenceScore += 3 // High confidence
    } else if (changePercent > 2) {
      confidenceScore += 2 // Medium confidence
    } else if (changePercent > 0.5) {
      confidenceScore += 1 // Low confidence
    }

    // Volume presence increases confidence
    if (hasVolume) {
      confidenceScore += 1
    }

    // Moderate volatility is good (not too high, not too low)
    if (volatility > 1 && volatility < 8) {
      confidenceScore += 1
    }

    // Determine confidence level
    if (confidenceScore >= 4) {
      return 'high'
    } else if (confidenceScore >= 2) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedStocks = React.useMemo(() => {
    if (!sortConfig.key) {
      return [...stocks]
    }

    return [...stocks].sort((a, b) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      // Handle string comparisons (case-insensitive for symbol/name)
      if (sortConfig.key === 'symbol' || sortConfig.key === 'name') {
        aValue = String(aValue).toUpperCase()
        bValue = String(bValue).toUpperCase()
      }

      // Handle numeric comparisons
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Handle string comparisons
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      }
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
    })
  }, [stocks, sortConfig])

  return (
    <div className="stock-table-container">
      <div className="stock-table-wrapper" style={{ 
        display: (showAllChartsView || selectedStock) ? 'none' : 'block' 
      }}>
        <div className="table-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h2>Market Watch</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {!marketStatus.isOpen && stocks.length > 0 && (
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: '#a0aec0',
                  fontStyle: 'italic'
                }}>
                  Showing previous day's closing data
                </div>
              )}
              <div ref={calendarRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: showCalendar ? '#00d4aa' : 'transparent',
                    border: '1px solid',
                    borderColor: showCalendar ? '#00d4aa' : '#1e3a5f',
                    borderRadius: '6px',
                    color: showCalendar ? '#0a0e27' : '#a0aec0',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.9rem'
                  }}
                  onMouseEnter={(e) => {
                    if (!showCalendar) {
                      e.currentTarget.style.borderColor = '#00d4aa'
                      e.currentTarget.style.color = '#00d4aa'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!showCalendar) {
                      e.currentTarget.style.borderColor = '#1e3a5f'
                      e.currentTarget.style.color = '#a0aec0'
                    }
                  }}
                >
                  <Calendar size={18} />
                  <span>{selectedDate ? format(selectedDate, 'dd MMM yyyy') : 'Select Date'}</span>
                </button>
                {showCalendar && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    zIndex: 1000,
                    background: '#141a2e',
                    border: '1px solid #1e3a5f',
                    borderRadius: '8px',
                    padding: '1rem',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>Select Date</span>
                      <button
                        onClick={() => {
                          setSelectedDate(null)
                          setShowCalendar(false)
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#a0aec0',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="View latest data"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <DateCalendar
                      selectedDate={selectedDate}
                      onDateSelect={(date) => {
                        setSelectedDate(date)
                        setShowCalendar(false)
                      }}
                      availableDates={[]}
                    />
                    {selectedDate && (
                      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            setSelectedDate(null)
                            setShowCalendar(false)
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'transparent',
                            border: '1px solid #1e3a5f',
                            borderRadius: '6px',
                            color: '#a0aec0',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          View Latest Data
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          {selectedDate && (
            <div style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.85rem', 
              color: '#00d4aa',
              fontWeight: 500
            }}>
              Showing data for: {format(selectedDate, 'dd MMMM yyyy')}
            </div>
          )}
        </div>

        {loading && stocks.length === 0 ? (
          <div className="loading">
            <div className="loader"></div>
            <p>Loading market data...</p>
          </div>
        ) : stocks.length > 0 ? (
          <div className="table-container">
            <table className="stock-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('symbol')}>
                    Symbol {sortConfig.key === 'symbol' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('name')}>
                    Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('open')}>
                    Open {sortConfig.key === 'open' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('high')}>
                    High {sortConfig.key === 'high' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('low')}>
                    Low {sortConfig.key === 'low' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('price')}>
                    Close {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Change</th>
                  <th onClick={() => handleSort('volume')}>
                    Volume {sortConfig.key === 'volume' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Chart</th>
                </tr>
              </thead>
              <tbody>
                {sortedStocks.map((stock) => {
                  const confidence = calculateConfidence(stock)
                  const confidenceClass = `confidence-${confidence}`
                  const isSelected = selectedStock?.symbol === stock.symbol
                  const rowClassName = `stock-row ${confidenceClass} ${isSelected ? 'selected' : ''}`
                  
                  return (
                    <React.Fragment key={stock.symbol}>
                      <tr 
                        className={rowClassName}
                      >
                        <td className="symbol-cell">
                          <strong>{stock.symbol}</strong>
                        </td>
                        <td className="name-cell">{stock.name}</td>
                        <td className="open-cell">
                          {formatNumber(stock.open, stock.symbol)}
                        </td>
                        <td className="high-cell">{formatNumber(stock.high, stock.symbol)}</td>
                        <td className="low-cell">{formatNumber(stock.low, stock.symbol)}</td>
                        <td className="price-cell">
                          {formatNumber(stock.price, stock.symbol)}
                        </td>
                        <td className="change-cell">
                          <div className={`change-badge ${(stock.change ?? 0) >= 0 ? 'positive' : 'negative'}`}>
                            {(stock.change ?? 0) >= 0 ? (
                              <TrendingUp size={14} />
                            ) : (
                              <TrendingDown size={14} />
                            )}
                            <span>{formatNumber(Math.abs(stock.change ?? 0), stock.symbol)}</span>
                            <span className="percent">
                              {(stock.changePercent ?? 0) >= 0 ? '+' : ''}{(stock.changePercent ?? 0).toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="volume-cell">{formatVolume(stock.volume)}</td>
                        <td className="chart-cell">
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <TradingSignals stock={stock} />
                            <button
                              className="chart-btn"
                              onClick={() => {
                                setSelectedStock(stock)
                                setShowAllChartsView(false)
                              }}
                              title="View chart in full screen"
                            >
                              <BarChart3 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">
            <p>No stocks available. Add stocks to your watchlist!</p>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#718096' }}>
              If stocks are in your watchlist, check the browser console (F12) for API errors.
            </p>
          </div>
        )}
      </div>

      {/* Full-screen view for all charts */}
      {showAllChartsView && sortedStocks.length > 0 && (
        <div className="chart-panel" style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#0a0e27',
          zIndex: 1000,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '2rem',
            borderBottom: '1px solid #1e3a5f',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            background: '#0a0e27',
            zIndex: 1001
          }}>
            <h2 style={{ color: '#fff', margin: 0, fontSize: '1.5rem' }}>
              All Stock Charts ({sortedStocks.length})
            </h2>
            <button
              onClick={() => setShowAllChartsView(false)}
              style={{
                background: 'transparent',
                border: '1px solid #ff6b6b',
                color: '#ff6b6b',
                borderRadius: '6px',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ff6b6b'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#ff6b6b'
              }}
            >
              Close All Charts
            </button>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(900px, 1fr))',
            gap: '2rem',
            padding: '2rem',
            maxWidth: '1800px',
            margin: '0 auto'
          }} className="all-charts-grid">
            {sortedStocks.map((stock) => (
              <div
                key={stock.symbol}
                style={{
                  background: '#141a2e',
                  border: '1px solid #1e3a5f',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '700px',
                  height: 'auto'
                }}
              >
                <div style={{
                  marginBottom: '1rem',
                  borderBottom: '1px solid #1e3a5f',
                  paddingBottom: '1rem'
                }}>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                    {stock.symbol}
                  </h3>
                  <p style={{ color: '#a0aec0', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                    {stock.name}
                  </p>
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#718096' }}>
                      Price: <span style={{ color: '#fff', fontWeight: 600 }}>{formatNumber(stock.price, stock.symbol)}</span>
                    </span>
                    <span style={{ color: '#718096' }}>
                      Change: <span style={{ 
                        color: (stock.change ?? 0) >= 0 ? '#00d4aa' : '#ff6b6b',
                        fontWeight: 600
                      }}>
                        {(stock.change ?? 0) >= 0 ? '+' : ''}{((stock.changePercent ?? 0)).toFixed(2)}%
                      </span>
                    </span>
                    <span style={{ color: '#718096' }}>
                      Volume: <span style={{ color: '#fff', fontWeight: 600 }}>{formatVolume(stock.volume)}</span>
                    </span>
                  </div>
                </div>
                <div style={{ flex: 1, minHeight: '500px', width: '100%', position: 'relative' }}>
                  <StockChart symbol={stock.symbol} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Single stock full-screen chart */}
      {selectedStock && !showAllChartsView && (
        <div className="chart-panel">
          <div className="chart-header">
            <div>
              <h3>{selectedStock.symbol}</h3>
              <p className="chart-subtitle">{selectedStock.name}</p>
            </div>
            <button
              className="close-btn"
              onClick={() => setSelectedStock(null)}
            >
              ×
            </button>
          </div>
          <StockChart symbol={selectedStock.symbol} />
        </div>
      )}
    </div>
  )
}

export default StockTable
