import { useState } from 'react'

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function Calendar({ selected, onSelect, availableDays = [1,2,3,4,5] }) {
  const today = new Date()
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })

  const firstDay = new Date(view.year, view.month, 1).getDay()
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function isoDate(day) {
    return `${view.year}-${String(view.month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  }

  function isDisabled(day) {
    const date = new Date(view.year, view.month, day)
    const dow = date.getDay()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return date < todayStart || !availableDays.includes(dow)
  }

  function prev() {
    setView(v => {
      const m = v.month === 0 ? 11 : v.month - 1
      const y = v.month === 0 ? v.year - 1 : v.year
      return { year: y, month: m }
    })
  }
  function next() {
    setView(v => {
      const m = v.month === 11 ? 0 : v.month + 1
      const y = v.month === 11 ? v.year + 1 : v.year
      return { year: y, month: m }
    })
  }

  return (
    <div className="calendar-wrapper">
      <div className="calendar-header">
        <button className="btn btn-ghost btn-sm" onClick={prev}>‹</button>
        <span className="calendar-title">{MONTHS[view.month]} {view.year}</span>
        <button className="btn btn-ghost btn-sm" onClick={next}>›</button>
      </div>
      <div className="calendar-grid">
        {DAYS.map(d => <div key={d} className="calendar-day-name">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="calendar-day empty" />
          const iso = isoDate(day)
          const disabled = isDisabled(day)
          const isToday = iso === today.toISOString().slice(0,10)
          const isSelected = iso === selected
          return (
            <div
              key={iso}
              className={`calendar-day ${disabled ? 'disabled' : 'available'} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => !disabled && onSelect(iso)}
            >
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}
