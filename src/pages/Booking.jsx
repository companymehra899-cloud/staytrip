import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createBooking, fetchHotel, formatInr, nightsBetween } from '../api.js'

export default function Booking() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const roomId = params.get('room') || 'deluxe'
  const checkIn = params.get('checkIn') || new Date().toISOString().slice(0, 10)
  const checkOut = params.get('checkOut') || ''
  const guests = Number(params.get('guests') || 2)
  const city = params.get('city') || ''
  const nights = nightsBetween(checkIn, checkOut)

  const [hotel, setHotel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', phone: '', requests: '', pay: 'upi' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let live = true
    fetchHotel(id, city)
      .then((h) => { if (live) setHotel(h) })
      .catch(() => { if (live) setHotel(null) })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [id, city])

  const room = hotel?.rooms.find((r) => r.id === roomId) || hotel?.rooms[0]

  const totals = useMemo(() => {
    if (!room) return { room: 0, tax: 0, total: 0 }
    return {
      room: room.price * nights,
      tax: room.tax * nights,
      total: (room.price + room.tax) * nights
    }
  }, [room, nights])

  if (loading) {
    return <div className="container" style={{ padding: 40 }}><div className="empty">Loading booking…</div></div>
  }

  if (!hotel || !room) {
    return <div className="container" style={{ padding: 40 }}><div className="empty">Booking not available. <Link to="/hotels">Browse hotels</Link></div></div>
  }

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Please fill name, email and phone.')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('Enter a valid email address.')
      return
    }
    if (!/^[0-9]{10}$/.test(form.phone)) {
      setError('Enter a 10-digit mobile number.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const booking = await createBooking({
        hotelId: hotel.id,
        room: room.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        pay: form.pay,
        requests: form.requests,
        checkIn,
        checkOut,
        guests,
        nights
      })
      sessionStorage.setItem('staytrip_booking', JSON.stringify(booking))
      navigate('/confirmation')
    } catch (err) {
      setError(err.message || 'Booking failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container" style={{ padding: '28px 0 48px' }}>
      <h1 style={{ marginBottom: 18 }}>Review & book</h1>
      <div className="detail-wrap">
        <form className="form" onSubmit={submit} style={{ background: '#fff', padding: 20, borderRadius: 16, border: '1px solid var(--line)' }}>
          <h3>Guest details</h3>
          <div className="form-row">
            <div className="field">
              <label>Full name</label>
              <input name="name" value={form.name} onChange={onChange} placeholder="As on ID" />
            </div>
            <div className="field">
              <label>Email</label>
              <input name="email" value={form.email} onChange={onChange} placeholder="you@email.com" />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Mobile</label>
              <input name="phone" value={form.phone} onChange={onChange} placeholder="10-digit number" />
            </div>
            <div className="field">
              <label>Payment</label>
              <select name="pay" value={form.pay} onChange={onChange}>
                <option value="upi">UPI</option>
                <option value="card">Debit / Credit card</option>
                <option value="netbanking">Net banking</option>
                <option value="hotel">Pay at hotel</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Special requests</label>
            <input name="requests" value={form.requests} onChange={onChange} placeholder="Late check-in, extra bed..." />
          </div>
          {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
          <button className="book-btn" type="submit" disabled={saving}>{saving ? 'Confirming…' : `Pay ${formatInr(totals.total)} & confirm`}</button>
        </form>

        <aside className="sticky-book">
          <h3>{hotel.name}</h3>
          <p className="muted">{room.name}</p>
          <p className="muted">{nights} night{nights > 1 ? 's' : ''} · {guests} guest{guests > 1 ? 's' : ''}</p>
          <p className="muted">{checkIn} to {checkOut || '—'}</p>
          <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '14px 0' }} />
          <div className="row"><span>Room</span><span>{formatInr(totals.room)}</span></div>
          <div className="row"><span>Taxes</span><span>{formatInr(totals.tax)}</span></div>
          <div className="row" style={{ marginTop: 10, fontWeight: 800 }}>
            <span>Total</span><span>{formatInr(totals.total)}</span>
          </div>
        </aside>
      </div>
    </div>
  )
}
