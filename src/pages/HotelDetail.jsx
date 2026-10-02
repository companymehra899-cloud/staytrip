import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { fetchHotel, formatInr } from '../api.js'

export default function HotelDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const checkIn = params.get('checkIn') || ''
  const checkOut = params.get('checkOut') || ''
  const guests = params.get('guests') || '2'
  const city = params.get('city') || ''

  const [hotel, setHotel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    setLoading(true)
    fetchHotel(id, city)
      .then((h) => { if (live) setHotel(h) })
      .catch(() => { if (live) setError('Hotel not found') })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [id, city])

  if (loading) {
    return <div className="container" style={{ padding: 40 }}><div className="empty">Loading hotel…</div></div>
  }

  if (error || !hotel) {
    return (
      <div className="container" style={{ padding: 40 }}>
        <div className="empty">Hotel not found. <Link to="/hotels">Back to hotels</Link></div>
      </div>
    )
  }

  function book(roomId) {
    const q = new URLSearchParams({ checkIn, checkOut, guests, room: roomId, city: hotel.city })
    navigate(`/book/${hotel.id}?${q.toString()}`)
  }

  return (
    <div className="container" style={{ paddingTop: 20 }}>
      <p className="muted" style={{ marginBottom: 12 }}>
        <Link to="/hotels">Hotels</Link> / {hotel.city} / {hotel.name}
      </p>
      <div className="detail-hero">
        <img src={hotel.images[0]} alt={hotel.name} />
        <div className="thumbs">
          <img src={hotel.images[1]} alt="" />
          <img src={hotel.images[2]} alt="" />
        </div>
      </div>

      <div className="detail-wrap">
        <div>
          <div className="row">
            <h1 style={{ fontSize: 28, letterSpacing: '-0.03em' }}>{hotel.name}</h1>
            <span className="badge">{hotel.rating} / 5</span>
          </div>
          <p className="muted">{hotel.area}, {hotel.city[0].toUpperCase() + hotel.city.slice(1)} · {Number(hotel.reviews).toLocaleString('en-IN')} reviews</p>
          <p className="stars">{'★'.repeat(hotel.stars)} {hotel.type}</p>
          <div className="tag-row" style={{ marginTop: 8 }}>
            {hotel.source === 'osm' && <span className="tag live">Live OSM name</span>}
            <span className="tag est">Estimated nightly rate</span>
          </div>
          <p style={{ marginTop: 16 }}>{hotel.about}</p>
          <h3 style={{ marginTop: 22 }}>Amenities</h3>
          <div className="amenity-list">
            {(hotel.amenities || []).map((a) => <span className="amenity" key={a}>{a}</span>)}
          </div>
          <h3 style={{ marginTop: 28 }}>Choose a room</h3>
          {hotel.rooms.map((r) => (
            <div className="room-card" key={r.id}>
              <div>
                <h4>{r.name}</h4>
                <p className="muted">{r.beds} · up to {r.guests} guests</p>
                <p className="muted">Free cancellation till 24 hours before check-in</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="price">{formatInr(r.price)}</p>
                <p className="muted">+ {formatInr(r.tax)} taxes</p>
                <button className="book-btn" style={{ marginTop: 8 }} onClick={() => book(r.id)}>Book now</button>
              </div>
            </div>
          ))}
        </div>

        <aside className="sticky-book">
          <p className="muted">From</p>
          <p className="price" style={{ fontSize: 26 }}>{formatInr(hotel.price)}</p>
          <p className="muted">per night · {hotel.type}</p>
          <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '14px 0' }} />
          <p className="muted">Check-in: {checkIn || 'Select dates'}</p>
          <p className="muted">Check-out: {checkOut || 'Select dates'}</p>
          <p className="muted">Guests: {guests}</p>
          <button className="book-btn" style={{ width: '100%', marginTop: 14 }} onClick={() => book(hotel.rooms[0].id)}>
            Continue to book
          </button>
        </aside>
      </div>
    </div>
  )
}
