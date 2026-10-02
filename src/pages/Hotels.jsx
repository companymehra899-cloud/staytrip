import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SearchBar from '../components/SearchBar.jsx'
import { fetchCities, fetchHotels, formatInr } from '../api.js'

export default function Hotels() {
  const [params] = useSearchParams()
  const city = params.get('city') || ''
  const checkIn = params.get('checkIn') || ''
  const checkOut = params.get('checkOut') || ''
  const guests = params.get('guests') || '2'

  const [cities, setCities] = useState([])
  const [results, setResults] = useState([])
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [type, setType] = useState('all')
  const [minStars, setMinStars] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('recommended')

  const cityName = cities.find((c) => c.id === city)?.name || 'All cities'

  useEffect(() => {
    fetchCities().then(setCities).catch(() => {})
  }, [])

  useEffect(() => {
    let live = true
    setLoading(true)
    setError('')
    fetchHotels({ city, type, minStars, maxPrice, q, sort })
      .then((d) => {
        if (!live) return
        setResults(d.hotels || [])
        setSource(d.source || '')
      })
      .catch(() => {
        if (!live) return
        setResults([])
        setError('Could not load hotels. Try again.')
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => { live = false }
  }, [city, type, minStars, maxPrice, q, sort])

  return (
    <div className="container" style={{ paddingTop: 20 }}>
      <SearchBar compact />
      <div className="listing-layout">
        <aside className="filters">
          <h3>Filter hotels</h3>
          <div className="filter-group">
            <label>Search by name</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hotel or area" style={{ width: '100%', marginTop: 6, padding: 8, borderRadius: 8, border: '1px solid var(--line)' }} />
          </div>
          <div className="filter-group">
            <strong style={{ fontSize: 13 }}>Property type</strong>
            {['all', 'Luxury', 'Business', 'Budget', 'Resort'].map((t) => (
              <label key={t}>
                <input type="radio" name="type" checked={type === t} onChange={() => setType(t)} />
                {t === 'all' ? 'All types' : t}
              </label>
            ))}
          </div>
          <div className="filter-group">
            <strong style={{ fontSize: 13 }}>Star rating</strong>
            {['', '3', '4', '5'].map((s) => (
              <label key={s || 'any'}>
                <input type="radio" name="stars" checked={minStars === s} onChange={() => setMinStars(s)} />
                {s ? `${s} star & above` : 'Any rating'}
              </label>
            ))}
          </div>
          <div className="filter-group">
            <strong style={{ fontSize: 13 }}>Max price / night</strong>
            {['', '4000', '8000', '12000'].map((p) => (
              <label key={p || 'any-p'}>
                <input type="radio" name="price" checked={maxPrice === p} onChange={() => setMaxPrice(p)} />
                {p ? `Under ${formatInr(Number(p))}` : 'Any price'}
              </label>
            ))}
          </div>
        </aside>

        <section>
          <div className="listing-toolbar">
            <div>
              <h2>{cityName} hotels</h2>
              <p className="muted">
                {loading ? 'Loading live listings…' : `${results.length} properties`}
                {checkIn && ` · ${checkIn} to ${checkOut || '—'} · ${guests} guests`}
                {!loading && source === 'osm' && ' · live map names'}
                {!loading && source === 'catalog' && ' · catalog listings'}
              </p>
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--line)' }}>
              <option value="recommended">Recommended</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rating">Guest rating</option>
            </select>
          </div>

          {!loading && source === 'osm' && (
            <div className="banner">Live hotel names from OpenStreetMap. Prices are estimates until a paid booking API is connected.</div>
          )}
          {loading && <div className="empty">Fetching hotels for {cityName}…</div>}
          {error && <div className="empty">{error}</div>}
          {!loading && !error && results.length === 0 && <div className="empty">No hotels match these filters. Try another city or reset filters.</div>}

          {!loading && results.map((h) => (
            <article key={h.id} className="listing-item">
              <img src={h.images[0]} alt={h.name} />
              <div className="listing-body">
                <div className="tag-row">
                  <span className="tag">{h.type}</span>
                  {h.source === 'osm' && <span className="tag live">Live name</span>}
                  <span className="tag est">Est. price</span>
                </div>
                <h3 style={{ marginTop: 6 }}>{h.name}</h3>
                <p className="muted">{h.area} · {h.city[0].toUpperCase() + h.city.slice(1)}</p>
                <p className="stars">{'★'.repeat(h.stars)}</p>
                <p style={{ marginTop: 8, fontSize: 14 }}>{(h.amenities || []).slice(0, 4).join(' · ')}</p>
                <p className="muted" style={{ marginTop: 6 }}>{Number(h.reviews).toLocaleString('en-IN')} reviews</p>
              </div>
              <div className="listing-side">
                <span className="badge">{h.rating} / 5</span>
                <div>
                  <p className="strike">{formatInr(h.strike)}</p>
                  <p className="price">{formatInr(h.price)}</p>
                  <p className="muted">per night + taxes</p>
                </div>
                <Link
                  className="book-btn"
                  to={`/hotels/${h.id}?city=${h.city}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}
                  style={{ display: 'inline-block', textAlign: 'center' }}
                >
                  View rooms
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  )
}
