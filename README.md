# Stock Analyzer - Live Market

A real-time stock analyzer application similar to Zerodha, built with React and Vite. Monitor your favorite stocks, view live prices, charts, and market data.

## Features

- 📊 **Real-time Stock Data** - Get live stock prices and market information
- 📈 **Multiple Chart Types** - Line, Area, and Candlestick charts
- ⏱️ **Multiple Time Ranges** - 1d, 5d, 1mo, 3mo, 1y
- 📊 **OHLC Data** - Complete Open, High, Low, Close information
- ⭐ **Watchlist** - Add and manage your favorite stocks
- 🎨 **Modern UI** - Clean, dark theme inspired by Zerodha
- 🔄 **Auto-refresh** - Data updates every 10 seconds
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Prerequisites

- **Node.js 18.0.0 or higher** - Required to run this application
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd stock-analyzer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## API Usage

This app uses the Yahoo Finance API (`query1.finance.yahoo.com`) which is free and doesn't require an API key. The app fetches:

- Real-time stock quotes
- Historical price data
- Volume and OHLC data

## Default Watchlist

The app comes pre-loaded with these popular Indian stocks (NSE):
- RELIANCE.NS (Reliance Industries)
- TCS.NS (Tata Consultancy Services)
- HDFCBANK.NS (HDFC Bank)
- INFY.NS (Infosys)
- ICICIBANK.NS (ICICI Bank)
- HINDUNILVR.NS (Hindustan Unilever)
- BHARTIARTL.NS (Bharti Airtel)
- ITC.NS (ITC Ltd)

You can add or remove stocks from the watchlist as needed. To add Indian stocks, use the format: SYMBOL.NS (e.g., SBIN.NS for State Bank of India).

## Features in Detail

### Stock Table
- Sort by symbol, name, price, or volume
- View change percentages with color coding (₹ formatting for Indian stocks)
- See high, low, and volume data
- Click chart icon to view detailed price history

### Watchlist
- Add stocks by entering their symbol
- Remove stocks with one click
- Persistent across refresh

### Charts
- **Three Chart Types:**
  - Line Chart - Clean line visualization
  - Area Chart - Filled area with gradient
  - Candlestick Chart - Professional OHLC visualization with colors
- **Multiple Time Ranges** - 1d, 5d, 1mo, 3mo, 1y
- **Detailed Tooltips** - Hover to see exact prices, OHLC data, and volume
- **Color Coding** - Green for bullish, red for bearish candles
- Responsive design

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this project for learning or commercial purposes.
