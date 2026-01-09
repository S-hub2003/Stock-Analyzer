import React, { createContext, useState, useEffect, useContext } from 'react'
import { getStockQuote, getStockQuoteForDate } from '../services/stockApi'

const StockContext = createContext()

export const StockProvider = ({ children }) => {
  const [stocks, setStocks] = useState([])
  const [watchlist, setWatchlist] = useState([
    // Stocks sorted alphabetically
    'ABB.NS', // ABB India
    'ACC.NS', // ACC
    'ADANIENT.NS', // Adani Enterprise
    'ADANIGREEN.NS', // Adani Green
    'ADANIPORTS.NS', // Adani Ports
    'AMBUJACEM.NS', // Ambuja Cements
    'ANGELONE.NS', // Angel One
    'APOLLOHOSP.NS', // Apollo Hospital
    'APOLLOTYRE.NS', // Apollo Tyre
    'ASHOKLEY.NS', // Ashok Leyland
    'ASIANPAINT.NS', // Asian Paints
    'ATGL.NS', // Adani Total Gas
    'AXISBANK.NS', // Axis Bank
    'BAJFINANCE.NS', // Bajaj Finance
    'BANKBARODA.NS', // Bank Of Baroda
    'BANKINDIA.NS', // Bank Of India
    'BDL.NS', // Bharat Dynamic
    'BHARATFORG.NS', // Bharat Forge
    'BHARATRAS.NS', // Bharat Rasayan
    'BHARTIARTL.NS', // Bharti Airtel
    'BOSCHLTD.NS', // Bosch
    'BRITANNIA.NS', // Britannia
    'CANBK.NS', // Canara Bank
    'CGPOWER.NS', // CG Power
    'CIPLA.NS', // Cipla
    'COCHINSHIP.NS', // Cochin Shipyard
    'CONCOR.NS', // CONCOR
    'CROMPTON.NS', // Crompton
    'DIXON.NS', // Dixon Tech
    'DLF.NS', // DLF
    'EICHERMOT.NS', // Eicher
    'EXIDEIND.NS', // Exide
    'GLENMARK.NS', // Glenmark
    'GODREJPROP.NS', // Godrej Prop
    'GRSE.NS', // Garden Reach
    'HAL.NS', // HAL
    'HAVELLS.NS', // Havells
    'HCLTECH.NS', // HCL
    'HDFCBANK.NS', // HDFC Bank
    'HDFCLIFE.NS', // HDFC Life
    'HEROMOTOCO.NS', // Hero Moto Corp
    'HINDALCO.NS', // Hindalco
    'HINDUNILVR.NS', // Hindustan Lever
    'ICICIBANK.NS', // ICICI Bank
    'IEX.NS', // IEX
    'INDHOTEL.NS', // Indian Hotel
    'INFY.NS', // Infosys
    'IRCTC.NS', // IRCTC
    'IRFC.NS', // IRFC
    'ITC.NS', // ITC
    'JINDALSTEL.NS', // Jindal Steel
    'JIOFIN.NS', // Jio Finance
    'JKTYRE.NS', // JK Tyre
    'JSWSTEEL.NS', // JSW Steel
    'KALYANKJIL.NS', // Kalyan Jewellers
    'LT.NS', // LNT (Larsen & Toubro)
    'LUPIN.NS', // Lupin
    'MANKIND.NS', // Mankind
    'MOTHERSON.NS', // Samvardhana Motherson
    'NESTLEIND.NS', // Nestle
    'OLECTRA.NS', // Olectra
    'PERSISTENT.NS', // Persistent
    'PFC.NS', // Power Finance
    'PNB.NS', // PNB
    'POLYCAB.NS', // Polycab
    'POWERGRID.NS', // Power Grid
    'PRESTIGE.NS', // Prestige Estate
    'RECLTD.NS', // REC
    'RELIANCE.NS', // Reliance
    'RVNL.NS', // Rail Vikas
    'SBICARD.NS', // SBI Card
    'SBILIFE.NS', // SBI Life
    'SBIN.NS', // SBI Bank / SBI
    'SHRIRAMFIN.NS', // Shri Ram Finance
    'SIEMENS.NS', // Siemens
    'SUZLON.NS', // Suzlon
    'SUNPHARMA.NS', // Sun Pharma
    'TATACHEM.NS', // TATA Chemicals
    'TATACONSUM.NS', // TATA Consumer
    'TATAMOTORS.NS', // TATA Motors
    'TATAMTRDVR.NS', // TATA Exile (TATA Motors DVR)
    'TATASTEEL.NS', // TATA Steel
    'TATATECH.NS', // TATA Technologies
    'TCS.NS', // TCS
    'TECHM.NS', // Tech Mahindra
    'TITAGARH.NS', // Titagarh
    'TVSMOTOR.NS', // TVS Motors
    'VEDL.NS', // Vedanta
    'VOLTAS.NS', // Voltas
    // Indices (sorted alphabetically)
    '^BSESN', // Sensex
    '^NSEBANK', // Nifty Bank
    '^NSEI' // Nifty 50
  ])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null) // null means current/latest data

  const fetchStockData = async (symbol, date = null) => {
    try {
      if (date) {
        const data = await getStockQuoteForDate(symbol, date)
        return data
      } else {
        const data = await getStockQuote(symbol)
        return data
      }
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error)
      return null
    }
  }

  const fetchAllStocks = async (date = null) => {
    setLoading(true)
    try {
      console.log('🔍 Fetching stocks for watchlist:', watchlist, date ? `for date: ${date}` : 'for latest data')
      const stockPromises = watchlist.map(symbol => fetchStockData(symbol, date))
      const results = await Promise.all(stockPromises)
      
      console.log('📊 Fetched results:', results)
      console.log('📊 Results breakdown:', {
        total: results.length,
        null: results.filter(r => r === null).length,
        valid: results.filter(r => r !== null).length
      })
      
      const validStocks = results
        .filter(stock => stock !== null)
        .map(stock => ({
          ...stock,
          change: stock.change !== undefined ? stock.change : 0,
          changePercent: stock.changePercent !== undefined ? stock.changePercent : 0
        }))
      
      console.log('✅ Valid stocks to display:', validStocks.length)
      console.log('✅ Valid stocks data:', validStocks)
      setStocks(validStocks)
      
      if (validStocks.length === 0) {
        console.error('❌ No valid stocks returned!')
        console.error('❌ All results:', results)
        console.error('❌ Check browser console for API errors (CORS, network, etc.)')
      }
    } catch (error) {
      console.error('❌ Error fetching stocks:', error)
      console.error('❌ Error details:', error.message, error.stack)
    } finally {
      setLoading(false)
      console.log('✅ Loading complete. Stocks array length:', stocks.length)
    }
  }

  useEffect(() => {
    fetchAllStocks(selectedDate)
    
    // Only auto-refresh if no date is selected (showing current data)
    if (!selectedDate) {
      const interval = setInterval(() => {
        fetchAllStocks()
      }, 10000) // Update every 10 seconds
      
      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlist, selectedDate])

  const addToWatchlist = (symbol) => {
    if (!watchlist.includes(symbol.toUpperCase())) {
      setWatchlist([...watchlist, symbol.toUpperCase()])
    }
  }

  const removeFromWatchlist = (symbol) => {
    setWatchlist(watchlist.filter(s => s !== symbol))
  }

  const value = {
    stocks,
    watchlist,
    loading,
    selectedDate,
    setSelectedDate,
    addToWatchlist,
    removeFromWatchlist,
    refetch: () => fetchAllStocks(selectedDate)
  }

  return (
    <StockContext.Provider value={value}>
      {children}
    </StockContext.Provider>
  )
}

export const useStock = () => {
  const context = useContext(StockContext)
  if (!context) {
    throw new Error('useStock must be used within StockProvider')
  }
  return context
}
