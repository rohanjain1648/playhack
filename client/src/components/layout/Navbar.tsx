import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useState, useEffect } from 'react';
import NotificationBell from '../notifications/NotificationBell';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
          <div className="navbar-logo">🏆</div>
          <div className="navbar-brand-text">
            <span className="navbar-brand-main">IITG Sports</span>
            <span className="navbar-brand-sub">Book Your Game</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar-links hide-mobile">
          <Link to="/" className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}>
            Home
          </Link>
          <Link to="/facilities" className={`nav-link ${isActive('/facilities') ? 'nav-link-active' : ''}`}>
            Facilities
          </Link>
          {isAuthenticated && (
            <Link
              to="/my-bookings"
              className={`nav-link ${isActive('/my-bookings') ? 'nav-link-active' : ''}`}
            >
              My Bookings
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`nav-link ${isActive('/admin') ? 'nav-link-active' : ''}`}
            >
              Admin
            </Link>
          )}
          <Link
            to="/race-demo"
            className={`nav-link nav-link-demo ${isActive('/race-demo') ? 'nav-link-active' : ''}`}
          >
            ⚡ Race Demo
          </Link>
        </nav>

        {/* Actions & Mobile Toggle */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <div className="nav-user" onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
                <div className="avatar">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="nav-user-name hide-mobile">{user?.name?.split(' ')[0]}</span>
                <span className="nav-chevron hide-mobile">▾</span>
              </div>
              {userDropdownOpen && (
                <div className="nav-dropdown animate-fade-in-down">
                  <div className="nav-dropdown-header">
                    <div className="font-semibold">{user?.name}</div>
                    <div className="text-xs text-muted">{user?.rollNo}</div>
                  </div>
                  <div className="nav-dropdown-divider" />
                  <Link to="/my-bookings" className="nav-dropdown-item">
                    📅 My Bookings
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="nav-dropdown-item">
                      ⚙️ Admin Dashboard
                    </Link>
                  )}
                  <Link to="/race-demo" className="nav-dropdown-item">
                    ⚡ Race Demo
                  </Link>
                  <div className="nav-dropdown-divider" />
                  <button className="nav-dropdown-item nav-dropdown-logout" onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="hide-mobile flex-items-center gap-2">
              <Link to="/login" className="btn-nav-login">Login</Link>
              <Link to="/facilities" className="btn-neon-pill-nav">⚡ Book Court →</Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            className={`hamburger-btn ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span className="ham-bar" />
            <span className="ham-bar" />
            <span className="ham-bar" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-nav-drawer animate-slide-right" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="navbar-brand">
                <span className="text-xl">🏆</span>
                <span className="font-bold text-sm">IITG Sports</span>
              </div>
              <button className="drawer-close-btn" onClick={() => setMobileMenuOpen(false)}>✕</button>
            </div>

            <div className="mobile-drawer-links">
              <Link to="/" className={`mobile-drawer-link ${isActive('/') ? 'active' : ''}`}>
                🏠 Home
              </Link>
              <Link to="/facilities" className={`mobile-drawer-link ${isActive('/facilities') ? 'active' : ''}`}>
                🏟️ Facilities & Arenas
              </Link>
              <Link to="/race-demo" className={`mobile-drawer-link ${isActive('/race-demo') ? 'active' : ''}`}>
                ⚡ Concurrency Race Demo
              </Link>

              {isAuthenticated ? (
                <>
                  <div className="mobile-drawer-sep" />
                  <Link to="/my-bookings" className={`mobile-drawer-link ${isActive('/my-bookings') ? 'active' : ''}`}>
                    📅 My Bookings & Waitlist
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className={`mobile-drawer-link ${isActive('/admin') ? 'active' : ''}`}>
                      ⚙️ Admin Dashboard
                    </Link>
                  )}
                  <div className="mobile-drawer-sep" />
                  <div className="p-3 bg-subtle rounded-lg mb-3">
                    <div className="font-bold text-sm">{user?.name}</div>
                    <div className="text-xs text-muted">{user?.rollNo} ({user?.email})</div>
                  </div>
                  <button className="btn btn-danger btn-full" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <div className="mobile-drawer-sep" />
                  <Link to="/login" className="btn btn-outline btn-full mb-2">
                    Student Login
                  </Link>
                  <Link to="/facilities" className="btn-neon-pill-nav text-center justify-center btn-full">
                    ⚡ Book a Court →
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
