// Market status utility for Indian stock market (NSE/BSE)
// Market hours: Monday-Friday, 9:15 AM - 3:30 PM IST

export const isMarketOpen = () => {
  const now = new Date()
  
  // Convert to IST (Indian Standard Time)
  const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)
  const istTime = new Date(utcTime + istOffset)
  
  const day = istTime.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hours = istTime.getHours()
  const minutes = istTime.getMinutes()
  const currentTime = hours * 60 + minutes // Time in minutes
  
  // Market is closed on weekends
  if (day === 0 || day === 6) {
    return false
  }
  
  // Market hours: 9:15 AM (9*60 + 15 = 555 minutes) to 3:30 PM (15*60 + 30 = 930 minutes)
  const marketOpenTime = 9 * 60 + 15 // 9:15 AM
  const marketCloseTime = 15 * 60 + 30 // 3:30 PM
  
  return currentTime >= marketOpenTime && currentTime <= marketCloseTime
}

export const getMarketStatus = () => {
  const isOpen = isMarketOpen()
  
  if (isOpen) {
    return {
      isOpen: true,
      message: 'Market Open',
      nextStatus: 'Closes at 3:30 PM'
    }
  }
  
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)
  const istTime = new Date(utcTime + istOffset)
  const day = istTime.getDay()
  const hours = istTime.getHours()
  const minutes = istTime.getMinutes()
  const currentTime = hours * 60 + minutes
  
  let message = 'Market Closed'
  let nextStatus = ''
  
  if (day === 0 || day === 6) {
    // Weekend
    if (day === 6) {
      nextStatus = 'Opens Monday at 9:15 AM'
    } else {
      nextStatus = 'Opens Monday at 9:15 AM'
    }
    message = 'Market Closed (Weekend)'
  } else if (currentTime < 9 * 60 + 15) {
    // Before market opens
    nextStatus = 'Opens at 9:15 AM'
    message = 'Market Closed'
  } else {
    // After market closes
    nextStatus = 'Opens tomorrow at 9:15 AM'
    message = 'Market Closed'
  }
  
  return {
    isOpen: false,
    message,
    nextStatus
  }
}

export const getCurrentISTTime = () => {
  try {
    return new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    })
  } catch {
    // Fallback if timezone not supported
    const now = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000)
    const istTime = new Date(utcTime + istOffset)
    const hours = String(istTime.getUTCHours()).padStart(2, '0')
    const minutes = String(istTime.getUTCMinutes()).padStart(2, '0')
    const seconds = String(istTime.getUTCSeconds()).padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }
}
