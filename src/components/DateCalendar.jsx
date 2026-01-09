import React, { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './DateCalendar.css'

const DateCalendar = ({ selectedDate, onDateSelect, availableDates = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  
  const daysInMonth = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const isDateAvailable = (date) => {
    if (availableDates.length === 0) return true
    return availableDates.some(availDate => 
      isSameDay(new Date(availDate), date)
    )
  }

  const isSelected = (date) => {
    return selectedDate && isSameDay(date, selectedDate)
  }

  const handleDateClick = (date) => {
    if (isDateAvailable(date) && isSameMonth(date, currentMonth)) {
      onDateSelect(date)
    }
  }

  return (
    <div className="date-calendar">
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={previousMonth}>
          <ChevronLeft size={20} />
        </button>
        <h3 className="calendar-month-year">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button className="calendar-nav-btn" onClick={nextMonth}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="calendar-weekdays">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="weekday-header">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-days">
        {daysInMonth.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isAvailable = isDateAvailable(day)
          const isSelectedDay = isSelected(day)
          
          return (
            <div
              key={idx}
              className={`calendar-day ${
                !isCurrentMonth ? 'other-month' : ''
              } ${
                !isAvailable ? 'unavailable' : ''
              } ${
                isSelectedDay ? 'selected' : ''
              } ${
                isSameDay(day, new Date()) ? 'today' : ''
              }`}
              onClick={() => handleDateClick(day)}
            >
              <span className="day-number">{format(day, 'd')}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DateCalendar
