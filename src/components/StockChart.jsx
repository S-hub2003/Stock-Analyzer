import React, { useState, useEffect, useMemo } from 'react'
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { getStockHistory } from '../services/stockApi'
import { format, addDays, addMonths } from 'date-fns'
import PreviousRecords from './PreviousRecords'
import { History, BarChart3, TrendingUp, TrendingDown, AlertCircle, Lightbulb, Target } from 'lucide-react'
import './StockChart.css'

const StockChart = ({ symbol }) => {
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('1mo')
  const [chartType, setChartType] = useState('line') // 'line', 'area', 'candlestick'
  const [viewMode, setViewMode] = useState('chart') // 'chart' or 'records'
  const [hoveredCandle, setHoveredCandle] = useState(null) // { data, x, y }

  const isIndianStock = symbol && symbol.endsWith('.NS')
  const currency = isIndianStock ? '₹' : '$'

  // Calculate technical analysis and suggestions
  const chartAnalysis = useMemo(() => {
    if (!chartData || chartData.length < 2) return null

    const prices = chartData.map(d => d.price).filter(p => p != null)
    const volumes = chartData.map(d => d.volume).filter(v => v != null)
    const currentPrice = prices[prices.length - 1]
    const previousPrice = prices[prices.length - 2]
    const firstPrice = prices[0]
    
    // Calculate trends
    const priceChange = currentPrice - previousPrice
    const priceChangePercent = ((currentPrice - previousPrice) / previousPrice) * 100
    const totalChangePercent = ((currentPrice - firstPrice) / firstPrice) * 100
    
    // Support and Resistance levels
    const highs = chartData.map(d => d.high).filter(h => h != null)
    const lows = chartData.map(d => d.low).filter(l => l != null)
    const resistance = Math.max(...highs)
    const support = Math.min(...lows)
    
    // Volume analysis
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length
    const currentVolume = volumes[volumes.length - 1] || 0
    const volumeRatio = currentVolume / avgVolume
    
    // Trend direction
    const recentPrices = prices.slice(-5)
    const isUptrend = recentPrices[recentPrices.length - 1] > recentPrices[0]
    const trendStrength = Math.abs(totalChangePercent)
    
    // Volatility
    const priceRange = Math.max(...prices) - Math.min(...prices)
    const volatilityPercent = (priceRange / currentPrice) * 100
    
    // Generate suggestions
    const suggestions = []
    
    if (priceChangePercent > 2) {
      suggestions.push({
        type: 'buy',
        icon: TrendingUp,
        message: `Strong upward momentum (+${priceChangePercent.toFixed(2)}%). Consider buying on dips.`,
        priority: 'high'
      })
    } else if (priceChangePercent < -2) {
      suggestions.push({
        type: 'warning',
        icon: AlertCircle,
        message: `Significant decline (${priceChangePercent.toFixed(2)}%). Tighten stop-loss or consider exit.`,
        priority: 'high'
      })
    }
    
    if (currentPrice <= support * 1.02) {
      suggestions.push({
        type: 'buy',
        icon: TrendingUp,
        message: `Near support level (${currency}${support.toFixed(2)}). Potential buying opportunity.`,
        priority: 'medium'
      })
    }
    
    if (currentPrice >= resistance * 0.98) {
      suggestions.push({
        type: 'sell',
        icon: TrendingDown,
        message: `Approaching resistance (${currency}${resistance.toFixed(2)}). Consider taking profits.`,
        priority: 'medium'
      })
    }
    
    if (volumeRatio > 1.5) {
      suggestions.push({
        type: 'info',
        icon: Lightbulb,
        message: `High volume activity (${volumeRatio.toFixed(1)}x average). Strong interest detected.`,
        priority: 'low'
      })
    }
    
    if (volatilityPercent > 10) {
      suggestions.push({
        type: 'warning',
        icon: AlertCircle,
        message: `High volatility (${volatilityPercent.toFixed(1)}%). Trade with caution and use stop-loss.`,
        priority: 'medium'
      })
    }
    
    if (isUptrend && trendStrength > 5) {
      suggestions.push({
        type: 'buy',
        icon: TrendingUp,
        message: `Strong uptrend (+${totalChangePercent.toFixed(2)}% over period). Momentum suggests continued growth.`,
        priority: 'medium'
      })
    } else if (!isUptrend && trendStrength > 5) {
      suggestions.push({
        type: 'sell',
        icon: TrendingDown,
        message: `Downtrend (${totalChangePercent.toFixed(2)}%). Wait for reversal signals before entry.`,
        priority: 'medium'
      })
    }

    // Calculate future trend predictions
    const calculateFutureTrend = () => {
      if (prices.length < 5) return null

      // Calculate moving averages for trend analysis
      const shortMA = prices.slice(-5).reduce((a, b) => a + b, 0) / 5
      const longMA = prices.length >= 10 
        ? prices.slice(-10).reduce((a, b) => a + b, 0) / 10
        : shortMA
      
      // Calculate momentum
      const recentChange = (prices[prices.length - 1] - prices[prices.length - 5]) / 5
      
      // Determine prediction periods based on range
      let predictionDays = 5
      if (range === '1mo' || range === '3mo') predictionDays = 5
      else if (range === '1y') predictionDays = 10
      else if (range === '5d') predictionDays = 2
      else predictionDays = 1

      // Generate future predictions
      const predictions = []
      const lastDate = chartData[chartData.length - 1].date
      const lastPrice = currentPrice
      
      // Calculate trend slope
      const trendSlope = (currentPrice - prices[Math.max(0, prices.length - 10)]) / 10
      
      // Adjust prediction based on momentum, trend, and volatility
      let predictedPrice = lastPrice
      const momentumFactor = recentChange > 0 ? 1.1 : 0.9 // Accelerate trends
      const volatilityAdjustment = volatilityPercent / 100 * 0.5 // Reduce volatility impact
      
      for (let i = 1; i <= predictionDays; i++) {
        // Simple linear projection with momentum
        const baseChange = trendSlope * momentumFactor
        // Deterministic volatility simulation using index (sine wave for natural variation)
        const volatilityFactor = Math.sin(i * 0.5) * volatilityPercent * lastPrice / 100 * volatilityAdjustment
        
        predictedPrice = predictedPrice + baseChange + volatilityFactor
        
        // Apply support/resistance boundaries
        if (predictedPrice < support * 0.95) {
          predictedPrice = support * 0.95 + (predictedPrice - support * 0.95) * 0.3 // Bounce effect
        }
        if (predictedPrice > resistance * 1.05) {
          predictedPrice = resistance * 1.05 - (predictedPrice - resistance * 1.05) * 0.3 // Resistance effect
        }
        
        // Calculate future date
        let futureDate
        if (range === '1d') {
          futureDate = addDays(new Date(lastDate), i)
        } else if (range === '5d') {
          futureDate = addDays(new Date(lastDate), i)
        } else if (range === '1mo' || range === '3mo') {
          futureDate = addDays(new Date(lastDate), i)
        } else {
          futureDate = addMonths(new Date(lastDate), i)
        }
        
        predictions.push({
          date: futureDate,
          price: predictedPrice,
          isPredicted: true
        })
      }

      // Calculate target prices
      const bullishTarget = isUptrend 
        ? currentPrice * (1 + trendStrength / 100 * 0.5)
        : currentPrice * (1 + 0.02) // Conservative 2% if not uptrend
      const bearishTarget = !isUptrend
        ? currentPrice * (1 - Math.abs(totalChangePercent) / 100 * 0.3)
        : currentPrice * (1 - 0.02) // Conservative 2% if uptrend
      const neutralTarget = currentPrice

      return {
        predictions,
        bullishTarget,
        bearishTarget,
        neutralTarget,
        confidence: trendStrength > 10 ? 'high' : trendStrength > 5 ? 'medium' : 'low'
      }
    }

    const futureTrend = calculateFutureTrend()

    return {
      currentPrice,
      priceChange,
      priceChangePercent,
      totalChangePercent,
      resistance,
      support,
      currentVolume,
      volumeRatio,
      isUptrend,
      trendStrength,
      volatilityPercent,
      suggestions,
      futureTrend
    }
  }, [chartData, currency, range])

  useEffect(() => {
    const fetchChartData = async () => {
      if (!symbol) return
      
      setLoading(true)
      try {
        console.log(`[Chart ${symbol}] Fetching chart data for range: ${range}`)
        const data = await getStockHistory(symbol, range)
        console.log(`[Chart ${symbol}] Received ${data.length} data points`)
        setChartData(data)
        if (data.length === 0) {
          console.warn(`[Chart ${symbol}] No chart data received!`)
        }
      } catch (error) {
        console.error(`[Chart ${symbol}] Error fetching chart data:`, error)
      } finally {
        setLoading(false)
      }
    }

    if (symbol) {
      fetchChartData()
    }
  }, [symbol, range])

  if (loading) {
    return (
      <div className="chart-loading">
        <div className="loader"></div>
      </div>
    )
  }

  const formatChartDate = (date) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date)
      if (isNaN(dateObj.getTime())) {
        return ''
      }
      
      if (range === '1d') {
        // Show full time with hours and minutes for intraday data
        return format(dateObj, 'HH:mm')
      } else if (range === '5d') {
        // Show date and time for 5-day view
        return format(dateObj, 'MMM dd, HH:mm')
      } else if (range === '1mo' || range === '3mo') {
        return format(dateObj, 'MMM dd')
      } else {
        return format(dateObj, 'MMM yyyy')
      }
    } catch {
      return ''
    }
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const isCandlestick = chartType === 'candlestick'
      const formattedPrice = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(data.price)
      const formattedOpen = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(data.open)
      const formattedHigh = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(data.high)
      const formattedLow = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(data.low)
      
      // Calculate intraday change
      const intradayChange = data.open ? ((data.price - data.open) / data.open) * 100 : 0
      const isBullish = data.price >= (data.open || data.price)
      
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{formatChartDate(data.date)}</p>
          {isCandlestick ? (
            <>
              <p className="tooltip-label">Open: <span className="tooltip-value">{currency}{formattedOpen}</span></p>
              <p className="tooltip-label">High: <span className="tooltip-value-high">{currency}{formattedHigh}</span></p>
              <p className="tooltip-label">Low: <span className="tooltip-value-low">{currency}{formattedLow}</span></p>
              <p className="tooltip-label">Close: <span className="tooltip-value">{currency}{formattedPrice}</span></p>
              {data.volume && <p className="tooltip-label">Volume: <span className="tooltip-value">{data.volume.toLocaleString('en-IN')}</span></p>}
              {data.open && (
                <p className="tooltip-label" style={{ 
                  marginTop: '0.5rem', 
                  paddingTop: '0.5rem', 
                  borderTop: '1px solid #1e3a5f',
                  color: isBullish ? '#00d4aa' : '#ff6b6b',
                  fontWeight: 600
                }}>
                  Intraday: {isBullish ? '+' : ''}{intradayChange.toFixed(2)}%
                </p>
              )}
            </>
          ) : (
            <>
              <p className="tooltip-price">{currency}{formattedPrice}</p>
              {data.open && (
                <p className="tooltip-label" style={{ 
                  marginTop: '0.5rem',
                  color: isBullish ? '#00d4aa' : '#ff6b6b',
                  fontWeight: 600
                }}>
                  Change: {isBullish ? '+' : ''}{intradayChange.toFixed(2)}%
                </p>
              )}
            </>
          )}
        </div>
      )
    }
    return null
  }

  const renderCandlestickChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="chart-error">
          <p>No chart data available</p>
        </div>
      )
    }

    // Get min and max for scaling with padding
    const minPrice = Math.min(...chartData.map(d => d.low))
    const maxPrice = Math.max(...chartData.map(d => d.high))
    const priceRange = maxPrice - minPrice
    const pricePadding = priceRange * 0.1 // 10% padding
    
    const plotPadding = {
      top: 10,
      right: 20,
      bottom: 45, // Increased for better X-axis visibility
      left: 70   // Space for Y-axis labels to match line chart
    }
    
    const containerWidth = 1200
    const containerHeight = 500
    const plotWidth = containerWidth - plotPadding.left - plotPadding.right
    const plotHeight = containerHeight - plotPadding.top - plotPadding.bottom
    
    // Calculate optimal bar width and spacing - reduced size
    const optimalBarWidth = Math.max(4, Math.min(12, (plotWidth / chartData.length) * 0.4))
    const spacing = plotWidth / (chartData.length > 0 ? chartData.length : 1)
    const barWidth = Math.min(optimalBarWidth, spacing * 0.7) // Ensure bars don't overlap, smaller
    const gap = spacing - barWidth // Gap between candles

    // Prepare data with formatted dates for tooltip
    const dateLabels = chartData.map((point, idx) => {
      const date = point.date instanceof Date ? point.date : new Date(point.date)
      return {
        idx,
        label: formatChartDate(date),
        x: plotPadding.left + (idx * spacing) + (spacing / 2)
      }
    })

    return (
      <div className="candlestick-wrapper" style={{ position: 'relative' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${containerWidth} ${containerHeight}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`bullishGradient-${symbol}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00d4aa" />
              <stop offset="100%" stopColor="#00d4aa" stopOpacity={0.5} />
            </linearGradient>
            <linearGradient id={`bearishGradient-${symbol}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ff6b6b" />
              <stop offset="100%" stopColor="#ff6b6b" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          
          {/* Grid lines - matching line chart style */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const y = plotPadding.top + (ratio * plotHeight)
            return (
              <line
                key={`grid-${ratio}`}
                x1={plotPadding.left}
                y1={y}
                x2={plotPadding.left + plotWidth}
                y2={y}
                stroke="#1e3a5f"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )
          })}
          
          {/* Y-axis labels - matching line chart style */}
          <g>
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const price = minPrice - pricePadding + (maxPrice - minPrice + 2 * pricePadding) * (1 - ratio)
              const y = plotPadding.top + (ratio * plotHeight)
              return (
                <text
                  key={ratio}
                  x={plotPadding.left - 5}
                  y={y + 4}
                  fill="#718096"
                  fontSize="11"
                  style={{ fontSize: '0.75rem' }}
                  textAnchor="end"
                >
                  {currency}{price.toFixed(0)}
                </text>
              )
            })}
          </g>
          
          {/* Candlesticks */}
          <g className="candlestick-group">
            {chartData.map((point, idx) => {
              // Calculate X position with proper spacing
              const x = plotPadding.left + (idx * spacing) + (spacing / 2)
              const isBullish = point.price >= point.open
              
              // Calculate Y positions with padding
              const adjustedMin = minPrice - pricePadding
              const adjustedMax = maxPrice + pricePadding
              const adjustedRange = adjustedMax - adjustedMin
              
              const yHigh = plotPadding.top + ((adjustedMax - point.high) / adjustedRange) * plotHeight
              const yLow = plotPadding.top + ((adjustedMax - point.low) / adjustedRange) * plotHeight
              const yOpen = plotPadding.top + ((adjustedMax - point.open) / adjustedRange) * plotHeight
              const yClose = plotPadding.top + ((adjustedMax - point.price) / adjustedRange) * plotHeight
              
              const bodyTop = Math.min(yOpen, yClose)
              const bodyBottom = Math.max(yOpen, yClose)
              const bodyHeight = Math.max(bodyBottom - bodyTop, 1.5) // Minimum height for visibility
              
              // Create invisible hover area for better UX
              const hoverAreaWidth = Math.max(barWidth + gap, spacing * 0.9)
              
              return (
                <g key={idx}>
                  {/* Invisible hover area */}
                  <rect
                    x={x - hoverAreaWidth / 2}
                    y={plotPadding.top}
                    width={hoverAreaWidth}
                    height={plotHeight}
                    fill="transparent"
                    onMouseEnter={(e) => {
                      const svgElement = e.currentTarget.closest('svg')
                      const svgRect = svgElement.getBoundingClientRect()
                      const wrapperRect = svgElement.closest('.candlestick-wrapper')?.getBoundingClientRect()
                      
                      // Calculate position relative to the wrapper container
                      const relativeX = (e.clientX - (wrapperRect?.left || svgRect.left)) / (wrapperRect?.width || svgRect.width) * containerWidth
                      const relativeY = (e.clientY - (wrapperRect?.top || svgRect.top)) / (wrapperRect?.height || svgRect.height) * containerHeight
                      
                      setHoveredCandle({
                        data: point,
                        x: relativeX,
                        y: relativeY
                      })
                    }}
                    onMouseMove={(e) => {
                      const svgElement = e.currentTarget.closest('svg')
                      const svgRect = svgElement.getBoundingClientRect()
                      const wrapperRect = svgElement.closest('.candlestick-wrapper')?.getBoundingClientRect()
                      
                      const relativeX = (e.clientX - (wrapperRect?.left || svgRect.left)) / (wrapperRect?.width || svgRect.width) * containerWidth
                      const relativeY = (e.clientY - (wrapperRect?.top || svgRect.top)) / (wrapperRect?.height || svgRect.height) * containerHeight
                      
                      setHoveredCandle({
                        data: point,
                        x: relativeX,
                        y: relativeY
                      })
                    }}
                    onMouseLeave={() => setHoveredCandle(null)}
                    style={{ cursor: 'pointer' }}
                  />
                  {/* Shadow line (high-low wick) - reduced size */}
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={isBullish ? '#00d4aa' : '#ff6b6b'}
                    strokeWidth="1.5"
                    opacity={0.7}
                  />
                  {/* Body (open-close) - reduced size */}
                  <rect
                    x={x - barWidth / 2}
                    y={bodyTop}
                    width={barWidth}
                    height={bodyHeight}
                    fill={isBullish ? `url(#bullishGradient-${symbol})` : `url(#bearishGradient-${symbol})`}
                    stroke={isBullish ? '#00d4aa' : '#ff6b6b'}
                    strokeWidth="1.5"
                    rx="1"
                  />
                </g>
              )
            })}
          </g>
          
          {/* Y-axis line - matching line chart */}
          <line
            x1={plotPadding.left}
            y1={plotPadding.top}
            x2={plotPadding.left}
            y2={plotPadding.top + plotHeight}
            stroke="#718096"
            strokeWidth="1"
          />
          
          {/* X-axis line - Draw at the end to ensure visibility - HIGHLY VISIBLE */}
          <line
            x1={plotPadding.left - 5}
            y1={plotPadding.top + plotHeight}
            x2={plotPadding.left + plotWidth + 5}
            y2={plotPadding.top + plotHeight}
            stroke="#00d4aa"
            strokeWidth="3"
            opacity="1"
            style={{ filter: 'drop-shadow(0 0 2px #00d4aa)' }}
          />
          
          {/* X-axis labels - Draw after axis line */}
          {dateLabels.filter((_, idx) => {
            // Show labels at intervals to avoid crowding
            const maxLabels = range === '1d' ? 15 : 10
            const interval = Math.max(1, Math.floor(chartData.length / maxLabels))
            return idx % interval === 0 || idx === chartData.length - 1
          }).map((labelData) => {
            const rotateAngle = range === '1d' ? 0 : -45
            const labelY = containerHeight - plotPadding.bottom + 20
            const axisY = plotPadding.top + plotHeight
            return (
              <g key={labelData.idx}>
                {/* Tick mark on X-axis for each label */}
                <line
                  x1={labelData.x}
                  y1={axisY}
                  x2={labelData.x}
                  y2={axisY + 5}
                  stroke="#718096"
                  strokeWidth="2"
                />
                <text
                  x={labelData.x}
                  y={labelY}
                  fill="#00d4aa"
                  fontSize="13"
                  fontWeight="600"
                  textAnchor={range === '1d' ? 'middle' : 'end'}
                  transform={rotateAngle !== 0 ? `rotate(${rotateAngle} ${labelData.x} ${labelY})` : ''}
                  style={{ userSelect: 'none' }}
                >
                  {labelData.label}
                </text>
              </g>
            )
          })}
        </svg>
        
        {/* Hover tooltip - HTML overlay for better positioning */}
        {hoveredCandle && (
          <div
            style={{
              position: 'absolute',
              left: `${(hoveredCandle.x / containerWidth) * 100}%`,
              top: `${(hoveredCandle.y / containerHeight) * 100}%`,
              transform: 'translate(-50%, -100%)',
              marginTop: '-10px',
              background: '#141a2e',
              border: '1px solid #1e3a5f',
              borderRadius: '6px',
              padding: '0.75rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              pointerEvents: 'none',
              zIndex: 1000,
              minWidth: '180px'
            }}
          >
            <p style={{ 
              color: '#718096', 
              fontSize: '0.85rem', 
              fontWeight: 600,
              margin: 0,
              marginBottom: '0.5rem'
            }}>
              {formatChartDate(hoveredCandle.data.date)}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.25rem' }}>
              <span style={{ color: '#a0aec0', fontSize: '0.8rem' }}>Open:</span>
              <span style={{ color: '#00d4aa', fontSize: '0.8rem', fontWeight: 600 }}>
                {currency}{hoveredCandle.data.open.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.25rem' }}>
              <span style={{ color: '#a0aec0', fontSize: '0.8rem' }}>High:</span>
              <span style={{ color: '#00d4aa', fontSize: '0.8rem', fontWeight: 600 }}>
                {currency}{hoveredCandle.data.high.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.25rem' }}>
              <span style={{ color: '#a0aec0', fontSize: '0.8rem' }}>Low:</span>
              <span style={{ color: '#ff6b6b', fontSize: '0.8rem', fontWeight: 600 }}>
                {currency}{hoveredCandle.data.low.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.25rem' }}>
              <span style={{ color: '#a0aec0', fontSize: '0.8rem' }}>Close:</span>
              <span style={{ color: '#00d4aa', fontSize: '0.8rem', fontWeight: 600 }}>
                {currency}{hoveredCandle.data.price.toFixed(2)}
              </span>
            </div>
            {hoveredCandle.data.volume && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '0.25rem' }}>
                <span style={{ color: '#a0aec0', fontSize: '0.8rem' }}>Volume:</span>
                <span style={{ color: '#00d4aa', fontSize: '0.8rem', fontWeight: 600 }}>
                  {hoveredCandle.data.volume.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderLineChart = () => {
    // Prepare data with proper date formatting for recharts
    const formattedData = chartData.map(item => ({
      ...item,
      dateStr: formatChartDate(item.date),
      isPredicted: false
    }))

    // Add future predictions to chart data
    let combinedData = [...formattedData]
    if (chartAnalysis?.futureTrend?.predictions) {
      const predictedData = chartAnalysis.futureTrend.predictions.map(item => ({
        ...item,
        dateStr: formatChartDate(item.date),
        open: item.price,
        high: item.price * 1.01,
        low: item.price * 0.99,
        volume: null,
        isPredicted: true
      }))
      combinedData = [...formattedData, ...predictedData]
    }
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={combinedData} 
          margin={{ top: 10, right: 20, bottom: range === '1d' ? 40 : 30, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
          <XAxis
            dataKey="dateStr"
            stroke="#718096"
            style={{ fontSize: '0.75rem' }}
            angle={range === '1d' ? 0 : -45}
            textAnchor={range === '1d' ? 'middle' : 'end'}
            height={range === '1d' ? 40 : 60}
            interval={range === '1d' ? Math.max(0, Math.floor(combinedData.length / 15)) : 'preserveStartEnd'}
          />
          <YAxis
            stroke="#718096"
            domain={['auto', 'auto']}
            tickFormatter={(value) => `${currency}${value.toFixed(0)}`}
            style={{ fontSize: '0.75rem' }}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Historical data line */}
          <Line
            type="monotone"
            dataKey="price"
            stroke="#00d4aa"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#00d4aa' }}
            data={formattedData}
          />
          {/* Predicted future trend line */}
          {chartAnalysis?.futureTrend?.predictions && (
            <Line
              type="monotone"
              dataKey="price"
              stroke="#ffa726"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#ffa726', r: 3 }}
              activeDot={{ r: 5, fill: '#ffa726' }}
              data={combinedData.filter(d => d.isPredicted)}
              connectNulls={false}
            />
          )}
          {/* Target levels */}
          {chartAnalysis?.futureTrend && (
            <>
              {chartAnalysis.futureTrend.bullishTarget && (
                <ReferenceLine 
                  y={chartAnalysis.futureTrend.bullishTarget} 
                  stroke="#00d4aa" 
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  label={{ value: `Target: ${currency}${chartAnalysis.futureTrend.bullishTarget.toFixed(2)}`, position: 'right', fill: '#00d4aa', fontSize: '0.7rem' }}
                />
              )}
              {chartAnalysis.futureTrend.bearishTarget && chartAnalysis.futureTrend.bearishTarget !== chartAnalysis.currentPrice && (
                <ReferenceLine 
                  y={chartAnalysis.futureTrend.bearishTarget} 
                  stroke="#ff6b6b" 
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  label={{ value: `Support: ${currency}${chartAnalysis.futureTrend.bearishTarget.toFixed(2)}`, position: 'right', fill: '#ff6b6b', fontSize: '0.7rem' }}
                />
              )}
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    )
  }

  const renderAreaChart = () => {
    // Prepare data with proper date formatting for recharts
    const formattedData = chartData.map(item => ({
      ...item,
      dateStr: formatChartDate(item.date),
      isPredicted: false
    }))

    // Add future predictions to chart data
    let combinedData = [...formattedData]
    if (chartAnalysis?.futureTrend?.predictions) {
      const predictedData = chartAnalysis.futureTrend.predictions.map(item => ({
        ...item,
        dateStr: formatChartDate(item.date),
        open: item.price,
        high: item.price * 1.01,
        low: item.price * 0.99,
        volume: null,
        isPredicted: true
      }))
      combinedData = [...formattedData, ...predictedData]
    }
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={combinedData} 
          margin={{ top: 10, right: 20, bottom: range === '1d' ? 40 : 30, left: 10 }}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#00d4aa" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffa726" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#ffa726" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
          <XAxis
            dataKey="dateStr"
            stroke="#718096"
            style={{ fontSize: '0.75rem' }}
            angle={range === '1d' ? 0 : -45}
            textAnchor={range === '1d' ? 'middle' : 'end'}
            height={range === '1d' ? 40 : 60}
            interval={range === '1d' ? Math.max(0, Math.floor(combinedData.length / 15)) : 'preserveStartEnd'}
          />
          <YAxis
            stroke="#718096"
            domain={['auto', 'auto']}
            tickFormatter={(value) => `${currency}${value.toFixed(0)}`}
            style={{ fontSize: '0.75rem' }}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Historical data area */}
          <Area
            type="monotone"
            dataKey="price"
            stroke="#00d4aa"
            fill="url(#areaGradient)"
            strokeWidth={2}
            data={formattedData}
          />
          {/* Predicted future trend area */}
          {chartAnalysis?.futureTrend?.predictions && (
            <Area
              type="monotone"
              dataKey="price"
              stroke="#ffa726"
              fill="url(#predictionGradient)"
              strokeWidth={2}
              strokeDasharray="5 5"
              data={combinedData.filter(d => d.isPredicted)}
            />
          )}
          {/* Target levels */}
          {chartAnalysis?.futureTrend && (
            <>
              {chartAnalysis.futureTrend.bullishTarget && (
                <ReferenceLine 
                  y={chartAnalysis.futureTrend.bullishTarget} 
                  stroke="#00d4aa" 
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  label={{ value: `Target: ${currency}${chartAnalysis.futureTrend.bullishTarget.toFixed(2)}`, position: 'right', fill: '#00d4aa', fontSize: '0.7rem' }}
                />
              )}
            </>
          )}
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className="chart-container">
      <div className="chart-controls">
        <div className="view-mode-controls">
          <button
            className={`view-mode-btn ${viewMode === 'chart' ? 'active' : ''}`}
            onClick={() => setViewMode('chart')}
          >
            <BarChart3 size={18} />
            <span>Chart</span>
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'records' ? 'active' : ''}`}
            onClick={() => setViewMode('records')}
          >
            <History size={18} />
            <span>Records</span>
          </button>
        </div>
        
        {viewMode === 'chart' && (
          <>
            <div className="range-controls">
              {['1d', '5d', '1mo', '3mo', '1y'].map((period) => (
                <button
                  key={period}
                  className={`range-btn ${range === period ? 'active' : ''}`}
                  onClick={() => setRange(period)}
                >
                  {period}
                </button>
              ))}
            </div>
            <div className="type-controls">
              {[
                { key: 'line', label: 'Line' },
                { key: 'area', label: 'Area' },
                { key: 'candlestick', label: 'Candlestick' }
              ].map((type) => (
                <button
                  key={type.key}
                  className={`type-btn ${chartType === type.key ? 'active' : ''}`}
                  onClick={() => setChartType(type.key)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </>
        )}
        
        {viewMode === 'records' && (
          <div className="range-controls">
            {['1d', '5d', '1mo', '3mo', '1y'].map((period) => (
              <button
                key={period}
                className={`range-btn ${range === period ? 'active' : ''}`}
                onClick={() => setRange(period)}
              >
                {period}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="chart-wrapper">
        {chartData.length === 0 ? (
          <div className="chart-error">
            <p>No chart data available</p>
            <p className="error-subtitle">Please try a different stock or time range</p>
          </div>
        ) : (
          <>
            {viewMode === 'chart' && (
              <>
                {chartType === 'line' && renderLineChart()}
                {chartType === 'area' && renderAreaChart()}
                {chartType === 'candlestick' && renderCandlestickChart()}
              </>
            )}
            {viewMode === 'records' && (
              <PreviousRecords chartData={chartData} symbol={symbol} />
            )}
          </>
        )}
      </div>

      {/* Suggestions Panel */}
      {viewMode === 'chart' && chartAnalysis && chartAnalysis.suggestions && chartAnalysis.suggestions.length > 0 && (
        <div className="chart-suggestions-panel">
          <div className="suggestions-header">
            <Lightbulb size={18} />
            <h3>Trading Insights & Suggestions</h3>
          </div>
          <div className="suggestions-content">
            {chartAnalysis.suggestions
              .sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 }
                return priorityOrder[b.priority] - priorityOrder[a.priority]
              })
              .map((suggestion, idx) => {
                const Icon = suggestion.icon
                return (
                  <div key={idx} className={`suggestion-item suggestion-${suggestion.type}`}>
                    <Icon size={16} />
                    <span>{suggestion.message}</span>
                  </div>
                )
              })}
          </div>
          
          {/* Future Trend Predictions */}
          {chartAnalysis.futureTrend && (
            <div className="future-trend-section">
              <div className="future-trend-header">
                <Target size={18} />
                <h4>Future Trend Predictions</h4>
                <span className={`confidence-badge confidence-${chartAnalysis.futureTrend.confidence}`}>
                  {chartAnalysis.futureTrend.confidence.charAt(0).toUpperCase() + chartAnalysis.futureTrend.confidence.slice(1)} Confidence
                </span>
              </div>
              <div className="prediction-targets">
                {chartAnalysis.futureTrend.bullishTarget && (
                  <div className="target-item bullish">
                    <TrendingUp size={16} />
                    <div className="target-info">
                      <span className="target-label">Bullish Target:</span>
                      <span className="target-value">{currency}{chartAnalysis.futureTrend.bullishTarget.toFixed(2)}</span>
                      <span className="target-change">
                        (+{((chartAnalysis.futureTrend.bullishTarget - chartAnalysis.currentPrice) / chartAnalysis.currentPrice * 100).toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                )}
                {chartAnalysis.futureTrend.bearishTarget && chartAnalysis.futureTrend.bearishTarget !== chartAnalysis.currentPrice && (
                  <div className="target-item bearish">
                    <TrendingDown size={16} />
                    <div className="target-info">
                      <span className="target-label">Support Target:</span>
                      <span className="target-value">{currency}{chartAnalysis.futureTrend.bearishTarget.toFixed(2)}</span>
                      <span className="target-change">
                        ({((chartAnalysis.futureTrend.bearishTarget - chartAnalysis.currentPrice) / chartAnalysis.currentPrice * 100).toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {chartAnalysis.futureTrend.predictions && chartAnalysis.futureTrend.predictions.length > 0 && (
                <div className="prediction-info">
                  <p>Forecasting {chartAnalysis.futureTrend.predictions.length} future {range === '1d' ? 'day(s)' : range === '5d' ? 'day(s)' : range === '1mo' || range === '3mo' ? 'day(s)' : 'period(s)'} based on current trend analysis</p>
                  <p className="prediction-note">⚠️ Predictions are for informational purposes only and should not be considered as financial advice.</p>
                </div>
              )}
            </div>
          )}

          {/* Technical Summary */}
          <div className="technical-summary">
            <div className="summary-item">
              <span className="summary-label">Current Price:</span>
              <span className="summary-value">{currency}{chartAnalysis.currentPrice?.toFixed(2)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Support:</span>
              <span className="summary-value-support">{currency}{chartAnalysis.support?.toFixed(2)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Resistance:</span>
              <span className="summary-value-resistance">{currency}{chartAnalysis.resistance?.toFixed(2)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Change:</span>
              <span className={`summary-value ${chartAnalysis.priceChangePercent >= 0 ? 'positive' : 'negative'}`}>
                {chartAnalysis.priceChangePercent >= 0 ? '+' : ''}{chartAnalysis.priceChangePercent?.toFixed(2)}%
              </span>
            </div>
            {chartAnalysis.volatilityPercent && (
              <div className="summary-item">
                <span className="summary-label">Volatility:</span>
                <span className="summary-value">{chartAnalysis.volatilityPercent.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default StockChart