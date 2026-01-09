import React, { useState } from 'react'
import { format, isSameDay } from 'date-fns'
import DateCalendar from './DateCalendar'
import { Calendar, X } from 'lucide-react'
import './PreviousRecords.css'

const PreviousRecords = ({ chartData, symbol }) => {
  const [selectedDate, setSelectedDate] = useState(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [filterMode, setFilterMode] = useState('all') // 'all', 'before', 'after', 'on'
  
  const isIndianStock = symbol && symbol.endsWith('.NS')
  const currency = isIndianStock ? '₹' : '$'
  
  // Get available dates from chart data
  const availableDates = chartData.map(d => d.date)

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num)
  }

  const formatVolume = (num) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2) + 'B'
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K'
    }
    return num.toString()
  }

  const formatDate = (date) => {
    try {
      return format(new Date(date), 'dd MMM yyyy')
    } catch {
      return ''
    }
  }

  // Calculate change for each record (comparing with previous day)
  // Reverse first to show most recent first, then calculate changes
  const reversedData = [...chartData].reverse()
  let recordsWithChange = reversedData.map((record, index) => {
    // Compare with the next record (which is the previous day in chronological order)
    const previousPrice = index < reversedData.length - 1 ? reversedData[index + 1].price : record.price
    const change = record.price - previousPrice
    const changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : 0
    return { ...record, change, changePercent }
  })

  // Filter records based on selected date
  if (selectedDate && filterMode !== 'all') {
    recordsWithChange = recordsWithChange.filter(record => {
      const recordDate = new Date(record.date)
      recordDate.setHours(0, 0, 0, 0)
      const selected = new Date(selectedDate)
      selected.setHours(0, 0, 0, 0)
      
      switch (filterMode) {
        case 'on':
          return isSameDay(recordDate, selected)
        case 'before':
          return recordDate < selected
        case 'after':
          return recordDate > selected
        default:
          return true
      }
    })
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setFilterMode('on') // Default to showing records on selected date
    setShowCalendar(false)
  }

  const clearFilter = () => {
    setSelectedDate(null)
    setFilterMode('all')
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="records-error">
        <p>No historical records available</p>
      </div>
    )
  }

  return (
    <div className="previous-records">
      <div className="records-header">
        <div className="header-left">
          <h3>Historical Records</h3>
          <p className="records-subtitle">Showing {recordsWithChange.length} records for {symbol}</p>
        </div>
        <div className="header-controls">
          <div className="calendar-controls">
            <button
              className={`calendar-toggle-btn ${showCalendar ? 'active' : ''}`}
              onClick={() => setShowCalendar(!showCalendar)}
            >
              <Calendar size={18} />
              <span>Calendar</span>
            </button>
            {selectedDate && (
              <div className="filter-info">
                <span className="filter-text">
                  {filterMode === 'on' ? 'On' : filterMode === 'before' ? 'Before' : filterMode === 'after' ? 'After' : 'All'}: {format(selectedDate, 'dd MMM yyyy')}
                </span>
                <button className="clear-filter-btn" onClick={clearFilter}>
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCalendar && (
        <div className="calendar-container">
          <DateCalendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            availableDates={availableDates}
          />
          {selectedDate && (
            <div className="filter-mode-selector">
              <label>Filter:</label>
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Records</option>
                <option value="on">On Selected Date</option>
                <option value="before">Before Selected Date</option>
                <option value="after">After Selected Date</option>
              </select>
            </div>
          )}
        </div>
      )}

      <div className="records-table-wrapper">
        <table className="records-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Open</th>
              <th>High</th>
              <th>Low</th>
              <th>Close</th>
              <th>Change</th>
              <th>Change %</th>
              <th>Volume</th>
            </tr>
          </thead>
          <tbody>
            {recordsWithChange.map((record, idx) => (
              <tr key={idx}>
                <td className="date-cell">{formatDate(record.date)}</td>
                <td className="price-cell">{currency}{formatNumber(record.open)}</td>
                <td className="price-cell high-cell">{currency}{formatNumber(record.high)}</td>
                <td className="price-cell low-cell">{currency}{formatNumber(record.low)}</td>
                <td className="price-cell">{currency}{formatNumber(record.price)}</td>
                <td className={`change-cell ${record.change >= 0 ? 'positive' : 'negative'}`}>
                  {record.change >= 0 ? '+' : ''}{currency}{formatNumber(Math.abs(record.change))}
                </td>
                <td className={`change-percent-cell ${record.changePercent >= 0 ? 'positive' : 'negative'}`}>
                  {record.changePercent >= 0 ? '+' : ''}{record.changePercent.toFixed(2)}%
                </td>
                <td className="volume-cell">{formatVolume(record.volume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PreviousRecords
