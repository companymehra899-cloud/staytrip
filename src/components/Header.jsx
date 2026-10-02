import { Link, NavLink, useNavigate } from 'react-router-dom'

export default function Header() {
  const navigate = useNavigate()
  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="logo">
          <span className="logo-mark">S</span>
          StayTrip
        </Link>
        <nav className="nav">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/hotels">Hotels</NavLink>
          <NavLink to="/hotels?city=delhi">Delhi NCR</NavLink>
          <NavLink to="/hotels?city=goa">Goa</NavLink>
          <NavLink to="/hotels?city=mumbai">Mumbai</NavLink>
          <NavLink to="/hotels?city=manali">Manali</NavLink>
        </nav>
        <button className="header-cta" onClick={() => navigate('/hotels')}>Book a hotel</button>
      </div>
    </header>
  )
}
