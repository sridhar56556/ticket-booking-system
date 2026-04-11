import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Train, Bus, Anchor, Star, Search, User, LogOut, Ticket, History, CheckCircle2, X, ChevronRight, CreditCard, Banknote, Landmark } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  const [screen, setScreen] = useState('welcome'); // welcome, auth, dashboard
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('book'); // book, history
  const [loading, setLoading] = useState(false);

  // Transition Helper
  const navigateTo = (scr) => {
    setLoading(true);
    setTimeout(() => {
      setScreen(scr);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="screen-container bg-black min-vh-100">
      <div className="main-overlay" />
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-black"
            style={{ zIndex: 99999 }}
          >
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 1 }} 
              className="rounded-circle border border-primary border-4"
              style={{ width: 60, height: 60, borderTopColor: 'transparent !important' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {screen === 'welcome' && (
          <WelcomeScreen key="welcome" onExplore={() => navigateTo('auth')} />
        )}
        {screen === 'auth' && (
          <AuthScreen key="auth" onLogin={(u) => { setUser(u); navigateTo('dashboard'); }} onBack={() => navigateTo('welcome')} />
        )}
        {screen === 'dashboard' && (
          <Dashboard key="dashboard" user={user} onLogout={() => navigateTo('welcome')} />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ===================== SCREENS ===================== */

const WelcomeScreen = ({ onExplore }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.1 }}
    className="vh-100 d-flex flex-column align-items-center justify-content-center text-center p-4"
  >
    <motion.h1 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="logo-text"
    >
      WELCOME
    </motion.h1>
    <motion.p 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="text-muted fs-4 mb-5"
      style={{ letterSpacing: '4px' }}
    >
      Redefining Global Travel Experience
    </motion.p>
    <motion.button 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onExplore}
      className="btn-premium px-5 py-3 fs-5"
    >
      Explore Now <ChevronRight className="ms-2" />
    </motion.button>
  </motion.div>
);

const AuthScreen = ({ onLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', mobile: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({ name: formData.name || formData.email.split('@')[0], email: formData.email });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="vh-100 d-flex align-items-center justify-content-center p-3"
    >
      <div className="col-12 col-md-5 col-lg-4 glass-card p-4 p-md-5">
        <div className="text-center mb-4">
          <Plane className="text-primary mb-3" size={48} />
          <h2 className="fw-bold">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-muted small">Access premium travel bookings</p>
        </div>

        <div className="d-flex mb-4 bg-black p-1 rounded-pill">
          <button onClick={() => setIsLogin(true)} className={`btn w-50 rounded-pill py-2 border-0 ${isLogin ? 'btn-primary shadow text-white' : 'text-muted'}`}>Login</button>
          <button onClick={() => setIsLogin(false)} className={`btn w-50 rounded-pill py-2 border-0 ${!isLogin ? 'btn-primary shadow text-white' : 'text-muted'}`}>Signup</button>
        </div>

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} key="signup-fields">
                <input type="text" placeholder="Full Name" className="form-control input-glass mb-3" required />
                <input type="tel" placeholder="Mobile Number" className="form-control input-glass mb-3" required />
              </motion.div>
            )}
          </AnimatePresence>
          <input type="email" placeholder="Email Address" className="form-control input-glass mb-3" onChange={e => setFormData({...formData, email: e.target.value})} required title="Enter a valid email" />
          <input type="password" placeholder="Password" className="form-control input-glass mb-4" required minLength={8} />
          
          <button type="submit" className="btn btn-premium w-100 py-3 mb-3">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        
        <div className="text-center">
          <button onClick={onBack} className="btn btn-link text-muted text-decoration-none small">
            <X size={14} className="me-1" /> Back to Welcome
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard = ({ user, onLogout }) => {
  const [activeView, setActiveView] = useState('book'); // book, history
  const [bookingStep, setBookingStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [service, setService] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRating, setShowRating] = useState(false);

  // Mock data
  const services = [
    { id: 'bus', name: 'Bus', icon: <Bus />, color: 'var(--bus)' },
    { id: 'train', name: 'Train', icon: <Train />, color: 'var(--train)' },
    { id: 'flight', name: 'Flight', icon: <Plane />, color: 'var(--flight)' },
    { id: 'ship', name: 'Ship', icon: <Anchor />, color: 'var(--ship)' }
  ];

  const handleSeatClick = (seat) => {
    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seat));
    } else if (selectedSeats.length < 5) {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handlePayment = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setShowRating(true);
    }, 3000);
  };

  return (
    <div className="d-flex flex-column h-100">
      {/* Search Header */}
      <nav className="p-3 border-bottom border-secondary sticky-top bg-black">
        <div className="container d-flex align-items-center gap-3">
          <h4 className="m-0 fw-bold d-none d-md-block">✈️ TravelBook</h4>
          <div className="position-relative flex-grow-1 mx-2 mx-md-5">
            <Search className="position-absolute translate-middle-y top-50 start-0 ms-3 text-muted" size={18} />
            <input 
              type="text" 
              className="form-control input-glass py-2 ps-5" 
              placeholder="Search states, cities, or districts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-link text-white p-2" onClick={() => setActiveView('history')}><History size={24} /></button>
            <button className="btn btn-premium px-3 py-2" onClick={onLogout}><LogOut size={18} /></button>
          </div>
        </div>
      </nav>

      <div className="container py-4 flex-grow-1 overflow-auto">
        {activeView === 'book' ? (
          <div className="animate__animated animate__fadeIn">
            <h2 className="fw-bold mb-4">Welcome, {user.name} 👋</h2>
            
            {/* Step Indicators */}
            <div className="d-flex gap-2 mb-4">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className="flex-grow-1 rounded-pill" style={{ height: 4, background: bookingStep >= s ? 'var(--primary)' : 'var(--glass-border)' }} />
              ))}
            </div>

            {bookingStep === 1 && (
              <div className="row g-4">
                {services.map(s => (
                  <div key={s.id} className="col-6 col-md-3">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setService(s); setBookingStep(2); }}
                      className="service-card"
                      style={{ borderColor: service?.id === s.id ? s.color : 'var(--glass-border)' }}
                    >
                      <div className="mb-3" style={{ color: s.color }}>{React.cloneElement(s.icon, { size: 48 })}</div>
                      <h5 className="m-0">{s.name}</h5>
                    </motion.div>
                  </div>
                ))}
              </div>
            )}

            {bookingStep === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="glass-card p-4">
                   <h3 className="mb-4 d-flex align-items-center"><Ticket className="me-2" /> Journey Details</h3>
                   <div className="row">
                     <div className="col-md-6 mb-3"><label className="text-muted small">FROM</label><input className="form-control input-glass" defaultValue="Hyderabad" /></div>
                     <div className="col-md-6 mb-3"><label className="text-muted small">TO</label><input className="form-control input-glass" defaultValue="Bengaluru" /></div>
                     <div className="col-md-6 mb-3"><label className="text-muted small">DATE</label><input type="date" className="form-control input-glass" /></div>
                     <div className="col-md-6 mb-3">
                        <label className="text-muted small">TIME</label>
                        <div className="d-flex gap-2">
                          <input className="form-control input-glass" defaultValue="10:30" />
                          <select className="form-select input-glass w-auto"><option>AM</option><option>PM</option></select>
                        </div>
                     </div>
                   </div>
                   <button className="btn btn-premium w-100 mt-4" onClick={() => setBookingStep(3)}>Select Seats</button>
                   <button className="btn btn-link text-muted mt-2 w-100" onClick={() => setBookingStep(1)}>Back</button>
                </div>
              </motion.div>
            )}

            {bookingStep === 3 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="glass-card p-4 text-center">
                  <h3 className="mb-4">Select Your Seats</h3>
                  <div className="d-flex justify-content-center gap-4 mb-4 small text-muted">
                    <div className="d-flex align-items-center gap-2"><div className="seat available" style={{ width: 16, height: 16 }} /> Available</div>
                    <div className="d-flex align-items-center gap-2"><div className="seat booked" style={{ width: 16, height: 16 }} /> Booked</div>
                    <div className="d-flex align-items-center gap-2"><div className="seat selected" style={{ width: 16, height: 16 }} /> Selected</div>
                  </div>
                  
                  <div className="d-inline-grid gap-3" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                    {Array.from({ length: 25 }).map((_, i) => {
                      const isBooked = [3, 7, 12, 19].includes(i);
                      const isSelected = selectedSeats.includes(i);
                      return (
                        <div 
                          key={i} 
                          className={`seat ${isBooked ? 'booked' : isSelected ? 'selected' : 'available'}`}
                          onClick={() => !isBooked && handleSeatClick(i)}
                        >
                          {i + 1}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-5 d-flex gap-3">
                    <button className="btn btn-premium flex-grow-1" disabled={selectedSeats.length === 0} onClick={() => setBookingStep(4)}>Review & Pay</button>
                    <button className="btn btn-outline-secondary rounded-pill" onClick={() => setBookingStep(2)}>Back</button>
                  </div>
                </div>
              </motion.div>
            )}

            {bookingStep === 4 && (
              <motion.div initial={{ y: 50 }} animate={{ y: 0 }}>
                <div className="glass-card p-4">
                  <h3 className="mb-4">Final Payment</h3>
                  <div className="p-3 bg-dark rounded-4 mb-4">
                    <div className="d-flex justify-content-between mb-2"><span>Tickets ({selectedSeats.length})</span><span>₹{(selectedSeats.length * 690).toFixed(2)}</span></div>
                    <div className="d-flex justify-content-between fw-bold fs-5 pt-2 border-top border-secondary"><span>Total</span><span className="text-primary">₹{(selectedSeats.length * 690).toFixed(2)}</span></div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="text-muted small mb-2">PAYMENT METHOD</label>
                    <div className="row g-3">
                      <div className="col-4"><div className="glass-card p-3 text-center border-primary bg-primary bg-opacity-10"><CreditCard className="mb-2" /><div>Card</div></div></div>
                      <div className="col-4"><div className="glass-card p-3 text-center"><Landmark className="mb-2" /><div>UPI</div></div></div>
                      <div className="col-4"><div className="glass-card p-3 text-center"><Banknote className="mb-2" /><div>Cash</div></div></div>
                    </div>
                  </div>

                  <button className="btn btn-premium w-100 py-3" onClick={handlePayment}>CONFIRM BOOKING</button>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h2 className="fw-bold m-0"><History className="me-2" /> Travel History</h2>
              <button className="btn btn-premium rounded-pill" onClick={() => setActiveView('book')}>New Booking</button>
            </div>
            <div className="glass-card overflow-hidden">
               <div className="p-4 border-bottom border-secondary d-flex justify-content-between">
                 <div>
                   <h5 className="m-0 border-start border-primary border-4 ps-3">HYD → BLR</h5>
                   <p className="text-muted small m-0 ms-3">12 April, 2024 • Flight • Indigo</p>
                 </div>
                 <div className="text-end">
                   <h5 className="m-0 text-success">₹3450.00</h5>
                   <p className="text-muted small m-0">Order ID: #FL678</p>
                 </div>
               </div>
               <div className="p-4 d-flex justify-content-between bg-white bg-opacity-5">
                 <div>
                   <h5 className="m-0 border-start border-warning border-4 ps-3">MAA → HYD</h5>
                   <p className="text-muted small m-0 ms-3">05 March, 2024 • Train • Rajdhani</p>
                 </div>
                 <div className="text-end">
                   <h5 className="m-0 text-danger text-decoration-line-through">₹850.00</h5>
                   <p className="text-danger small m-0">CANCELLED</p>
                 </div>
               </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-black bg-opacity-90"
            style={{ zIndex: 100001 }}
          >
            <div className="text-center">
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}
                className="bg-success rounded-circle d-inline-flex p-4 mb-4"
              >
                <CheckCircle2 size={80} color="white" />
              </motion.div>
              <h1 className="fw-bold">Payment Success!</h1>
              <p className="text-muted">Ticket generated and sent to email.</p>
            </div>
          </motion.div>
        )}

        {showRating && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
            style={{ zIndex: 100000, backdropFilter: 'blur(20px)' }}
          >
            <div className="col-11 col-md-5 col-lg-4 glass-card p-5 text-center shadow-lg border-warning">
              <h2 className="fw-bold mb-4">Rate Your Trip</h2>
              <div className="d-flex justify-content-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(s => (
                  <motion.button key={s} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} className="btn btn-link p-0 text-warning"><Star size={40} fill={s <= 4 ? "currentColor" : "none"}/></motion.button>
                ))}
              </div>
              <textarea className="form-control input-glass mb-4" placeholder="How was your experience?"></textarea>
              <button className="btn btn-premium w-100 py-3" onClick={() => setShowRating(false)}>Submit Feedback</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
