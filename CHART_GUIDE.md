# Stock Analyzer - Chart Features Guide

## Overview

The Stock Analyzer now features **three professional chart types** similar to Zerodha's trading platform!

## Chart Types

### 1. 📈 Line Chart
- **Best for:** Clean price trends, quick overview
- **Features:**
  - Smooth line connecting closing prices
  - Green color scheme
  - Minimal and clean visualization
  - Perfect for identifying overall trends

### 2. 🌊 Area Chart
- **Best for:** Volume and price movement visualization
- **Features:**
  - Filled area with gradient effect
  - Emphasizes price movements over time
  - Green gradient fill
  - Shows price distribution clearly

### 3. 🕯️ Candlestick Chart
- **Best for:** Professional trading analysis
- **Features:**
  - Full OHLC (Open, High, Low, Close) data
  - **Green candles** for bullish (price up)
  - **Red candles** for bearish (price down)
  - Shows market sentiment at a glance
  - Vertical lines show price range
  - Rectangular body shows open/close

## Time Ranges

Switch between different time periods to analyze stock performance:

- **1d** - Intraday movements (shows hourly data)
- **5d** - Week overview
- **1mo** - Month analysis
- **3mo** - Quarterly performance
- **1y** - Annual trends

## How to Use

1. **Open a chart:** Click the chart icon (📊) next to any stock in the table
2. **Switch chart type:** Use the buttons at the top (Line, Area, Candlestick)
3. **Change time range:** Click period buttons (1d, 5d, 1mo, 3mo, 1y)
4. **View details:** Hover over the chart to see detailed OHLC data

## Tooltips

### Line & Area Charts
- Shows date/time
- Current price

### Candlestick Chart
- Date/time
- **Open** price
- **High** price
- **Low** price
- **Close** price
- **Volume** traded

## Color Coding

- 🟢 **Green** - Price increase (bullish)
- 🔴 **Red** - Price decrease (bearish)

## Tips

- Use **Candlestick** charts for detailed technical analysis
- Use **Line** charts for quick trend checks
- Use **Area** charts to emphasize volume/price relationships
- Switch between **time ranges** to spot different patterns
- Watch for **bullish patterns** (green candles) vs **bearish patterns** (red candles)

## Technical Details

- Data fetched from Yahoo Finance API (free, no key required)
- Real-time OHLC data
- Responsive SVG rendering
- Smooth animations and transitions
- Works offline with cached data
