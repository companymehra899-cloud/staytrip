const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe597?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1501117716987-c8e1ecb2101f?auto=format&fit=crop&w=1200&q=80'
]

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

function rooms(base) {
  return [
    { id: 'deluxe', name: 'Deluxe Room', beds: '1 King bed', guests: 2, price: base, tax: Math.round(base * 0.12) },
    { id: 'suite', name: 'Premium Suite', beds: '1 King + sofa', guests: 3, price: Math.round(base * 1.55), tax: Math.round(base * 1.55 * 0.12) },
    { id: 'family', name: 'Family Room', beds: '2 Queen beds', guests: 4, price: Math.round(base * 1.9), tax: Math.round(base * 1.9 * 0.12) }
  ]
}

function pickImages(id) {
  const i = hash(id) % IMAGE_POOL.length
  return [IMAGE_POOL[i], IMAGE_POOL[(i + 3) % IMAGE_POOL.length], IMAGE_POOL[(i + 6) % IMAGE_POOL.length]]
}

function mapType(stars, osmType) {
  if (osmType === 'guest_house' || osmType === 'hostel' || osmType === 'motel') return 'Budget'
  if (osmType === 'resort') return 'Resort'
  if (stars >= 5) return 'Luxury'
  if (stars >= 4) return 'Business'
  return 'Budget'
}

function areaFromAddress(addr, cityName) {
  return addr.suburb || addr.neighbourhood || addr.quarter || addr.road || addr.city_district || addr.town || cityName
}

function titleCase(name) {
  return String(name)
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function mapNominatimHotel(place, city) {
  const name = titleCase(place.name || (place.display_name || '').split(',')[0])
  if (!name) return null
  const osmId = `osm-${place.osm_type || 'node'}-${place.osm_id}`
  const h = hash(osmId)
  const stars = 3 + (h % 3)
  const price = 1490 + (h % 160) * 90
  const strike = Math.round(price * 1.32)
  const rating = Number((3.8 + (h % 12) / 10).toFixed(1))
  const reviews = 120 + (h % 2400)
  const osmType = place.type || place.addresstype || 'hotel'
  const amenities = ['Free Wi-Fi', 'AC rooms', 'Parking']
  if (stars >= 4) amenities.push('Restaurant', 'Room service')
  if (stars >= 5) amenities.push('Spa', 'Gym', 'Breakfast included')
  const addr = place.address || {}
  const area = areaFromAddress(addr, city.name)
  return {
    id: osmId,
    name,
    city: city.id,
    area,
    stars,
    rating,
    reviews,
    price,
    strike,
    type: mapType(stars, osmType),
    images: pickImages(osmId),
    amenities,
    about: `${name} is a mapped stay in ${area}, ${city.name} (OpenStreetMap). Nightly rate is an estimate — live rooms and inventory need a paid hotel API.`,
    rooms: rooms(price),
    source: 'osm',
    lat: Number(place.lat),
    lon: Number(place.lon)
  }
}

async function nominatimSearch(query) {
  const url = 'https://nominatim.openstreetmap.org/search?' + new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '30',
    countrycodes: 'in'
  })
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'StayTripHotelApp/1.0 (hotel-booking-preview)',
      'Accept': 'application/json'
    },
    signal: AbortSignal.timeout(20000)
  })
  if (!res.ok) throw new Error(`Nominatim ${res.status}`)
  return res.json()
}

const STAY_RE = /\b(hotel|inn|resort|lodge|stay|palace|suites?|residency|hostel|motel|haveli|guest\s?house)\b/i
const GENERIC_RE = /^(hotel|inn|resort|lodge|palace|hostel|motel)$/i
const SKIP_RE = /\b(temple|mandir|road|street|market|metro|station|airport|mall|hospital|school|college|park|garden|bridge)\b/i

function isHotelName(name, typ) {
  const n = (name || '').trim()
  if (!n || n.length < 4) return false
  if (GENERIC_RE.test(n)) return false
  if (SKIP_RE.test(n) && !STAY_RE.test(n)) return false
  const isStayType = typ === 'hotel' || typ === 'guest_house' || typ === 'hostel' || typ === 'motel' || typ === 'resort'
  return isStayType || STAY_RE.test(n)
}

export async function fetchOsmHotels(city) {
  const queries = [`hotel in ${city.name}`, `${city.name} hotel`]
  const mapped = []
  const seen = new Set()
  for (const q of queries) {
    let data = []
    try {
      data = await nominatimSearch(q)
    } catch {
      continue
    }
    for (const place of data) {
      const typ = place.type
      const name = place.name || (place.display_name || '').split(',')[0]
      if (!isHotelName(name, typ)) continue
      const hotel = mapNominatimHotel(place, city)
      if (!hotel) continue
      const key = hotel.name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      mapped.push(hotel)
    }
    if (mapped.length >= 12) break
    await new Promise((r) => setTimeout(r, 1100))
  }
  return mapped
}
