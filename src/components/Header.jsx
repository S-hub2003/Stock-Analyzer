import React, { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'
import { getMarketStatus, getCurrentISTTime } from '../utils/marketStatus'
import './Header.css'

const Header = () => {
  const [marketStatus, setMarketStatus] = useState(getMarketStatus())
  const [currentTime, setCurrentTime] = useState(getCurrentISTTime())

  useEffect(() => {
    // Update market status and time every second
    const interval = setInterval(() => {
      setMarketStatus(getMarketStatus())
      setCurrentTime(getCurrentISTTime())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <TrendingUp className="logo-icon" />
          <span className="logo-text">Stock Analyzer</span>
        </div>
        <div className="header-info">
          <div className={`market-status ${marketStatus.isOpen ? 'open' : 'closed'}`}>
            <span className={`status-dot ${marketStatus.isOpen ? 'pulse' : ''}`}></span>
            <div className="status-text">
              <span className="status-message">{marketStatus.message}</span>
              {!marketStatus.isOpen && (
                <span className="status-next">{marketStatus.nextStatus}</span>
              )}
            </div>
            <div className="current-time">IST: {currentTime}</div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
