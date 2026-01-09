import axios from 'axios'
import { isMarketOpen } from '../utils/marketStatus'

// Using yahoo-finance2 API for free stock data
// Try direct API first, fallback to proxy if CORS issues
const API_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart'
const API_PROXY_URL = '/api/yahoo/v8/finance/chart' // Proxy via Vite dev server
const SEARCH_API_URL = 'https://query1.finance.yahoo.com/v1/finance/search'
const SEARCH_PROXY_URL = '/api/yahoo/v1/finance/search' // Proxy for search

// Helper function to extract stock data from historical quotes
const extractStockDataFromQuotes = (symbol, meta, timestamps, quotes) => {
  const closes = quotes.close || []
  const opens = quotes.open || []
  const highs = quotes.high || []
  const lows = quotes.low || []
  const volumes = quotes.volume || []
  
  // Find the most recent non-null closing price (last trading day)
  let lastAvailablePrice = null
  let lastAvailableIndex = -1
  
  for (let i = closes.length - 1; i >= 0; i--) {
    if (closes[i] !== null && closes[i] !== undefined && !isNaN(closes[i])) {
      lastAvailablePrice = closes[i]
      lastAvailableIndex = i
      break
    }
  }
  
  if (!lastAvailablePrice) {
    return null
  }
  
  // Calculate previous close (the day before the last available day)
  let previousClose = null
  
  if (lastAvailableIndex > 0) {
    for (let i = lastAvailableIndex - 1; i >= 0; i--) {
      if (closes[i] !== null && closes[i] !== undefined && !isNaN(closes[i])) {
        previousClose = closes[i]
        break
      }
    }
  }
  
  if (!previousClose || isNaN(previousClose)) {
    previousClose = meta.previousClose || meta.chartPreviousClose || lastAvailablePrice
  }
  
  const change = lastAvailablePrice - previousClose
  const changePercent = previousClose !== 0 && !isNaN(previousClose) ? (change / previousClose) * 100 : 0
  
  const lastOpen = lastAvailableIndex >= 0 && opens[lastAvailableIndex] !== null && !isNaN(opens[lastAvailableIndex])
    ? opens[lastAvailableIndex]
    : (meta.regularMarketOpen || meta.previousClose || lastAvailablePrice)
  
  const lastHigh = lastAvailableIndex >= 0 && highs[lastAvailableIndex] !== null && !isNaN(highs[lastAvailableIndex])
    ? highs[lastAvailableIndex]
    : (meta.regularMarketDayHigh || meta.previousClose || lastAvailablePrice)
  
  const lastLow = lastAvailableIndex >= 0 && lows[lastAvailableIndex] !== null && !isNaN(lows[lastAvailableIndex])
    ? lows[lastAvailableIndex]
    : (meta.regularMarketDayLow || meta.previousClose || lastAvailablePrice)
  
  const lastVolume = lastAvailableIndex >= 0 && volumes[lastAvailableIndex] !== null && !isNaN(volumes[lastAvailableIndex])
    ? volumes[lastAvailableIndex]
    : (meta.regularMarketVolume || 0)
  
  const lastMarketTime = lastAvailableIndex >= 0 && timestamps[lastAvailableIndex]
    ? timestamps[lastAvailableIndex] * 1000
    : (meta.regularMarketTime || Date.now())

  return {
    symbol: symbol.toUpperCase(),
    name: meta.longName || meta.shortName || meta.symbol || symbol,
    price: lastAvailablePrice,
    change: change,
    changePercent: changePercent,
    volume: lastVolume,
    high: lastHigh,
    low: lastLow,
    open: lastOpen,
    previousClose: previousClose,
    marketTime: lastMarketTime
  }
}

// Get real-time stock quote with last available price from Yahoo Finance
export const getStockQuote = async (symbol) => {
  // Try direct API first, fallback to proxy if CORS fails
  let apiUrl = `${API_BASE_URL}/${symbol}?interval=1d&range=1mo&includePrePost=false`
  let useProxy = false
  
  try {
    // Fetch more days of data to get last trading day's price (especially important when market is closed on weekends)
    const response = await axios.get(apiUrl, {
      timeout: 30000, // Increased timeout to 30 seconds for better reliability
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.data || !response.data.chart || !response.data.chart.result || response.data.chart.result.length === 0) {
      console.warn(`[${symbol}] No data returned from API`)
      console.warn(`[${symbol}] Response data:`, response.data)
      return null
    }
    
    const result = response.data.chart.result[0]
    
    if (!result) {
      console.warn(`[${symbol}] No result in chart data`)
      return null
    }
    
    const meta = result.meta || {}
    
    console.log(`[${symbol}] API response received`)
    console.log(`[${symbol}] meta.previousClose: ${meta.previousClose}`)
    console.log(`[${symbol}] meta.chartPreviousClose: ${meta.chartPreviousClose}`)
    console.log(`[${symbol}] Market open: ${isMarketOpen()}`)
    console.log(`[${symbol}] Timestamps count: ${result.timestamp?.length || 0}`)
    console.log(`[${symbol}] Quotes available: ${!!result.indicators?.quote?.[0]}`)
    
    // Get historical quotes from the result
    const timestamps = result.timestamp || []
    const quotes = result.indicators && result.indicators.quote && result.indicators.quote[0] ? result.indicators.quote[0] : {}
    
    // Check if market is closed first
    const marketOpen = isMarketOpen()
    
    // When market is closed, prioritize metadata for previous close
    const previousCloseFromMeta = meta.previousClose || meta.chartPreviousClose || meta.regularMarketPreviousClose
    
    // Extract stock data from quotes - this already gets yesterday's closing price when market is closed
    let stockData = extractStockDataFromQuotes(symbol, meta, timestamps, quotes)
    
    // If quotes extraction failed, try metadata fallback
    if (!stockData) {
      // Quotes extraction failed and market is open - try metadata fallback
      console.warn(`[${symbol}] No valid price data found in quotes, trying metadata fallback`)
      
      if (previousCloseFromMeta && !isNaN(previousCloseFromMeta)) {
        // Try to get the day before previous close for change calculation
        let dayBeforeClose = previousCloseFromMeta
        
        if (quotes.close && quotes.close.length > 0) {
          const closes = quotes.close
          for (let i = closes.length - 1; i >= 0; i--) {
            if (closes[i] !== null && closes[i] !== undefined && !isNaN(closes[i]) && closes[i] !== previousCloseFromMeta) {
              dayBeforeClose = closes[i]
              break
            }
          }
        }
        
        const change = previousCloseFromMeta - dayBeforeClose
        const changePercent = dayBeforeClose !== 0 && dayBeforeClose !== previousCloseFromMeta ? (change / dayBeforeClose) * 100 : 0
        
        stockData = {
          symbol: symbol.toUpperCase(),
          name: meta.longName || meta.shortName || meta.symbol || symbol,
          price: previousCloseFromMeta,
          change: change,
          changePercent: changePercent,
          volume: meta.regularMarketVolume || meta.postMarketVolume || 0,
          high: meta.regularMarketDayHigh || meta.postMarketDayHigh || previousCloseFromMeta,
          low: meta.regularMarketDayLow || meta.postMarketDayLow || previousCloseFromMeta,
          open: meta.regularMarketOpen || meta.postMarketOpen || previousCloseFromMeta,
          previousClose: dayBeforeClose !== previousCloseFromMeta ? dayBeforeClose : previousCloseFromMeta,
          marketTime: meta.regularMarketTime || meta.postMarketTime || (timestamps && timestamps.length > 0 ? timestamps[timestamps.length - 1] * 1000 : Date.now())
        }
      } else {
        console.warn(`[${symbol}] No previous close found in metadata and quotes extraction failed`)
        return null
      }
    }
    
    // Final check - ensure we have stockData before returning
    if (!stockData) {
      console.error(`[${symbol}] Failed to extract stock data from both quotes and metadata`)
      return null
    }
    
    // If market is open, prefer current market price
    if (marketOpen && meta.regularMarketPrice && !isNaN(meta.regularMarketPrice)) {
      stockData.price = meta.regularMarketPrice
      // Recalculate change if we have previous close
      if (stockData.previousClose && stockData.previousClose !== meta.regularMarketPrice) {
        stockData.change = meta.regularMarketPrice - stockData.previousClose
        stockData.changePercent = stockData.previousClose !== 0 ? (stockData.change / stockData.previousClose) * 100 : 0
      }
    } else if (!marketOpen) {
      // Market is closed - stockData.price already contains yesterday's closing price from extractStockDataFromQuotes
      // This is correct - we want to show yesterday's close when market is closed today
      console.log(`[${symbol}] Market closed: Showing yesterday's closing price: ${stockData.price}`)
    }
    
    console.log(`[${symbol}] Returning stockData:`, {
      symbol: stockData.symbol,
      price: stockData.price,
      change: stockData.change,
      changePercent: stockData.changePercent,
      marketOpen: marketOpen
    })
    
    return stockData
  } catch (error) {
    console.error(`❌ Error fetching quote for ${symbol}:`, error.message || error)
    
    // Log detailed error information
    if (error.code === 'ECONNABORTED') {
      console.error(`⏱️ Request timeout for ${symbol}`)
    } else if (error.response) {
      console.error(`📡 HTTP Error ${error.response.status} for ${symbol}:`, error.response.data)
    } else if (error.request) {
      console.error(`🌐 Network Error for ${symbol}:`, 'No response received from server. Check CORS or network connection.')
      // Try proxy if CORS/network error
      console.log(`🔄 Trying proxy for ${symbol} due to CORS/network error...`)
      try {
        const proxyUrl = `${API_PROXY_URL}/${symbol}?interval=1d&range=1mo&includePrePost=false`
        const proxyResponse = await axios.get(proxyUrl, {
          timeout: 30000, // Increased timeout to 30 seconds
          headers: {
            'Accept': 'application/json'
          }
        })
        
        if (proxyResponse.data && proxyResponse.data.chart && proxyResponse.data.chart.result && proxyResponse.data.chart.result.length > 0) {
          const result = proxyResponse.data.chart.result[0]
          const meta = result.meta || {}
          const timestamps = result.timestamp || []
          const quotes = result.indicators && result.indicators.quote && result.indicators.quote[0] ? result.indicators.quote[0] : {}
          
          let stockData = extractStockDataFromQuotes(symbol, meta, timestamps, quotes)
          
          if (!stockData) {
            const previousClose = meta.previousClose || meta.chartPreviousClose
            if (previousClose && !isNaN(previousClose)) {
              stockData = {
                symbol: symbol.toUpperCase(),
                name: meta.longName || meta.shortName || meta.symbol || symbol,
                price: previousClose,
                change: 0,
                changePercent: 0,
                volume: meta.regularMarketVolume || 0,
                high: previousClose,
                low: previousClose,
                open: previousClose,
                previousClose: previousClose,
                marketTime: meta.regularMarketTime || Date.now()
              }
            }
          }
          
          if (stockData) {
            console.log(`✅ Successfully fetched via proxy for ${symbol}`)
            const marketOpen = isMarketOpen()
            if (!marketOpen && (meta.previousClose || meta.chartPreviousClose)) {
              stockData.price = meta.previousClose || meta.chartPreviousClose
            }
            return stockData
          }
        }
      } catch (proxyError) {
        console.error(`❌ Proxy also failed for ${symbol}:`, proxyError.message)
      }
    } else {
      console.error(`❓ Unknown Error for ${symbol}:`, error.message)
    }
    
      // Fallback: Try to get historical data (previous closing prices)
    try {
      console.log(`🔄 Attempting to fetch previous closing price for ${symbol}...`)
      const historyResponse = await axios.get(`${API_BASE_URL}/${symbol}?interval=1d&range=1mo&includePrePost=false`, {
        timeout: 30000,
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (historyResponse.data && historyResponse.data.chart && historyResponse.data.chart.result && historyResponse.data.chart.result.length > 0) {
        const result = historyResponse.data.chart.result[0]
        const meta = result.meta || {}
        const timestamps = result.timestamp || []
        const quotes = result.indicators && result.indicators.quote && result.indicators.quote[0] ? result.indicators.quote[0] : {}
        
        let stockData = extractStockDataFromQuotes(symbol, meta, timestamps, quotes)
        if (!stockData) {
          // Try metadata fallback
          const previousClose = meta.previousClose || meta.chartPreviousClose
          if (previousClose && !isNaN(previousClose)) {
            stockData = {
              symbol: symbol.toUpperCase(),
              name: meta.longName || meta.shortName || meta.symbol || symbol,
              price: previousClose,
              change: 0,
              changePercent: 0,
              volume: meta.regularMarketVolume || 0,
              high: previousClose,
              low: previousClose,
              open: previousClose,
              previousClose: previousClose,
              marketTime: meta.regularMarketTime || Date.now()
            }
          }
        }
        if (stockData) {
          console.log(`✅ Successfully fetched previous closing price for ${symbol}`)
          // Apply market closed logic
          const marketOpen = isMarketOpen()
          if (!marketOpen && (meta.previousClose || meta.chartPreviousClose)) {
            const lastTradingClose = meta.previousClose || meta.chartPreviousClose
            stockData.price = lastTradingClose
          }
          return stockData
        }
      }
    } catch (fallbackError) {
      console.error(`❌ Fallback also failed for ${symbol}:`, fallbackError.message)
      if (fallbackError.response) {
        console.error(`📡 Fallback HTTP Error ${fallbackError.response.status}`)
      } else if (fallbackError.request) {
        console.error(`🌐 Fallback Network Error: CORS or connection issue`)
      }
    }
    
    return null
  }
}

// Get stock quote for a specific date
export const getStockQuoteForDate = async (symbol, targetDate) => {
  try {
    // Calculate the range needed to include the target date
    const today = new Date()
    const daysDiff = Math.floor((today - targetDate) / (1000 * 60 * 60 * 24))
    const range = daysDiff <= 5 ? '5d' : daysDiff <= 30 ? '1mo' : daysDiff <= 90 ? '3mo' : '1y'
    
    const response = await axios.get(`${API_BASE_URL}/${symbol}?interval=1d&range=${range}&includePrePost=false`, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.data || !response.data.chart || !response.data.chart.result || response.data.chart.result.length === 0) {
      return null
    }
    
    const result = response.data.chart.result[0]
    const meta = result.meta || {}
    const timestamps = result.timestamp || []
    const quotes = result.indicators && result.indicators.quote && result.indicators.quote[0] ? result.indicators.quote[0] : {}
    
    // Find data for the target date (or closest previous trading day)
    const targetTimestamp = Math.floor(targetDate.getTime() / 1000)
    let closestIndex = -1
    let closestTimestamp = null
    
    for (let i = timestamps.length - 1; i >= 0; i--) {
      const timestamp = timestamps[i]
      if (timestamp <= targetTimestamp) {
        closestIndex = i
        closestTimestamp = timestamp
        break
      }
    }
    
    if (closestIndex === -1) {
      // No data found before or on target date
      return null
    }
    
    // Extract data for the closest date
    const closes = quotes.close || []
    const opens = quotes.open || []
    const highs = quotes.high || []
    const lows = quotes.low || []
    const volumes = quotes.volume || []
    
    const closePrice = closes[closestIndex]
    const openPrice = opens[closestIndex]
    const highPrice = highs[closestIndex]
    const lowPrice = lows[closestIndex]
    const volume = volumes[closestIndex] || 0
    
    if (closePrice === null || closePrice === undefined || isNaN(closePrice)) {
      return null
    }
    
    // Get previous close (day before)
    let previousClose = null
    if (closestIndex > 0) {
      for (let i = closestIndex - 1; i >= 0; i--) {
        if (closes[i] !== null && closes[i] !== undefined && !isNaN(closes[i])) {
          previousClose = closes[i]
          break
        }
      }
    }
    
    if (!previousClose || isNaN(previousClose)) {
      previousClose = meta.previousClose || meta.chartPreviousClose || closePrice
    }
    
    const change = closePrice - previousClose
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0
    
    return {
      symbol: symbol.toUpperCase(),
      name: meta.longName || meta.shortName || meta.symbol || symbol,
      price: closePrice,
      change: change,
      changePercent: changePercent,
      volume: volume,
      high: highPrice || closePrice,
      low: lowPrice || closePrice,
      open: openPrice || closePrice,
      previousClose: previousClose,
      marketTime: closestTimestamp * 1000,
      dataDate: new Date(closestTimestamp * 1000)
    }
  } catch (error) {
    console.error(`Error fetching quote for ${symbol} on date ${targetDate}:`, error)
    return null
  }
}

// Get stock history for charts with OHLC data
export const getStockHistory = async (symbol, range = '1mo') => {
  try {
    // Use intraday intervals for 1d range to show market hours
    let interval = '1d'
    if (range === '1d') {
      interval = '15m' // 15-minute intervals for intraday data
    } else if (range === '5d') {
      interval = '1h' // 1-hour intervals for 5-day view
    }
    
    let response
    try {
      // Try direct API first
      response = await axios.get(`${API_BASE_URL}/${symbol}?interval=${interval}&range=${range}`, {
        timeout: 30000,
        headers: {
          'Accept': 'application/json'
        }
      })
    } catch (error) {
      // If CORS/network error, try proxy
      if (error.request || error.code === 'ERR_NETWORK') {
        console.log(`[${symbol}] Using proxy for chart data due to CORS error`)
        response = await axios.get(`${API_PROXY_URL}/${symbol}?interval=${interval}&range=${range}`, {
          timeout: 30000,
          headers: {
            'Accept': 'application/json'
          }
        })
      } else {
        throw error
      }
    }
    
    if (response.data && response.data.chart && response.data.chart.result && response.data.chart.result.length > 0) {
      const result = response.data.chart.result[0]
      const timestamps = result.timestamp || []
      const quote = result.indicators.quote[0] || {}
      
      const closes = quote.close || []
      const opens = quote.open || []
      const highs = quote.high || []
      const lows = quote.low || []
      const volumes = quote.volume || []
      
      return timestamps.map((ts, idx) => ({
        date: new Date(ts * 1000),
        price: closes[idx],
        open: opens[idx],
        high: highs[idx],
        low: lows[idx],
        volume: volumes[idx] || 0
      })).filter(item => 
        item.price !== null && 
        item.price !== undefined &&
        item.open !== null && 
        item.open !== undefined &&
        item.high !== null && 
        item.high !== undefined &&
        item.low !== null && 
        item.low !== undefined
      )
    }
    return []
  } catch (error) {
    console.error(`Error fetching history for ${symbol}:`, error.message || error)
    
    // Try proxy if CORS/network error
    if (error.request || error.code === 'ERR_NETWORK' || !error.response) {
      try {
        console.log(`[${symbol}] Trying proxy for chart history...`)
        // Use intraday intervals for 1d range
        const interval = range === '1d' ? '15m' : (range === '5d' ? '1h' : '1d')
        const proxyResponse = await axios.get(`${API_PROXY_URL}/${symbol}?interval=${interval}&range=${range}`, {
          timeout: 30000,
          headers: {
            'Accept': 'application/json'
          }
        })
        
        if (proxyResponse.data && proxyResponse.data.chart && proxyResponse.data.chart.result && proxyResponse.data.chart.result.length > 0) {
          const result = proxyResponse.data.chart.result[0]
          const timestamps = result.timestamp || []
          const quote = result.indicators.quote[0] || {}
          
          const closes = quote.close || []
          const opens = quote.open || []
          const highs = quote.high || []
          const lows = quote.low || []
          const volumes = quote.volume || []
          
          return timestamps.map((ts, idx) => ({
            date: new Date(ts * 1000),
            price: closes[idx],
            open: opens[idx],
            high: highs[idx],
            low: lows[idx],
            volume: volumes[idx] || 0
          })).filter(item => 
            item.price !== null && 
            item.price !== undefined &&
            item.open !== null && 
            item.open !== undefined &&
            item.high !== null && 
            item.high !== undefined &&
            item.low !== null && 
            item.low !== undefined
          )
        }
      } catch (proxyError) {
        console.error(`[${symbol}] Proxy also failed for chart history:`, proxyError.message)
      }
    }
    
    return []
  }
}

// Search for stock symbols - autocomplete/suggestions
export const searchStockSymbols = async (query) => {
  if (!query || query.length < 2) {
    return []
  }

  try {
    const searchUrl = `${SEARCH_API_URL}?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`
    
    try {
      const response = await axios.get(searchUrl, {
        timeout: 30000,
        headers: {
          'Accept': 'application/json'
        }
      })

      if (response.data && response.data.quotes && Array.isArray(response.data.quotes)) {
        return response.data.quotes
          .filter(quote => quote.symbol && quote.longname)
          .map(quote => ({
            symbol: quote.symbol,
            name: quote.longname || quote.shortname || quote.symbol,
            exchange: quote.exchange || '',
            quoteType: quote.quoteType || 'EQUITY'
          }))
          .slice(0, 10) // Limit to 10 results
      }
      return []
    } catch (error) {
      // Try proxy if CORS/network error
      if (error.request || error.code === 'ERR_NETWORK' || !error.response) {
        try {
          const proxyResponse = await axios.get(`${SEARCH_PROXY_URL}?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`, {
            timeout: 30000,
            headers: {
              'Accept': 'application/json'
            }
          })

          if (proxyResponse.data && proxyResponse.data.quotes && Array.isArray(proxyResponse.data.quotes)) {
            return proxyResponse.data.quotes
              .filter(quote => quote.symbol && quote.longname)
              .map(quote => ({
                symbol: quote.symbol,
                name: quote.longname || quote.shortname || quote.symbol,
                exchange: quote.exchange || '',
                quoteType: quote.quoteType || 'EQUITY'
              }))
              .slice(0, 10)
          }
        } catch (proxyError) {
          console.error('Search proxy also failed:', proxyError.message)
        }
      }
      return []
    }
  } catch (error) {
    console.error('Error searching stocks:', error)
    return []
  }
}

// Mock data fallback for demo
const createMockData = (symbol) => {
  const basePrice = 100 + Math.random() * 500
  const change = (Math.random() - 0.5) * 20
  const names = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla, Inc.',
    'META': 'Meta Platforms Inc.',
    'NVDA': 'NVIDIA Corporation',
    'NFLX': 'Netflix, Inc.'
  }
  
  return {
    symbol: symbol.toUpperCase(),
    name: names[symbol.toUpperCase()] || symbol,
    price: basePrice,
    change: change,
    changePercent: (change / basePrice) * 100,
    volume: Math.floor(Math.random() * 10000000),
    high: basePrice + Math.random() * 10,
    low: basePrice - Math.random() * 10,
    open: basePrice - change,
    previousClose: basePrice - change,
    marketTime: Date.now()
  }
}
