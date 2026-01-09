# Quick Setup Guide

## Node.js Version Requirement

**IMPORTANT:** This application requires Node.js 18.0.0 or higher.

You currently have Node.js installed via NVM. To use the correct version:

### First time setup:
```bash
# Make sure you're in the Stock Analyzer directory
cd "S:\Stock Analyzer"

# Switch to Node.js 18
nvm use 18

# Install dependencies (if not already installed)
npm install
```

### Every time you work on this project:
```bash
# Switch to Node.js 18
nvm use 18

# Start the development server
npm run dev
```

## Running the Application

1. **Navigate to the project directory:**
   ```bash
   cd "S:\Stock Analyzer"
   ```

2. **Switch to Node 18:**
   ```bash
   nvm use 18
   ```

3. **Start the dev server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - The app will automatically open at `http://localhost:3000`
   - Or manually navigate to that URL

## Application Features

✅ **Real-time Stock Data** - Live prices from Yahoo Finance API  
✅ **Interactive Charts** - Historical price data with multiple time ranges  
✅ **Watchlist Management** - Add/remove stocks easily  
✅ **Modern UI** - Dark theme inspired by Zerodha  
✅ **Auto-refresh** - Updates every 10 seconds  
✅ **Responsive Design** - Works on all devices  

## Default Stocks

The app comes pre-loaded with these popular Indian stocks (NSE):
- RELIANCE.NS (Reliance Industries)
- TCS.NS (Tata Consultancy Services)
- HDFCBANK.NS (HDFC Bank)
- INFY.NS (Infosys)
- ICICIBANK.NS (ICICI Bank)
- HINDUNILVR.NS (Hindustan Unilever)
- BHARTIARTL.NS (Bharti Airtel)
- ITC.NS (ITC Ltd)

**Note:** All prices are displayed in ₹ (Indian Rupees)

## Troubleshooting

### "Unexpected token" errors
**Solution:** Make sure you're using Node.js 18+:
```bash
nvm use 18
```

### Port already in use
**Solution:** The app uses port 3000. Either:
- Stop other applications using port 3000, or
- Edit `vite.config.js` to change the port

### API errors
**Note:** The app uses Yahoo Finance API which is free and doesn't require API keys. If you see errors, check your internet connection or try refreshing the page.

## Available Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Recharts** - Chart library  
- **Axios** - HTTP client
- **Yahoo Finance API** - Free stock data
