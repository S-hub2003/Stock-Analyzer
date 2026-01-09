import React, { useState, useMemo } from 'react'
import { HelpCircle, TrendingUp, TrendingDown, AlertCircle, X, DollarSign, AlertTriangle, Target } from 'lucide-react'
import './TradingSignals.css'

const TradingSignals = ({ stock }) => {
  const [isOpen, setIsOpen] = useState(false)

  if (!stock) return null

  // Calculate trading signals based on stock data
  const calculateSignals = () => {
    const signals = {
      buyScore: 0,
      sellScore: 0,
      signals: []
    }

    // Analyze price movement
    const changePercent = stock.changePercent || 0
    const volume = stock.volume || 0

    // Signal 1: Price momentum
    if (changePercent > 0) {
      signals.buyScore += 1
      signals.signals.push({
        type: 'positive',
        title: 'Price Momentum',
        message: `Stock is up ${changePercent.toFixed(2)}%. Positive momentum indicates buying opportunity.`
      })
    } else if (changePercent < -5) {
      signals.sellScore += 1
      signals.signals.push({
        type: 'negative',
        title: 'Price Drop',
        message: `Stock down ${Math.abs(changePercent).toFixed(2)}%. Consider stop loss or exit strategy.`
      })
    }

    // Signal 2: Volume analysis
    // Note: We'd need historical average volume for better analysis
    // For now, using basic heuristics
    
    // Signal 3: High-Low spread
    if (stock.high && stock.low && stock.price) {
      const spread = ((stock.high - stock.low) / stock.price) * 100
      if (spread > 5) {
        signals.signals.push({
          type: 'warning',
          title: 'High Volatility',
          message: `Wide price range (${spread.toFixed(2)}% spread). High volatility detected - trade cautiously.`
        })
      }
    }

    // Signal 4: Price vs Open
    if (stock.open && stock.price) {
      const intradayChange = ((stock.price - stock.open) / stock.open) * 100
      if (intradayChange > 2) {
        signals.buyScore += 1
        signals.signals.push({
          type: 'positive',
          title: 'Strong Intraday Performance',
          message: `Up ${intradayChange.toFixed(2)}% from open. Strong buying pressure.`
        })
      } else if (intradayChange < -2) {
        signals.signals.push({
          type: 'warning',
          title: 'Weak Intraday Performance',
          message: `Down ${Math.abs(intradayChange).toFixed(2)}% from open. Consider waiting for better entry.`
        })
      }
    }

    return signals
  }

  const analysis = calculateSignals()
  const overallSignal = analysis.buyScore > analysis.sellScore ? 'buy' : analysis.buyScore < analysis.sellScore ? 'sell' : 'hold'

  // Calculate stop loss recommendation
  const calculateStopLoss = () => {
    if (!stock.price) return null

    const changePercent = stock.changePercent || 0

    // Conservative: 3-5% below current price
    // Aggressive: 7-10% below current price
    const conservative = stock.price * 0.97 // 3% stop loss
    const aggressive = stock.price * 0.93 // 7% stop loss
    
    return {
      conservative,
      aggressive,
      recommendation: changePercent > 5 ? 'Tighten stop loss to 3%' : 'Standard 5% stop loss recommended'
    }
  }

  const stopLoss = calculateStopLoss()

  // Calculate future trend predictions for live data
  const futurePredictions = useMemo(() => {
    if (!stock.price || !stock.changePercent) return null

    const currentPrice = stock.price
    const changePercent = stock.changePercent || 0
    const isUpward = changePercent > 0
    
    // Calculate volatility from high-low spread
    let volatility = 2 // Default 2% volatility
    if (stock.high && stock.low && stock.price) {
      const spread = ((stock.high - stock.low) / stock.price) * 100
      volatility = Math.max(2, Math.min(10, spread)) // Between 2% and 10%
    }

    // Predict next 5 days based on current momentum
    const predictions = []
    let predictedPrice = currentPrice
    const dailyMomentum = changePercent / 100 // Convert to decimal
    
    // Adjust momentum factor (decay over time)
    for (let day = 1; day <= 5; day++) {
      const momentumDecay = 1 - (day - 1) * 0.15 // Momentum decreases over time
      const adjustedMomentum = dailyMomentum * momentumDecay
      
      // Base prediction on momentum with volatility adjustment
      const baseChange = adjustedMomentum * currentPrice
      const volatilityAdjustment = (Math.sin(day * 0.5) * volatility * currentPrice) / 100 * 0.3
      
      predictedPrice = predictedPrice + baseChange + volatilityAdjustment
      
      // Apply boundaries based on high/low
      if (stock.high && predictedPrice > stock.high * 1.05) {
        predictedPrice = stock.high * 1.05 - (predictedPrice - stock.high * 1.05) * 0.2
      }
      if (stock.low && predictedPrice < stock.low * 0.95) {
        predictedPrice = stock.low * 0.95 + (predictedPrice - stock.low * 0.95) * 0.2
      }

      predictions.push({
        day,
        price: predictedPrice,
        change: ((predictedPrice - currentPrice) / currentPrice) * 100
      })
    }

    // Calculate targets
    const bullishTarget = isUpward
      ? currentPrice * (1 + Math.abs(changePercent) / 100 * 0.5)
      : currentPrice * (1 + 0.02) // Conservative 2% if not upward
    
    const bearishTarget = !isUpward
      ? currentPrice * (1 - Math.abs(changePercent) / 100 * 0.3)
      : currentPrice * (1 - 0.02) // Conservative 2% if upward

    // Confidence based on change percent and volume
    let confidence = 'low'
    if (Math.abs(changePercent) > 5) confidence = 'high'
    else if (Math.abs(changePercent) > 2) confidence = 'medium'

    // Analyze growth/decline patterns and timing
    const analyzeTiming = () => {
      const timePredictions = {
        growthPeriods: [],
        declinePeriods: [],
        bestEntryTime: null,
        bestExitTime: null,
        peakTime: null,
        dipTime: null
      }

      // Find when price will likely peak (highest point)
      let maxPrice = currentPrice
      let maxDay = 0
      let minPrice = currentPrice
      let minDay = 0

      predictions.forEach((pred, idx) => {
        if (pred.price > maxPrice) {
          maxPrice = pred.price
          maxDay = pred.day
        }
        if (pred.price < minPrice) {
          minPrice = pred.price
          minDay = pred.day
        }

        // Identify growth periods (consecutive days where price increases)
        if (idx > 0 && pred.price > predictions[idx - 1].price) {
          if (timePredictions.growthPeriods.length === 0 || 
              timePredictions.growthPeriods[timePredictions.growthPeriods.length - 1].end !== idx - 1) {
            timePredictions.growthPeriods.push({
              start: idx,
              end: idx,
              startPrice: predictions[idx - 1].price,
              endPrice: pred.price
            })
          } else {
            timePredictions.growthPeriods[timePredictions.growthPeriods.length - 1].end = idx
            timePredictions.growthPeriods[timePredictions.growthPeriods.length - 1].endPrice = pred.price
          }
        }

        // Identify decline periods (consecutive days where price decreases)
        if (idx > 0 && pred.price < predictions[idx - 1].price) {
          if (timePredictions.declinePeriods.length === 0 || 
              timePredictions.declinePeriods[timePredictions.declinePeriods.length - 1].end !== idx - 1) {
            timePredictions.declinePeriods.push({
              start: idx,
              end: idx,
              startPrice: predictions[idx - 1].price,
              endPrice: pred.price
            })
          } else {
            timePredictions.declinePeriods[timePredictions.declinePeriods.length - 1].end = idx
            timePredictions.declinePeriods[timePredictions.declinePeriods.length - 1].endPrice = pred.price
          }
        }
      })

      // Determine best entry/exit times
      if (isUpward) {
        // For upward trend: buy now, sell at peak
        timePredictions.bestEntryTime = 'Now (Day 0)'
        timePredictions.bestExitTime = maxDay > 0 ? `Day ${maxDay}` : 'Day 3-5'
        timePredictions.peakTime = maxDay > 0 ? `Day ${maxDay}` : 'Day 3-5'
        
        // Find first good entry point if not already in
        const firstGrowthPeriod = timePredictions.growthPeriods[0]
        if (firstGrowthPeriod && firstGrowthPeriod.start > 0) {
          timePredictions.bestEntryTime = `Day ${firstGrowthPeriod.start}`
        }
      } else {
        // For downward trend: wait for dip, then buy
        timePredictions.bestEntryTime = minDay > 0 ? `Day ${minDay}` : 'Day 2-3 (Wait for dip)'
        timePredictions.bestExitTime = 'Day 4-5 (After recovery)'
        timePredictions.dipTime = minDay > 0 ? `Day ${minDay}` : 'Day 2-3'
      }

      return timePredictions
    }

    const timingAnalysis = analyzeTiming()

    return {
      predictions,
      bullishTarget,
      bearishTarget,
      confidence,
      isUpward,
      timingAnalysis
    }
  }, [stock.price, stock.changePercent, stock.high, stock.low])

  const isIndianStock = stock.symbol && stock.symbol.endsWith('.NS')
  const currency = isIndianStock ? '₹' : '$'

  return (
    <div className="trading-signals-container">
      <button
        className="help-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Show Trading Signals & Stop Loss Tips"
      >
        <HelpCircle size={18} />
      </button>

      {isOpen && (
        <div className="signals-panel">
          <div className="signals-header">
            <div className="signals-title">
              <TrendingUp size={20} />
              <h3>Trading Analysis: {stock.symbol}</h3>
            </div>
            <button className="close-signals-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="signals-content">
            {/* Overall Signal */}
            <div className={`overall-signal signal-${overallSignal}`}>
              <div className="signal-icon">
                {overallSignal === 'buy' && <TrendingUp size={24} />}
                {overallSignal === 'sell' && <TrendingDown size={24} />}
                {overallSignal === 'hold' && <AlertCircle size={24} />}
              </div>
              <div className="signal-main">
                <h4>{overallSignal.toUpperCase()} SIGNAL</h4>
                <p>
                  {overallSignal === 'buy' && 'Consider buying at current levels. Monitor for confirmation.'}
                  {overallSignal === 'sell' && 'Consider taking profits or setting stop loss. Risk management advised.'}
                  {overallSignal === 'hold' && 'Wait for clearer signals. Monitor price action and volume.'}
                </p>
              </div>
            </div>

            {/* Stop Loss Recommendation */}
            {stopLoss && (
              <div className="stop-loss-section">
                <div className="section-header">
                  <AlertTriangle size={18} />
                  <h4>Stop Loss Recommendations</h4>
                </div>
                <div className="stop-loss-grid">
                  <div className="stop-loss-item">
                    <span className="label">Conservative (3%):</span>
                    <span className="value">{stopLoss.conservative.toFixed(2)}</span>
                  </div>
                  <div className="stop-loss-item">
                    <span className="label">Aggressive (7%):</span>
                    <span className="value">{stopLoss.aggressive.toFixed(2)}</span>
                  </div>
                </div>
                <div className="stop-loss-tip">
                  <p>{stopLoss.recommendation}</p>
                </div>
              </div>
            )}

            {/* Detailed Signals */}
            {analysis.signals.length > 0 && (
              <div className="detailed-signals">
                <h4>Technical Indicators</h4>
                <div className="signals-list">
                  {analysis.signals.map((signal, idx) => (
                    <div key={idx} className={`signal-item signal-${signal.type}`}>
                      <div className="signal-dot"></div>
                      <div className="signal-info">
                        <strong>{signal.title}</strong>
                        <p>{signal.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Future Trend Predictions for Live Data */}
            {futurePredictions && (
              <div className="live-predictions-section">
                <div className="predictions-header">
                  <Target size={18} />
                  <h4>Live Future Trend Predictions</h4>
                  <span className={`confidence-badge confidence-${futurePredictions.confidence}`}>
                    {futurePredictions.confidence.charAt(0).toUpperCase() + futurePredictions.confidence.slice(1)} Confidence
                  </span>
                </div>
                
                <div className="prediction-targets">
                  {futurePredictions.bullishTarget && (
                    <div className="target-item bullish">
                      <TrendingUp size={16} />
                      <div className="target-info">
                        <span className="target-label">Bullish Target:</span>
                        <span className="target-value">{currency}{futurePredictions.bullishTarget.toFixed(2)}</span>
                        <span className="target-change">
                          (+{((futurePredictions.bullishTarget - stock.price) / stock.price * 100).toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  )}
                  {futurePredictions.bearishTarget && futurePredictions.bearishTarget !== stock.price && (
                    <div className="target-item bearish">
                      <TrendingDown size={16} />
                      <div className="target-info">
                        <span className="target-label">Support Target:</span>
                        <span className="target-value">{currency}{futurePredictions.bearishTarget.toFixed(2)}</span>
                        <span className="target-change">
                          ({((futurePredictions.bearishTarget - stock.price) / stock.price * 100).toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timing Predictions - When Graph Will Grow/Decline */}
                {futurePredictions.timingAnalysis && (
                  <div className="timing-predictions">
                    <h5>📈 Growth & Decline Timeline</h5>
                    
                    {futurePredictions.isUpward && futurePredictions.timingAnalysis.peakTime && (
                      <div className="timing-item growth">
                        <TrendingUp size={16} />
                        <div className="timing-info">
                          <strong>Expected Growth Peak:</strong>
                          <span>{futurePredictions.timingAnalysis.peakTime} - Price may reach peak around {futurePredictions.timingAnalysis.peakTime}</span>
                        </div>
                      </div>
                    )}

                    {!futurePredictions.isUpward && futurePredictions.timingAnalysis.dipTime && (
                      <div className="timing-item decline">
                        <TrendingDown size={16} />
                        <div className="timing-info">
                          <strong>Expected Decline Bottom:</strong>
                          <span>{futurePredictions.timingAnalysis.dipTime} - Price may bottom around {futurePredictions.timingAnalysis.dipTime}</span>
                        </div>
                      </div>
                    )}

                    {futurePredictions.timingAnalysis.bestEntryTime && (
                      <div className="timing-item entry">
                        <DollarSign size={16} />
                        <div className="timing-info">
                          <strong>Best Entry Time:</strong>
                          <span>{futurePredictions.timingAnalysis.bestEntryTime} - Optimal buying opportunity</span>
                        </div>
                      </div>
                    )}

                    {futurePredictions.timingAnalysis.bestExitTime && (
                      <div className="timing-item exit">
                        <Target size={16} />
                        <div className="timing-info">
                          <strong>Best Exit Time:</strong>
                          <span>{futurePredictions.timingAnalysis.bestExitTime} - Consider taking profits</span>
                        </div>
                      </div>
                    )}

                    {/* Growth Periods */}
                    {futurePredictions.timingAnalysis.growthPeriods && futurePredictions.timingAnalysis.growthPeriods.length > 0 && (
                      <div className="period-predictions">
                        <h6>Growth Periods (Price Going Up):</h6>
                        {futurePredictions.timingAnalysis.growthPeriods.map((period, idx) => {
                          const growthPercent = ((period.endPrice - period.startPrice) / period.startPrice) * 100
                          return (
                            <div key={idx} className="period-item growth-period">
                              <span className="period-range">Day {period.start} → Day {period.end}</span>
                              <span className="period-change positive">
                                +{growthPercent.toFixed(2)}% growth expected
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Decline Periods */}
                    {futurePredictions.timingAnalysis.declinePeriods && futurePredictions.timingAnalysis.declinePeriods.length > 0 && (
                      <div className="period-predictions">
                        <h6>Decline Periods (Price Going Down):</h6>
                        {futurePredictions.timingAnalysis.declinePeriods.map((period, idx) => {
                          const declinePercent = ((period.endPrice - period.startPrice) / period.startPrice) * 100
                          return (
                            <div key={idx} className="period-item decline-period">
                              <span className="period-range">Day {period.start} → Day {period.end}</span>
                              <span className="period-change negative">
                                {declinePercent.toFixed(2)}% decline expected
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {futurePredictions.predictions && futurePredictions.predictions.length > 0 && (
                  <div className="daily-predictions">
                    <h5>Next 5 Days Forecast</h5>
                    <div className="predictions-list">
                      {futurePredictions.predictions.map((pred, idx) => (
                        <div key={idx} className="prediction-day">
                          <span className="day-label">Day {pred.day}:</span>
                          <span className={`day-price ${pred.change >= 0 ? 'positive' : 'negative'}`}>
                            {currency}{pred.price.toFixed(2)}
                            <span className="day-change">
                              ({pred.change >= 0 ? '+' : ''}{pred.change.toFixed(2)}%)
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="prediction-note">
                  <AlertTriangle size={14} />
                  <p>Predictions based on current momentum and volatility. Actual results may vary. Not financial advice.</p>
                </div>
              </div>
            )}

            {/* Trading Tips */}
            <div className="trading-tips">
              <h4>Trading Best Practices</h4>
              <ul>
                <li>Always use stop loss orders to limit downside risk</li>
                <li>Consider position sizing based on volatility</li>
                <li>Monitor volume for confirmation of price movements</li>
                <li>Review fundamentals along with technical analysis</li>
                <li>Never invest more than you can afford to lose</li>
                <li>Have an exit strategy before entering a trade</li>
                <li>Consider dollar-cost averaging for long-term positions</li>
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="disclaimer">
              <AlertCircle size={14} />
              <p>
                <strong>Disclaimer:</strong> These signals are for informational purposes only. 
                They do not constitute financial advice. Always consult with a qualified financial advisor 
                before making investment decisions. Past performance does not guarantee future results.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TradingSignals

