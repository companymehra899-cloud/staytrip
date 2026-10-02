export function formatInr(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1
  const a = new Date(checkIn)
  const b = new Date(checkOut)
  const n = Math.round((b - a) / 86400000)
  return n > 0 ? n : 1
}

async function getJson(url, options) {
  const res = await fetch(url, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export async function fetchCities() {
  const data = await getJson('/api/cities')
  return data.cities || []
}

export async function fetchHotels(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.set(k, v)
  })
  return getJson(`/api/hotels?${qs.toString()}`)
}

export async function fetchHotel(id, city) {
  const qs = city ? `?city=${encodeURIComponent(city)}` : ''
  const data = await getJson(`/api/hotels/${encodeURIComponent(id)}${qs}`)
  return data.hotel
}

export async function createBooking(payload) {
  const data = await getJson('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return data.booking
}
