import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar.jsx'
import { fetchCities, fetchHotels, formatInr } from '../api.js'

export default function Home() {
  const navigate = useNavigate()
  const [cities, setCities] = useState([])
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    fetchCities().then(setCities).catch(() => {})
    fetchHotels({ featured: '1' }).then((d) => setFeatured(d.hotels || [])).catch(() => {})
  }, [])

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Book hotels across India</h1>
          <p>One category. Search a city, compare stays, and lock a room with taxes shown up front.</p>
          <SearchBar />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>Popular destinations</h2>
              <p>Tap a city to see available hotels</p>
            </div>
          </div>
          <div className="city-grid">
            {cities.map((c) => (
              <article key={c.id} className="city-card" onClick={() => navigate(`/hotels?city=${c.id}`)}>
                <img src={c.image} alt={c.name} />
                <div className="meta">
                  <h3>{c.name}</h3>
                  <p className="muted">{c.hotels}+ properties</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <h2>Top rated stays</h2>
              <p>Guest favourites this week</p>
            </div>
            <Link to="/hotels" className="muted">View all hotels</Link>
          </div>
          <div className="hotel-grid">
            {featured.map((h) => (
              <Link key={h.id} to={`/hotels/${h.id}?city=${h.city}`} className="hotel-card">
                <img src={h.images[0]} alt={h.name} />
                <div className="meta">
                  <div className="row">
                    <span className="badge">{h.rating}</span>
                    <span className="tag">{h.type}</span>
                  </div>
                  <h3 style={{ marginTop: 8 }}>{h.name}</h3>
                  <p className="muted">{h.area}, {h.city[0].toUpperCase() + h.city.slice(1)}</p>
                  <div className="row" style={{ marginTop: 10 }}>
                    <p className="price">{formatInr(h.price)} <span>/ night</span></p>
                    <span className="stars">{'★'.repeat(h.stars)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
