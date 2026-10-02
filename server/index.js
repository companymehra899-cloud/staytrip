import express from 'express'
import { cities, getCity } from './cities.js'
import { fetchOsmHotels } from './osm.js'
import { hotels as catalog, searchHotels as searchCatalog, getHotel as getCatalogHotel } from '../src/data/hotels.js'

const app = express()
const PORT = 3001
app.use(express.json())

const osmCache = new Map()
const hotelIndex = new Map()
const bookings = []
const CACHE_MS = 30 * 60 * 1000

for (const h of catalog) hotelIndex.set(h.id, { ...h, source: 'catalog' })

function cacheKey(cityId) {
  return `city:${cityId}`
}

async function hotelsForCity(cityId) {
  if (!cityId) {
    return catalog.map((h) => ({ ...h, source: 'catalog' }))
  }
  const city = getCity(cityId)
  if (!city) return []

  const key = cacheKey(cityId)
  const hit = osmCache.get(key)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.hotels

  try {
    const live = await fetchOsmHotels(city)
    const fallback = catalog.filter((h) => h.city === cityId).map((h) => ({ ...h, source: 'catalog' }))
    const names = new Set(live.map((h) => h.name.toLowerCase()))
    const merged = live.length ? [...live, ...fallback.filter((h) => !names.has(h.name.toLowerCase()))] : fallback
    for (const h of merged) hotelIndex.set(h.id, h)
    osmCache.set(key, { at: Date.now(), hotels: merged, source: live.length ? 'osm' : 'catalog' })
    return merged
  } catch {
    const fallback = catalog.filter((h) => h.city === cityId).map((h) => ({ ...h, source: 'catalog' }))
    osmCache.set(key, { at: Date.now(), hotels: fallback, source: 'catalog' })
    return fallback
  }
}

function applyFilters(list, { type, minStars, maxPrice, q }) {
  return list.filter((h) => {
    if (type && type !== 'all' && h.type !== type) return false
    if (minStars && h.stars < Number(minStars)) return false
    if (maxPrice && h.price > Number(maxPrice)) return false
    if (q) {
      const s = q.toLowerCase()
      if (!`${h.name} ${h.area} ${h.city}`.toLowerCase().includes(s)) return false
    }
    return true
  })
}

function sortHotels(list, sort) {
  const copy = [...list]
  if (sort === 'price-asc') return copy.sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') return copy.sort((a, b) => b.price - a.price)
  if (sort === 'rating') return copy.sort((a, b) => b.rating - a.rating)
  return copy.sort((a, b) => b.reviews - a.reviews)
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'staytrip-api' })
})

app.get('/api/cities', (_req, res) => {
  res.json({ cities })
})

app.get('/api/hotels', async (req, res) => {
  try {
    const { city, type, minStars, maxPrice, q, sort, featured } = req.query
    let list
    let source = 'catalog'
    if (city) {
      list = await hotelsForCity(city)
      source = osmCache.get(cacheKey(city))?.source || 'catalog'
    } else if (featured === '1') {
      list = [...catalog].sort((a, b) => b.rating - a.rating).slice(0, 6).map((h) => ({ ...h, source: 'catalog' }))
    } else {
      list = searchCatalog({ city: '', type, minStars, maxPrice, q }).map((h) => ({ ...h, source: 'catalog' }))
    }
    if (city || featured !== '1') list = applyFilters(list, { type, minStars, maxPrice, q })
    list = sortHotels(list, sort || 'recommended')
    if (featured === '1') list = list.slice(0, 6)
    res.json({ hotels: list, source, count: list.length })
  } catch (err) {
    res.status(500).json({ error: 'Failed to load hotels' })
  }
})

app.get('/api/hotels/:id', async (req, res) => {
  const { id } = req.params
  let hotel = hotelIndex.get(id)
  if (!hotel && !id.startsWith('osm-')) {
    hotel = getCatalogHotel(id)
    if (hotel) hotel = { ...hotel, source: 'catalog' }
  }
  if (!hotel && req.query.city) {
    const list = await hotelsForCity(req.query.city)
    hotel = list.find((h) => h.id === id)
  }
  if (!hotel) return res.status(404).json({ error: 'Hotel not found' })
  hotelIndex.set(hotel.id, hotel)
  res.json({ hotel })
})

app.post('/api/bookings', (req, res) => {
  const b = req.body || {}
  if (!b.name || !b.email || !b.phone || !b.hotelId) {
    return res.status(400).json({ error: 'Missing guest or hotel details' })
  }
  if (!/^\S+@\S+\.\S+$/.test(b.email)) return res.status(400).json({ error: 'Invalid email' })
  if (!/^[0-9]{10}$/.test(String(b.phone))) return res.status(400).json({ error: 'Invalid phone' })
  const hotel = hotelIndex.get(b.hotelId) || getCatalogHotel(b.hotelId)
  if (!hotel) return res.status(404).json({ error: 'Hotel not found' })
  const room = hotel.rooms.find((r) => r.id === b.room) || hotel.rooms[0]
  const nights = Math.max(1, Number(b.nights) || 1)
  const booking = {
    id: 'ST' + Date.now().toString().slice(-8),
    hotelId: hotel.id,
    hotel: hotel.name,
    city: hotel.city,
    room: room.name,
    checkIn: b.checkIn || '',
    checkOut: b.checkOut || '—',
    guests: Number(b.guests) || 2,
    nights,
    total: (room.price + room.tax) * nights,
    guest: b.name,
    email: b.email,
    phone: b.phone,
    pay: b.pay || 'upi',
    requests: b.requests || '',
    createdAt: new Date().toISOString()
  }
  bookings.push(booking)
  res.status(201).json({ booking })
})

app.get('/api/bookings/:id', (req, res) => {
  const booking = bookings.find((b) => b.id === req.params.id)
  if (!booking) return res.status(404).json({ error: 'Booking not found' })
  res.json({ booking })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`StayTrip API listening on http://localhost:${PORT}`)
})
