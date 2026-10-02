import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatInr } from '../api.js'

export default function Confirmation() {
  const [booking, setBooking] = useState(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('staytrip_booking')
    if (raw) setBooking(JSON.parse(raw))
  }, [])

  if (!booking) {
    return (
      <div className="success">
        <h1>No booking found</h1>
        <p className="muted">Start a hotel search to complete a reservation.</p>
        <Link to="/hotels" className="book-btn" style={{ display: 'inline-block', marginTop: 16 }}>Browse hotels</Link>
      </div>
    )
  }

  return (
    <div className="success">
      <p className="badge" style={{ margin: '0 auto 12px' }}>Confirmed</p>
      <h1>Booking successful</h1>
      <p className="muted">Confirmation ID {booking.id}</p>
      <div style={{ textAlign: 'left', marginTop: 22, display: 'grid', gap: 8 }}>
        <p><strong>Hotel:</strong> {booking.hotel}</p>
        <p><strong>Room:</strong> {booking.room}</p>
        <p><strong>Guest:</strong> {booking.guest}</p>
        <p><strong>Stay:</strong> {booking.checkIn} to {booking.checkOut} · {booking.nights} night(s)</p>
        <p><strong>Guests:</strong> {booking.guests}</p>
        <p><strong>Payment:</strong> {String(booking.pay).toUpperCase()}</p>
        <p><strong>Amount paid:</strong> {formatInr(booking.total)}</p>
      </div>
      <Link to="/" className="book-btn" style={{ display: 'inline-block', marginTop: 22 }}>Book another hotel</Link>
    </div>
  )
}
