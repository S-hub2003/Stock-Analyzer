import React from 'react'
import Header from './components/Header'
import Watchlist from './components/Watchlist'
import StockTable from './components/StockTable'
import { StockProvider } from './context/StockContext'
import './App.css'

function App() {
  return (
    <StockProvider>
      <div className="app">
        <Header />
        <div className="app-body">
          <Watchlist />
          <StockTable />
        </div>
      </div>
    </StockProvider>
  )
}

export default App
