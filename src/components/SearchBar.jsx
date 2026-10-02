import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCities } from '../api.js'

const FALLBACK_CITIES = [
  { id: 'delhi', name: 'Delhi NCR' },
  { id: 'mumbai', name: 'Mumbai' },
  { id: 'goa', name: 'Goa' },
  { id: 'jaipur', name: 'Jaipur' },
  { id: 'bangalore', name: 'Bangalore' },
  { id: 'hyderabad', name: 'Hyderabad' },
  { id: 'chennai', name: 'Chennai' },
  { id: 'kolkata', name: 'Kolkata' },
  { id: 'pune', name: 'Pune' },
  { id: 'manali', name: 'Manali' },
  { id: 'shimla', name: 'Shimla' },
  { id: 'udaipur', name: 'Udaipur' },
  { id: 'agra', name: 'Agra' },
  { id: 'varanasi', name: 'Varanasi' },
  { id: 'kochi', name: 'Kochi' },
  { id: 'jaisalmer', name: 'Jaisalmer' },
  { id: 'lucknow', name: 'Lucknow' },
  { id: 'amritsar', name: 'Amritsar' },
  { id: 'rishikesh', name: 'Rishikesh' },
  { id: 'darjeeling', name: 'Darjeeling' }
]

function plusDays(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export default function SearchBar({ compact }) {
  const navigate = useNavigate()
  const [cities, setCities] = useState(FALLBACK_CITIES)
  const [city, setCity] = useState('delhi')
  const [checkIn, setCheckIn] = useState(plusDays(1))
  const [checkOut, setCheckOut] = useState(plusDays(2))
  const [guests, setGuests] = useState('2')

  useEffect(() => {
    fetchCities()
      .then((list) => {
        if (list.length) setCities(list)
      })
      .catch(() => {})
  }, [])

  function submit(e) {
    e.preventDefault()
    const params = new URLSearchParams({ city, checkIn, checkOut, guests })
    navigate(`/hotels?${params.toString()}`)
  }

  return (
    <form className="search-card" onSubmit={submit} style={compact ? { marginTop: 0 } : undefined}>
      <div className="search-grid">
        <div className="field">
          <label>City / Area</label>
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Check-in</label>
          <input type="date" value={checkIn} min={plusDays(0)} onChange={(e) => setCheckIn(e.target.value)} />
        </div>
        <div className="field">
          <label>Check-out</label>
          <input type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} />
        </div>
        <div className="field">
          <label>Guests</label>
          <select value={guests} onChange={(e) => setGuests(e.target.value)}>
            <option value="1">1 Adult</option>
            <option value="2">2 Adults</option>
            <option value="3">3 Adults</option>
            <option value="4">4 Adults</option>
          </select>
        </div>
        <button className="search-btn" type="submit">Search</button>
      </div>
    </form>
  )
}
