// Global Variables
let currentUser = null;
let currentBooking = {
    service: '',
    operator: '',
    from: '',
    to: '',
    date: '',
    time: '',
    type: '',
    passengers: [],
    seats: [],
    baseFare: 0,
    subtotal: 0,
    gst: 0,
    discount: 0,
    total: 0,
    luggage: false
};

// Coupons
const COUPONS = {
    'FIRST10': 0.10,
    'SAVE20': 0.20,
    'FLAT15': 0.05
};

// City Multipliers
const CITY_MULTIPLIERS = {
    'DELHI_MUMBAI': 1.3,
    'MUMBAI_DELHI': 1.3,
    'HYDERABAD_BENGALURU': 1.1,
    'BENGALURU_HYDERABAD': 1.1,
    'KOLKATA_CHENNAI': 1.05
};

// Operators by Service
const OPERATORS = {
    'Bus': ['RedBus', 'TSRTC', 'VRL', 'Rajadhani'],
    'Train': ['IRCTC Express', 'Rajdhani', 'Shatabdi'],
    'Flight': ['Indigo', 'AirIndia', 'Vistara'],
    'Ship': ['Goa Ferries', 'SeaLines', 'Oceanic']
};

// Types/Classes by Service
const TYPES = {
    'Bus': [
        { value: 1, label: 'Non-AC Seater', baseMin: 200, baseMax: 500, capacity: 30 },
        { value: 2, label: 'AC Seater', baseMin: 300, baseMax: 700, capacity: 30 },
        { value: 3, label: 'AC Sleeper', baseMin: 600, baseMax: 1200, capacity: 30 },
        { value: 4, label: 'Luxury Volvo', baseMin: 900, baseMax: 1500, capacity: 30 }
    ],
    'Train': [
        { value: 1, label: 'Sleeper (SL)', baseMin: 150, baseMax: 400, capacity: 72 },
        { value: 2, label: '3AC', baseMin: 450, baseMax: 900, capacity: 72 },
        { value: 3, label: '2AC', baseMin: 800, baseMax: 1500, capacity: 72 },
        { value: 4, label: '1AC', baseMin: 1500, baseMax: 2500, capacity: 72 }
    ],
    'Flight': [
        { value: 1, label: 'Economy', baseMin: 2500, baseMax: 6000, capacity: 120 },
        { value: 2, label: 'Premium Economy', baseMin: 6000, baseMax: 9000, capacity: 120 },
        { value: 3, label: 'Business', baseMin: 9000, baseMax: 15000, capacity: 120 }
    ],
    'Ship': [
        { value: 1, label: 'Deck', baseMin: 500, baseMax: 1200, capacity: 200 },
        { value: 2, label: 'Cabin', baseMin: 1200, baseMax: 3000, capacity: 200 },
        { value: 3, label: 'Deluxe Suite', baseMin: 3000, baseMax: 6000, capacity: 200 }
    ]
};

// Utility Functions
function showToast(message, type = 'info') {
    const icons = {
        success: 'bi-check-circle-fill',
        danger: 'bi-exclamation-triangle-fill',
        warning: 'bi-exclamation-circle-fill',
        info: 'bi-info-circle-fill'
    };
    
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '11000';
    
    toastContainer.innerHTML = `
        <div class="toast show glass-card border-0" role="alert" style="background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(10px);">
            <div class="d-flex p-3 align-items-center">
                <i class="bi ${icons[type] || icons.info} text-${type} fs-4 me-3"></i>
                <div class="toast-body text-white font-weight-bold p-0">${message}</div>
                <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="toast"></button>
            </div>
            <div class="progress" style="height: 3px; background: transparent;">
                <div class="progress-bar bg-${type}" role="progressbar" style="width: 100%; transition: width 3s linear;"></div>
            </div>
        </div>
    `;
    document.body.appendChild(toastContainer);
    
    const progressBar = toastContainer.querySelector('.progress-bar');
    requestAnimationFrame(() => progressBar.style.width = '0%');
    
    setTimeout(() => {
        toastContainer.classList.add('animate__animated', 'animate__fadeOutRight');
        setTimeout(() => toastContainer.remove(), 500);
    }, 3000);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    // If already has AM/PM, return as is
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours);
    const m = (minutes || '00').padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
}

function getAmPmTime() {
    const hourVal = document.getElementById('journeyHour')?.value?.trim();
    const ampm = document.getElementById('journeyAmPm')?.value || 'AM';
    if (!hourVal) return '';
    return `${hourVal} ${ampm}`;
}

const RATING_LABELS = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent'];
let selectedModalRating = 0;

function setModalRating(val) {
    selectedModalRating = val;
    const stars = document.querySelectorAll('#modalStarRating .star');
    stars.forEach((s, i) => {
        s.classList.toggle('active', i < val);
    });
    const lbl = document.getElementById('ratingLabel');
    if (lbl) lbl.textContent = RATING_LABELS[val] || '';
}

function submitModalRating() {
    if (!selectedModalRating) {
        showToast('Please tap a star to rate your experience ⭐', 'warning');
        return;
    }
    const feedback = document.getElementById('ratingFeedbackModal')?.value?.trim() || '';
    const label = RATING_LABELS[selectedModalRating];

    // Save to the most recent booking of this user
    if (currentUser) {
        const bookings = DB.bookings.getByUserId(currentUser.id);
        if (bookings.length > 0) {
            const latest = bookings[bookings.length - 1];
            DB.bookings.update(latest.bookingId, { rating: selectedModalRating, feedback });
        }
    }

    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('ratingModal'))?.hide();
    selectedModalRating = 0;

    // Show celebration toast
    const stars = '★'.repeat(selectedModalRating) + '☆'.repeat(5 - selectedModalRating);
    showToast(`🙏 Thank you! You rated us ${stars} — ${label}`, 'success');
}

// Filtering Functionality
function filterBookings(containerId, searchId) {
    const query = document.getElementById(searchId).value.toLowerCase();
    const container = document.getElementById(containerId);
    const cards = container.getElementsByClassName('booking-card');
    
    Array.from(cards).forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(query)) {
            card.style.display = 'block';
            card.classList.add('animate__animated', 'animate__fadeIn');
        } else {
            card.style.display = 'none';
        }
    });
}

function generateBookingId(service) {
    const prefix = service.substring(0, 3).toUpperCase();
    const number = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${number}`;
}

function getJourneyKey(service, from, to, date, time) {
    return `${service}|${from.toUpperCase()}|${to.toUpperCase()}|${date}|${time}`.replace(/\s+/g, '_');
}

function getCityMultiplier(from, to) {
    const key = `${from.toUpperCase()}_${to.toUpperCase()}`.replace(/\s+/g, '_');
    return CITY_MULTIPLIERS[key] || 1.0;
}

function getRandomFare(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Screen Navigation
function hideAllMainScreens() {
    const screens = ['welcomeScreen', 'authScreen', 'dashboardScreen'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('d-none');
        }
    });
}

function showAuthScreen() {
    const welcome = document.getElementById('welcomeScreen');
    welcome.classList.add('animate__animated', 'animate__fadeOut');
    
    setTimeout(() => {
        hideAllMainScreens();
        const auth = document.getElementById('authScreen');
        auth.classList.remove('d-none');
        auth.classList.add('animate__animated', 'animate__fadeIn');
    }, 400);
}

function goToWelcome() {
    const auth = document.getElementById('authScreen');
    auth.classList.add('animate__animated', 'animate__zoomOut');
    
    setTimeout(() => {
        auth.classList.add('d-none');
        auth.classList.remove('animate__animated', 'animate__zoomOut');
        const welcome = document.getElementById('welcomeScreen');
        welcome.classList.remove('d-none');
        welcome.classList.add('animate__animated', 'animate__zoomIn');
    }, 400);
}

function checkPasswordStrength(password) {
    const bar = document.querySelector('.strength-bar');
    const feedback = document.getElementById('password-feedback');
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    bar.className = 'strength-bar';
    const levels = ['', 'strength-weak', 'strength-fair', 'strength-good', 'strength-strong'];
    if (strength > 0) bar.classList.add(levels[strength]);
    
    const messages = [
        'At least 8 characters, 1 uppercase, 1 special.',
        'Weak - Add numbers/special chars.',
        'Fair - Add special characters.',
        'Good - Looking better!',
        'Strong - Secure password! ✅'
    ];
    feedback.textContent = messages[strength];
    feedback.className = `small mt-1 px-2 mb-0 ${strength >= 3 ? 'text-success' : 'text-muted'}`;
}

function showDashboard() {
    hideAllMainScreens();

    const dashboard = document.getElementById('dashboardScreen');
    if (dashboard) {
        dashboard.classList.remove('d-none');
        dashboard.classList.add('animate__animated', 'animate__fadeIn');

        // ── Header: name + phone ──────────────────────
        document.getElementById('userName').textContent = currentUser.name;

        const phoneDisplay = currentUser.mobile
            ? currentUser.mobile.replace(/(\d{5})(\d{5})/, '$1 $2')
            : '—';
        const headerPhone = document.getElementById('headerUserPhone');
        if (headerPhone) headerPhone.textContent = phoneDisplay;

        // ── Header avatar: initials ───────────────────
        const initials = currentUser.name
            .split(' ')
            .map(w => w[0]?.toUpperCase() || '')
            .slice(0, 2)
            .join('');
        const initialsEl = document.getElementById('userInitials');
        if (initialsEl) initialsEl.textContent = initials;

        // ── Sidebar user card ─────────────────────────
        const sidebarName = document.getElementById('sidebarUserName');
        if (sidebarName) sidebarName.textContent = currentUser.name;

        const sidebarPhone = document.getElementById('sidebarUserPhone');
        if (sidebarPhone) sidebarPhone.innerHTML =
            `<i class="bi bi-telephone-fill me-1"></i>${phoneDisplay}`;

        updateWalletBadge();
        showDashboardHome();
    }
}

function updateSidebarActive(linkText) {
    const items = document.querySelectorAll('.sidebar-nav .nav-item');
    items.forEach(item => {
        item.classList.remove('active');
        if (item.textContent.toLowerCase().includes(linkText.toLowerCase())) {
            item.classList.add('active');
        }
    });
}

function hideAllDashboardSections() {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.add('d-none'));
}

function showDashboardHome() {
    hideAllDashboardSections();
    document.getElementById('dashboardHome').classList.remove('d-none');
    updateDashboardStats();
    updateSidebarActive('overview');
}

function showBooking() {
    hideAllDashboardSections();
    document.getElementById('bookingSection').classList.remove('d-none');
    resetBookingForm();
    updateSidebarActive('book ticket');
}

function showBookings() {
    hideAllDashboardSections();
    document.getElementById('myBookingsSection').classList.remove('d-none');
    loadBookings();
    updateSidebarActive('my bookings');
}

function showProfile() {
    hideAllDashboardSections();
    document.getElementById('profileSection').classList.remove('d-none');
    loadProfile();
    updateSidebarActive('profile');
}

function showHistory() {
    hideAllDashboardSections();
    document.getElementById('historySection').classList.remove('d-none');
    loadHistory();
    updateSidebarActive('history');
}

function showCancelModal(bookingId) {
    const modal = new bootstrap.Modal(document.getElementById('cancelModal'));
    document.getElementById('confirmCancelBtn').onclick = () => handleCancelBooking(bookingId);
    modal.show();
}

// ===== WALLET =====
function updateWalletBadge() {
    if (!currentUser) return;
    const wallet = DB.wallet.get(currentUser.id);
    const balance = wallet.balance || 0;
    
    // Desktop badge
    const badge = document.getElementById('walletBadge');
    if (badge) badge.textContent = `₹${Math.floor(balance)}`;
    
    // Mobile badge
    const mobileBadge = document.getElementById('mobileWalletBadge');
    if (mobileBadge) {
        mobileBadge.textContent = `₹${Math.floor(balance)}`;
        if (balance > 0) {
            mobileBadge.classList.remove('d-none');
        } else {
            mobileBadge.classList.add('d-none');
        }
    }
}

function showWallet() {
    hideAllDashboardSections();
    document.getElementById('walletSection').classList.remove('d-none');
    updateSidebarActive('wallet');

    if (!currentUser) return;
    const wallet = DB.wallet.get(currentUser.id);

    // Update balance display
    const balEl = document.getElementById('walletBalanceDisplay');
    if (balEl) balEl.textContent = `₹${wallet.balance.toFixed(2)}`;

    const countEl = document.getElementById('walletTxCount');
    if (countEl) countEl.textContent = `${wallet.transactions.length} transaction${wallet.transactions.length !== 1 ? 's' : ''}`;

    const container = document.getElementById('walletTransactions');
    if (!container) return;

    if (wallet.transactions.length === 0) {
        container.innerHTML = `
            <div class="wallet-empty-state">
                <i class="bi bi-wallet2" style="font-size:3rem;color:rgba(16,185,129,0.3);"></i>
                <p class="mt-3 text-muted">No transactions yet.<br>Cancel a booking to receive a refund here.</p>
            </div>`;
        return;
    }

    container.innerHTML = wallet.transactions.map(tx => {
        const isCredit = tx.type === 'credit';
        const dateStr  = new Date(tx.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
        return `
        <div class="wallet-tx-card">
            <div class="wallet-tx-left">
                <div class="wallet-tx-icon ${isCredit ? 'credit' : 'debit'}">
                    <i class="bi bi-${isCredit ? 'arrow-down-circle-fill' : 'arrow-up-circle-fill'}"></i>
                </div>
                <div>
                    <p class="wallet-tx-desc">${tx.description}</p>
                    <p class="wallet-tx-date">${dateStr}</p>
                    ${tx.bookingId ? `<span class="wallet-tx-ref">#${tx.bookingId}</span>` : ''}
                </div>
            </div>
            <div class="wallet-tx-amount ${isCredit ? 'credit' : 'debit'}">
                ${isCredit ? '+' : '-'}₹${tx.amount.toFixed(2)}
            </div>
        </div>`;
    }).join('');
}



// Authentication
function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const mobile = document.getElementById('signupMobile').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    
    // Validate Mobile Number (Starts with 6,7,8,9 and 10 digits)
    const phoneRegex = /^[6789]\d{9}$/;
    if (!phoneRegex.test(mobile)) {
        showToast('Invalid Mobile Number! Must start with 6, 7, 8, or 9 and have 10 digits.', 'danger');
        return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address.', 'danger');
        return;
    }

    // Validate password
    // Require: 8+ chars, Uppercase, Lowercase, Number, Special Char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        showToast('Password must be 8+ characters with uppercase, lowercase, number, and special character.', 'danger');
        return;
    }

    // Validate DOB (18+ only)
    const dob = document.getElementById('signupDOB').value;
    if (!dob) {
        showToast('Please enter your date of birth', 'warning');
        return;
    }
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    if (age < 18) {
        showToast('You must be at least 18 years old to register', 'danger');
        return;
    }
    
    // Check if user exists
    if (DB.users.findByEmail(email)) {
        showToast('Email already registered!', 'danger');
        return;
    }
    

    // Create user
    const user = DB.users.create({ name, mobile, dob, email, password });

    if (user) {
        // Auto-login the new user immediately
        currentUser = user;
        DB.session.set(user);

        // Show animated success overlay
        const successOverlay = document.getElementById('successOverlay');
        const successTitle   = document.getElementById('successTitle');
        const successSub     = document.getElementById('successSub');

        if (successTitle) successTitle.textContent = 'Account Created! 🎉';
        if (successSub)   successSub.textContent   = 'Signing you in automatically...';

        if (successOverlay) successOverlay.classList.remove('d-none');

        setTimeout(() => {
            if (successOverlay) successOverlay.classList.add('d-none');
            // Go straight to dashboard — no need to log in again
            showDashboard();
            showToast('✅ Signed in successfully! Welcome, ' + user.name.split(' ')[0] + '!', 'success');
        }, 1800);
    }
}

function handleLogin(event) {
    event.preventDefault();

    const identifier = document.getElementById('loginUsername').value.trim();
    const password   = document.getElementById('loginPassword').value;

    const user = DB.users.findByIdentifier(identifier);

    if (!user) {
        showToast('❌ No account found! Please register first.', 'danger');
        return;
    }

    if (user.password !== password) {
        showToast('❌ Incorrect password. Please try again.', 'danger');
        return;
    }

    currentUser = user;
    DB.session.set(user);

    // ── Show "Signed In Successfully" overlay ──────────────
    const overlay    = document.getElementById('successOverlay');
    const titleEl    = document.getElementById('successTitle');
    const subEl      = document.getElementById('successSub');
    const chipEl     = document.getElementById('successUserChip');

    if (titleEl) titleEl.textContent = '✅ Signed In Successfully!';
    if (subEl)   subEl.textContent   = 'Welcome back, ' + user.name + '!';
    if (chipEl) {
        chipEl.textContent = '👤 ' + user.name + '  |  📞 ' + (user.mobile || '');
        chipEl.classList.remove('d-none');
    }
    if (overlay) overlay.classList.remove('d-none');

    setTimeout(() => {
        if (overlay)  overlay.classList.add('d-none');
        if (chipEl)   chipEl.classList.add('d-none');
        showDashboard();
    }, 2000);
}

function handleLogout() {
    DB.session.clear();
    currentUser = null;
    location.reload();
}

// Dashboard Stats
function updateDashboardStats() {
    const bookings = DB.bookings.getByUserId(currentUser.id);
    const activeBookings = bookings.filter(b => !b.cancelled);
    const totalSpent = bookings.reduce((sum, b) => sum + (b.total || 0), 0);
    
    document.getElementById('totalBookings').textContent = bookings.length;
    document.getElementById('activeBookings').textContent = activeBookings.length;
    document.getElementById('totalSpent').textContent = `₹${totalSpent.toFixed(2)}`;
}

// Booking Flow
function resetBookingForm() {
    currentBooking = {
        service: '',
        operator: '',
        from: '',
        to: '',
        date: '',
        time: '',
        type: '',
        passengers: [],
        seats: [],
        baseFare: 0,
        subtotal: 0,
        gst: 0,
        discount: 0,
        total: 0,
        luggage: false
    };
    
    // Show step 1
    document.querySelectorAll('.booking-step').forEach(step => step.classList.add('d-none'));
    document.getElementById('step1').classList.remove('d-none');
    
    // Reset form
    document.getElementById('bookingForm').reset();
    document.getElementById('bookingSummary').innerHTML = '<p class="text-muted">Select a service to begin</p>';
    
    // Remove selected class from service cards
    document.querySelectorAll('.service-card').forEach(card => {
        card.classList.remove('selected');
    });
}

function selectService(service) {
    currentBooking.service = service;
    
    // Update UI
    document.querySelectorAll('.service-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.target.closest('.service-card').classList.add('selected');
    
    // Populate operators
    const operatorSelect = document.getElementById('operatorSelect');
    operatorSelect.innerHTML = '<option value="">Choose operator</option>';
    OPERATORS[service].forEach(op => {
        operatorSelect.innerHTML += `<option value="${op}">${op}</option>`;
    });
    
    // Populate types
    const typeSelect = document.getElementById('typeSelect');
    typeSelect.innerHTML = '<option value="">Choose type</option>';
    TYPES[service].forEach(type => {
        typeSelect.innerHTML += `<option value="${type.value}">${type.label}</option>`;
    });
    
    updateBookingSummary();
    
    setTimeout(() => goToStep2(), 500);
}

function updateProgressBar(activeStep) {
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`prog-${i}`);
        const line = document.getElementById(`pline-${i}`);
        if (!step) continue;
        step.classList.remove('active', 'done');
        if (activeStep > 4) {
            // All steps completed — fully green
            step.classList.add('done');
            if (line) line.classList.add('done');
        } else if (i < activeStep) {
            step.classList.add('done');
            if (line) line.classList.add('done');
        } else if (i === activeStep) {
            step.classList.add('active');
            if (line) line.classList.remove('done');
        } else {
            if (line) line.classList.remove('done');
        }
    }
}

function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'bi bi-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'bi bi-eye';
    }
}

function goToStep1() {
    document.querySelectorAll('.booking-step').forEach(step => step.classList.add('d-none'));
    document.getElementById('step1').classList.remove('d-none');
    updateProgressBar(1);
}

function goToStep2() {
    document.querySelectorAll('.booking-step').forEach(step => step.classList.add('d-none'));
    document.getElementById('step2').classList.remove('d-none');
    updateProgressBar(2);
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('journeyDate');
    dateInput.min = today;
    if (!dateInput.value) dateInput.value = today;
}

function goToStep3() {
    // Validate step 2
    const operator = document.getElementById('operatorSelect').value;
    const from = document.getElementById('fromCity').value.trim();
    const to = document.getElementById('toCity').value.trim();
    const date = document.getElementById('journeyDate').value;
    const timeVal = getAmPmTime();
    const typeValue = document.getElementById('typeSelect').value;
    const passengerCount = parseInt(document.getElementById('passengerCount').value);
    
    if (!operator || !from || !to || !date || !timeVal || !typeValue || !passengerCount) {
        showToast('Please fill all fields including the journey time', 'warning');
        return;
    }

    if (passengerCount < 1 || passengerCount > 5) {
        showToast('Number of passengers must be between 1 and 5', 'warning');
        return;
    }
    
    const journeyDateTime = new Date(`${date}T00:00:00`);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (journeyDateTime < today) {
        showToast('Cannot book a journey for a past date!', 'danger');
        return;
    }
    
    if (from.toLowerCase() === to.toLowerCase()) {
        showToast('Origin and Destination cities cannot be the same!', 'danger');
        return;
    }
    
    // Save data
    currentBooking.operator = operator;
    currentBooking.from = from;
    currentBooking.to = to;
    currentBooking.date = date;
    currentBooking.time = getAmPmTime();
    currentBooking.typeValue = typeValue;
    
    // Get type details
    const typeDetails = TYPES[currentBooking.service].find(t => t.value == typeValue);
    currentBooking.type = typeDetails.label;
    currentBooking.capacity = typeDetails.capacity;
    
    // Calculate base fare
    const multiplier = getCityMultiplier(from, to);
    currentBooking.baseFare = Math.round(getRandomFare(typeDetails.baseMin, typeDetails.baseMax) * multiplier);
    
    updateBookingSummary();
    
    document.querySelectorAll('.booking-step').forEach(step => step.classList.add('d-none'));
    document.getElementById('step3').classList.remove('d-none');
    updateProgressBar(3);
    generatePassengerForms();
}

function generatePassengerForms() {
    const count = parseInt(document.getElementById('passengerCount').value);
    const container = document.getElementById('passengerForms');
    container.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        container.innerHTML += `
            <div class="passenger-form glass-card mb-4 p-4 border-primary border-opacity-10">
                <div class="d-flex align-items-center mb-4">
                   <div class="badge bg-primary rounded-circle me-3" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">${i + 1}</div>
                   <h5 class="mb-0">Passenger ${i + 1}</h5>
                </div>
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label ms-1">Full Name</label>
                        <input type="text" class="form-control form-control-glass ps-3" placeholder="Enter name" id="pName${i}" required>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label ms-1">Age</label>
                        <input type="number" class="form-control form-control-glass ps-3" placeholder="Age" id="pAge${i}" min="12" max="100" required>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label ms-1">Gender</label>
                        <select class="form-select form-control-glass ps-3" id="pGender${i}" required>
                            <option value="">Select</option>
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                            <option value="O">Other</option>
                        </select>
                    </div>
                </div>
                <div class="mt-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <label class="form-label mb-0 fw-bold"><i class="bi bi-diagram-2 me-2"></i> Select Your Seat</label>
                    </div>
                    <div id="seatMap${i}" class="seat-container-wrapper"></div>
                </div>
            </div>
        `;
    }
    
    // Generate seat maps
    for (let i = 0; i < count; i++) {
        generateSeatMap(i);
    }
}

function generateSeatMap(passengerIndex) {
    const service = currentBooking.service;
    const typeValue = currentBooking.typeValue;
    const journeyKey = getJourneyKey(service, currentBooking.from, currentBooking.to, currentBooking.date, currentBooking.time);
    
    // Check if journey exists, if not, pre-book some random seats
    let bookedSeats = DB.seatMap.getJourney(journeyKey);
    if (bookedSeats.length === 0) {
        // Pre-book 5-15 random seats for a new journey to make it realistic
        const totalPossible = (service === 'Ship' ? 200 : (service === 'Flight' ? 120 : 72));
        const preBookCount = Math.floor(Math.random() * 15) + 10;
        const preSeats = [];
        for (let i = 0; i < preBookCount; i++) {
            const s = `S${Math.floor(Math.random() * totalPossible) + 1}`;
            if (!preSeats.includes(s)) preSeats.push(s);
        }
        DB.seatMap.bookSeats(journeyKey, preSeats);
        bookedSeats = preSeats;
    }

    const seatMapDiv = document.getElementById(`seatMap${passengerIndex}`);
    
    // Config: columns and total seats
    let cols = 4;
    let total = 40;
    if (service === 'Flight') { cols = 6; total = 60; }
    else if (service === 'Train') { cols = 8; total = 72; }
    else if (service === 'Ship') { cols = 10; total = 100; }
    
    let html = `
        <div class="seat-legend">
            <div class="legend-item"><div class="legend-box available"></div><span>Available</span></div>
            <div class="legend-item"><div class="legend-box selected"></div><span>Selected</span></div>
            <div class="legend-item"><div class="legend-box booked"></div><span>Booked</span></div>
        </div>
        <div class="seat-container">
            <div class="seat-layout-grid" style="grid-template-columns: repeat(${cols}, 1fr); max-width: ${cols * 45}px;">
    `;

    for (let s = 1; s <= total; s++) {
        const seatId = `S${s}`;
        const isBooked = bookedSeats.includes(seatId);
        const isSelected = currentBooking.seats[passengerIndex] === seatId;
        
        let className = 'seat';
        if (isBooked) className += ' booked';
        else if (isSelected) className += ' selected';
        
        const clickAttr = isBooked ? '' : `onclick="selectSeat('${seatId}', ${passengerIndex})"`;
        html += `<div class="${className}" ${clickAttr} data-seat="${seatId}">${s}</div>`;
        
        // Add Aisle Gap for certain layouts
        if (service === 'Bus' && s % 4 === 2) { html += '<div class="aisle"></div>'; }
        if (service === 'Flight' && s % 6 === 3) { html += '<div class="aisle"></div>'; }
    }

    html += `</div></div>`;
    seatMapDiv.innerHTML = html;
}

function generateSeatHTML(num, bookedSeats, passengerIndex) {
    // Deprecated for new generateSeatMap logic
    return '';
}

function selectSeat(seatId, passengerIndex) {
    const journeyKey = getJourneyKey(
        currentBooking.service,
        currentBooking.from,
        currentBooking.to,
        currentBooking.date,
        currentBooking.time
    );
    
    const bookedSeats = DB.seatMap.getJourney(journeyKey);
    
    if (bookedSeats.includes(seatId)) {
        showToast('Seat already booked!', 'warning');
        return;
    }

    // Ensure seat is not already selected by another passenger in this booking
    for (let i = 0; i < currentBooking.seats.length; i++) {
        if (i !== passengerIndex && currentBooking.seats[i] === seatId) {
            showToast('Seat already selected by another passenger', 'warning');
            return;
        }
    }
    
    // Remove previous selection for this passenger in their own map
    const seatMapDiv = document.getElementById(`seatMap${passengerIndex}`);
    if (currentBooking.seats[passengerIndex]) {
        const prevSeat = currentBooking.seats[passengerIndex];
        const prevEl = seatMapDiv.querySelector(`[data-seat="${prevSeat}"]`);
        if (prevEl) prevEl.classList.remove('selected');
    }
    
    // Add new selection
    currentBooking.seats[passengerIndex] = seatId;
    const currentEl = seatMapDiv.querySelector(`[data-seat="${seatId}"]`);
    if (currentEl) currentEl.classList.add('selected');
    
    updateBookingSummary();
}

function goToStep4() {
    // Validate passengers
    const count = parseInt(document.getElementById('passengerCount').value);
    const passengers = [];
    
    for (let i = 0; i < count; i++) {
        const name = document.getElementById(`pName${i}`).value.trim();
        const age = document.getElementById(`pAge${i}`).value;
        const gender = document.getElementById(`pGender${i}`).value;
        
        if (!name || !age || !gender) {
            showToast('Please fill all passenger details', 'warning');
            return;
        }
        
        if (parseInt(age) < 18 || parseInt(age) > 100) {
            showToast(`Passenger ${i + 1} must be between 18 and 100 years old`, 'danger');
            return;
        }
        
        passengers.push({ name, age: parseInt(age), gender });
    }
    
    currentBooking.passengers = passengers;
    currentBooking.luggage = document.getElementById('luggageCheck').checked;
    
    // Calculate totals
    calculateBill();
    
    document.querySelectorAll('.booking-step').forEach(step => step.classList.add('d-none'));
    document.getElementById('step4').classList.remove('d-none');
    updateProgressBar(4);
    
    updateBookingSummary();
}

function calculateBill() {
    const count = currentBooking.passengers.length;
    const luggageTotal = currentBooking.luggage ? 50 * count : 0;
    
    currentBooking.subtotal = (currentBooking.baseFare * count) + luggageTotal;
    currentBooking.gst = currentBooking.subtotal * 0.18;
    currentBooking.total = currentBooking.subtotal + currentBooking.gst - currentBooking.discount;
    
    // Update UI
    document.getElementById('baseFareDisplay').textContent = `₹${currentBooking.baseFare}`;
    document.getElementById('subtotalDisplay').textContent = `₹${currentBooking.subtotal.toFixed(2)}`;
    document.getElementById('gstDisplay').textContent = `₹${currentBooking.gst.toFixed(2)}`;
    document.getElementById('discountDisplay').textContent = `-₹${currentBooking.discount.toFixed(2)}`;
    document.getElementById('totalDisplay').textContent = `₹${currentBooking.total.toFixed(2)}`;
}

function applyCoupon() {
    const code = document.getElementById('couponCode').value.trim().toUpperCase();
    
    if (!code) {
        showToast('Please enter coupon code', 'warning');
        return;
    }
    
    if (COUPONS[code]) {
        currentBooking.discount = currentBooking.subtotal * COUPONS[code];
        currentBooking.couponCode = code;
        calculateBill();
        showToast(`Coupon applied! ${(COUPONS[code] * 100)}% discount`, 'success');
    } else {
        showToast('Invalid coupon code', 'danger');
    }
}

function showPaymentFields() {
    const method    = document.getElementById('paymentMethod').value;
    const container = document.getElementById('paymentFields');
    const exact     = currentBooking.total.toFixed(2);
    const rounded   = Math.ceil(currentBooking.total);

    // Update wallet option label with live balance
    if (currentUser) {
        const balance = DB.wallet.get(currentUser.id).balance;
        const walletOpt = document.getElementById('paymentMethod')
            ?.querySelector('option[value="Wallet"]');
        if (walletOpt) walletOpt.textContent = `💰 Wallet (Balance: ₹${balance.toFixed(2)})`;
    }

    const hint = `<div class="payment-hint mt-2">
        <span class="hint-exact">Exact: <strong>₹${exact}</strong></span>
        <span class="hint-sep">or</span>
        <span class="hint-rounded">Rounded: <strong>₹${rounded}</strong></span>
        <small class="d-block mt-1 text-muted">Paise are waived — pay ₹${rounded} or exact ₹${exact}</small>
    </div>`;

    if (method === 'Wallet') {
        const balance = currentUser ? DB.wallet.get(currentUser.id).balance : 0;
        const enough  = balance >= Math.round(currentBooking.total);
        container.innerHTML = `
            <div class="wallet-pay-box ${enough ? 'sufficient' : 'insufficient'}">
                <div class="wallet-pay-header">
                    <i class="bi bi-wallet2 me-2"></i>
                    <span>Wallet Balance</span>
                    <strong class="ms-auto">₹${balance.toFixed(2)}</strong>
                </div>
                <div class="wallet-pay-status">
                    ${enough
                        ? `<i class="bi bi-check-circle-fill text-success me-2"></i>
                           <span class="text-success">Sufficient balance — ₹${balance.toFixed(2)} available, ₹${exact} will be deducted</span>`
                        : `<i class="bi bi-x-circle-fill text-danger me-2"></i>
                           <span class="text-danger">Insufficient balance — you need ₹${exact} but only have ₹${balance.toFixed(2)}</span>`
                    }
                </div>
                ${!enough ? `<p class="text-muted small mt-2 mb-0">💡 Cancel a booking to get a refund in your wallet, or choose another payment method.</p>` : ''}
            </div>`;
    } else if (method === 'UPI') {
        container.innerHTML = `
            <div class="mb-3">
                <label class="form-label">UPI ID</label>
                <input type="text" class="form-control form-control-glass" id="upiId" placeholder="yourname@upi" pattern="[a-zA-Z0-9.\\-]{3,}@[a-zA-Z]{3,}" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Payment Amount (₹)</label>
                <input type="number" class="form-control form-control-glass" id="paymentAmount" placeholder="Enter ₹${rounded}" required>
                ${hint}
            </div>`;
    } else if (method === 'Card') {
        container.innerHTML = `
            <div class="mb-3">
                <label class="form-label">Card Number</label>
                <input type="text" class="form-control form-control-glass" id="cardNumber" placeholder="16-digit card number" pattern="\\d{16}" maxlength="16" required>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Expiry (MM/YY)</label>
                    <input type="text" class="form-control form-control-glass" id="cardExpiry" placeholder="MM/YY" pattern="\\d{2}/\\d{2}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">CVV</label>
                    <input type="text" class="form-control form-control-glass" id="cardCvv" placeholder="4 digits" pattern="\\d{4}" maxlength="4" required>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Payment Amount (₹)</label>
                <input type="number" class="form-control form-control-glass" id="paymentAmount" placeholder="Enter ₹${rounded}" required>
                ${hint}
            </div>`;
    } else if (method === 'Cash') {
        container.innerHTML = `
            <div class="mb-3">
                <label class="form-label">Cash Amount (₹)</label>
                <input type="number" class="form-control form-control-glass" id="paymentAmount" placeholder="Enter ₹${rounded}" required>
                ${hint}
            </div>`;
    } else {
        container.innerHTML = '';
    }
}

// Handle booking form submission
document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleBookingSubmit();
        });
    }
    
    // Check if user is logged in (disabled auto-redirect to show Welcome first)
    /*
    const savedUser = DB.session.get();
    if (savedUser) {
        currentUser = savedUser;
        showDashboard();
    }
    */
});

function handleBookingSubmit() {
    // Check if user already has an active booking
    const userBookings = DB.bookings.getByUserId(currentUser.id);
    const activeBooking = userBookings.find(b => !b.cancelled);
    if (activeBooking) {
        showToast('You already have an active booking. Please complete or cancel it first.', 'warning');
        return;
    }

    const paymentMethod = document.getElementById('paymentMethod').value;

    if (!paymentMethod) {
        showToast('Please select a payment method', 'warning');
        return;
    }

    const exactTotal  = parseFloat(currentBooking.total.toFixed(2));
    const roundedUp   = Math.ceil(exactTotal);
    const roundedNorm = Math.round(exactTotal);


    // ── WALLET PAYMENT ──────────────────────────────────────
    if (paymentMethod === 'Wallet') {
        const wallet = DB.wallet.get(currentUser.id);
        // Compare against exactTotal (not rounded) — ₹534.60 CAN pay ₹534.54
        if (wallet.balance < exactTotal) {
            showToast(
                `❌ Insufficient wallet balance! Have ₹${wallet.balance.toFixed(2)}, need ₹${exactTotal.toFixed(2)}`,
                'danger'
            );
            return;
        }
        // Deduct exact amount from wallet
        DB.wallet.debit(
            currentUser.id,
            exactTotal,
            `Payment for booking: ${currentBooking.from} → ${currentBooking.to} (${currentBooking.service})`
        );
        updateWalletBadge();
        // Wallet payment validated — proceed to booking creation below

    } else if (paymentMethod === 'UPI') {
        // Validate entered amount
        const enteredAmount = parseFloat(document.getElementById('paymentAmount')?.value);
        const isValidPay = !isNaN(enteredAmount) && (
            Math.abs(enteredAmount - exactTotal) < 0.01 ||
            enteredAmount === roundedUp ||
            enteredAmount === roundedNorm
        );
        if (!isValidPay) {
            showToast(`Enter ₹${exactTotal.toFixed(2)} or rounded ₹${roundedNorm} / ₹${roundedUp}`, 'danger');
            return;
        }
        const upiId = document.getElementById('upiId').value;
        if (!upiId.match(/[a-zA-Z0-9._\-]{3,}@[a-zA-Z]{3,}/)) {
            showToast('Invalid UPI ID format', 'danger');
            return;
        }

    } else if (paymentMethod === 'Card') {
        // Validate entered amount
        const enteredAmount = parseFloat(document.getElementById('paymentAmount')?.value);
        const isValidPay = !isNaN(enteredAmount) && (
            Math.abs(enteredAmount - exactTotal) < 0.01 ||
            enteredAmount === roundedUp ||
            enteredAmount === roundedNorm
        );
        if (!isValidPay) {
            showToast(`Enter ₹${exactTotal.toFixed(2)} or rounded ₹${roundedNorm} / ₹${roundedUp}`, 'danger');
            return;
        }
        const cardNumber = document.getElementById('cardNumber').value;
        const cvv        = document.getElementById('cardCvv').value;
        if (!cardNumber.match(/^\d{16}$/)) {
            showToast('Invalid card number — must be 16 digits', 'danger');
            return;
        }
        if (!cvv.match(/^\d{4}$/)) {
            showToast('Invalid CVV — must be 4 digits', 'danger');
            return;
        }

    } else if (paymentMethod === 'Cash') {
        // Validate entered amount
        const enteredAmount = parseFloat(document.getElementById('paymentAmount')?.value);
        const isValidPay = !isNaN(enteredAmount) && (
            Math.abs(enteredAmount - exactTotal) < 0.01 ||
            enteredAmount === roundedUp ||
            enteredAmount === roundedNorm
        );
        if (!isValidPay) {
            showToast(`Enter ₹${exactTotal.toFixed(2)} or rounded ₹${roundedNorm} / ₹${roundedUp}`, 'danger');
            return;
        }
    }


    // Create booking
    const bookingId = generateBookingId(currentBooking.service);
    const journeyKey = getJourneyKey(
        currentBooking.service,
        currentBooking.from,
        currentBooking.to,
        currentBooking.date,
        currentBooking.time
    );
    
    const booking = {
        bookingId,
        userId: currentUser.id,
        service: currentBooking.service,
        operator: currentBooking.operator,
        from: currentBooking.from,
        to: currentBooking.to,
        date: currentBooking.date,
        time: currentBooking.time,
        type: currentBooking.type,
        passengers: currentBooking.passengers,
        seats: currentBooking.seats,
        total: currentBooking.total,
        paymentMethod,
        luggage: currentBooking.luggage,
        cancelled: false,
        createdAt: new Date().toISOString(),
        rating: 0,
        feedback: ''
    };
    
    // Save booking
    DB.bookings.create(booking);
    
    // Book seats
    DB.seatMap.bookSeats(journeyKey, currentBooking.seats);
    
    // Success Animation Flow
    const successOverlay = document.getElementById('successOverlay');
    const successTitle = document.getElementById('successTitle');
    const successSub = document.getElementById('successSub');
    
    if (successTitle) successTitle.textContent = 'Payment Confirmed';
    if (successSub) successSub.textContent = 'Your journey begins here.';
    
    successOverlay.classList.remove('d-none');
    
    setTimeout(() => {
        successOverlay.classList.add('d-none');
        
        // Mark all progress steps green
        updateProgressBar(5);
        
        // Show receipt
        showReceipt(booking);
        
        // Reset form
        resetBookingForm();
        
        showToast('🎉 Booking confirmed! Your journey begins!', 'success');
        updateDashboardStats();
        
        // Show rating modal ONCE per booking — not on every payment
        if (!booking._ratingShown) {
            booking._ratingShown = true;
            setTimeout(() => {
                selectedModalRating = 0;
                document.querySelectorAll('#modalStarRating .star').forEach(s => s.classList.remove('active'));
                const lbl = document.getElementById('ratingLabel');
                if (lbl) lbl.textContent = '';
                const feedbackEl = document.getElementById('ratingFeedbackModal');
                if (feedbackEl) feedbackEl.value = '';
                // Show rating after receipt has appeared
                setTimeout(() => {
                    const ratingModal = new bootstrap.Modal(document.getElementById('ratingModal'), { backdrop: 'static' });
                    ratingModal.show();
                }, 600);
            }, 1800);
        }
    }, 2500);
}

function showReceipt(booking) {
    const modal = new bootstrap.Modal(document.getElementById('receiptModal'));
    const content = document.getElementById('receiptContent');
    
    let passengersHtml = '';
    booking.passengers.forEach((p, i) => {
        passengersHtml += `
            <tr>
                <td>${i + 1}</td>
                <td>${p.name}</td>
                <td>${p.age}</td>
                <td>${p.gender}</td>
                <td>${booking.seats[i] || '-'}</td>
            </tr>
        `;
    });
    
    content.innerHTML = `
        <div class="receipt">
            <div class="receipt-header text-center">
                <h3>BOOKING RECEIPT</h3>
                <p class="text-success fw-bold">PAYMENT SUCCESSFUL</p>
            </div>
            
            <div class="receipt-row">
                <strong>Booking ID:</strong>
                <span>${booking.bookingId}</span>
            </div>
            <div class="receipt-row">
                <strong>Service:</strong>
                <span>${booking.service} (${booking.operator})</span>
            </div>
            <div class="receipt-row">
                <strong>Route:</strong>
                <span>${booking.from} → ${booking.to}</span>
            </div>
            <div class="receipt-row">
                <strong>Date & Time:</strong>
                <span>${formatDate(booking.date)} at <span class="text-primary font-weight-bold">${formatTime(booking.time)}</span></span>
            </div>
            <div class="receipt-row">
                <strong>Type/Class:</strong>
                <span>${booking.type}</span>
            </div>
            
            <h6 class="mt-4 mb-3">Passengers & Seats:</h6>
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Age</th>
                        <th>Gender</th>
                        <th>Seat</th>
                    </tr>
                </thead>
                <tbody>
                    ${passengersHtml}
                </tbody>
            </table>
            
            <div class="receipt-row">
                <strong>Total Fare:</strong>
                <span class="receipt-total">₹${booking.total.toFixed(2)}</span>
            </div>
            <div class="receipt-row">
                <strong>Payment Mode:</strong>
                <span>${booking.paymentMethod}</span>
            </div>
            
            <div class="text-center mt-4">
                <p class="text-muted">Thank you for booking with us!</p>
            </div>
        </div>
    `;
    
    modal.show();
    // Rating is handled by the star-rating modal in handleBookingSubmit — no prompt() here
}

function updateBookingSummary() {
    const summary = document.getElementById('bookingSummary');
    if (!summary) return;

    if (!currentBooking.service) {
        summary.innerHTML = '<p class="text-muted small text-center mt-2">Select a service to begin</p>';
        return;
    }

    const serviceColors = { Bus: '#fb923c', Train: '#38bdf8', Flight: '#c084fc', Ship: '#2dd4bf' };
    const serviceIcons  = { Bus: '🚌', Train: '🚆', Flight: '✈️', Ship: '🚢' };
    const color = serviceColors[currentBooking.service] || '#8b5cf6';
    const icon  = serviceIcons[currentBooking.service]  || '🎫';

    // Detect which step is active
    const step4Visible = !document.getElementById('step4')?.classList.contains('d-none');
    const step3Visible = !document.getElementById('step3')?.classList.contains('d-none');
    const step2Visible = !document.getElementById('step2')?.classList.contains('d-none');

    const row = (label, val, highlight = false) =>
        `<div class="summary-row">${highlight
            ? `<span style="color:${color};font-weight:700;">${label}</span><span style="color:${color};font-weight:800;">${val}</span>`
            : `<span>${label}</span><span>${val}</span>`
        }</div>`;

    let html = `<div class="summary-row" style="border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:10px;margin-bottom:10px;">
        <span style="font-weight:800;color:${color};font-size:1rem;">${icon} ${currentBooking.service}</span>
        ${currentBooking.operator ? `<span class="text-muted small">${currentBooking.operator}</span>` : ''}
    </div>`;

    // Step 2+ details
    if (currentBooking.from && currentBooking.to) {
        html += row('Route', `${currentBooking.from} → ${currentBooking.to}`);
    }
    if (currentBooking.date)  html += row('Date', formatDate(currentBooking.date));
    if (currentBooking.time)  html += row('Time', currentBooking.time);
    if (currentBooking.type)  html += row('Class', currentBooking.type);

    // Step 3+ details
    if (step3Visible || step4Visible) {
        const pCount = parseInt(document.getElementById('passengerCount')?.value) || 0;
        if (pCount > 0) html += row('Passengers', pCount);
        if (currentBooking.seats?.filter(Boolean).length > 0) {
            html += row('Seats', currentBooking.seats.filter(Boolean).join(', '));
        }
        if (currentBooking.baseFare > 0) {
            html += row('Base Fare / person', `₹${currentBooking.baseFare}`);
        }
    }

    // Step 4 ONLY — show full fare breakdown
    if (step4Visible && currentBooking.total > 0) {
        html += `<div style="border-top:1px solid rgba(255,255,255,0.08);margin-top:12px;padding-top:12px;">`;
        html += row('Subtotal', `₹${currentBooking.subtotal?.toFixed(2) || '--'}`);
        html += row('GST (18%)', `<span style="color:#f59e0b;">₹${currentBooking.gst?.toFixed(2) || '--'}</span>`);
        if (currentBooking.discount > 0) {
            html += row('Discount', `<span style="color:#10b981;">-₹${currentBooking.discount?.toFixed(2)}</span>`);
        }
        html += `</div>`;
        html += `<div class="summary-total" style="color:${color};">
            Total: ₹${currentBooking.total.toFixed(2)}
            <div style="font-size:0.7rem;color:rgba(255,255,255,0.4);font-weight:500;margin-top:2px;">
                or pay ₹${Math.ceil(currentBooking.total)} (rounded)
            </div>
        </div>`;
    } else if (!step4Visible && currentBooking.baseFare > 0) {
        html += `<div class="summary-row" style="margin-top:10px;opacity:0.5;">
            <span style="font-size:0.75rem;">💡 Price shown at payment step</span>
        </div>`;
    }

    summary.innerHTML = html;
}

// Load Bookings
function loadBookings() {
    const bookings = DB.bookings.getByUserId(currentUser.id);
    const container = document.getElementById('bookingsList');
    
    if (bookings.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No bookings found</div>';
        return;
    }
    
    let html = '';
    bookings.forEach(booking => {
        const statusClass = booking.cancelled ? 'status-cancelled' : 'status-active';
        const statusText = booking.cancelled ? 'CANCELLED' : 'ACTIVE';
        
        html += `
            <div class="card booking-card ${booking.cancelled ? 'cancelled' : ''}">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h5>${booking.bookingId}</h5>
                            <p class="mb-1"><strong>${booking.service}</strong> - ${booking.operator}</p>
                            <p class="mb-1">${booking.from} → ${booking.to}</p>
                             <p class="mb-0 text-muted">${formatDate(booking.date)} at ${formatTime(booking.time)}</p>
                        </div>
                        <div class="col-md-4 text-end">
                            <span class="status-badge ${statusClass}">${statusText}</span>
                            <h5 class="mt-2">₹${booking.total.toFixed(2)}</h5>
                            <button class="btn btn-sm btn-primary mt-2" onclick="viewBookingDetails('${booking.bookingId}')">View Details</button>
                            ${!booking.cancelled ? `<button class="btn btn-sm btn-danger mt-2" onclick="cancelBooking('${booking.bookingId}')">Cancel</button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function viewBookingDetails(bookingId) {
    const booking = DB.bookings.findById(bookingId);
    if (booking) {
        showReceipt(booking);
    }
}

function cancelBooking(bookingId) {
    const booking = DB.bookings.findById(bookingId);
    
    if (booking.cancelled) {
        showToast('Booking already cancelled', 'warning');
        return;
    }
    
    // Check if it's too late to cancel (e.g., past journey date or within 2 hours)
    const journeyDateTime = new Date(`${booking.date}T${booking.time}`);
    const now = new Date();
    
    if (journeyDateTime < now) {
        showToast('Cannot cancel past or ongoing journeys', 'danger');
        return;
    }

    // Release seats
    const journeyKey = getJourneyKey(
        booking.service,
        booking.from,
        booking.to,
        booking.date,
        booking.time
    );
    
    // Show modal for reason
    showCancelModal(bookingId);
}

function handleCancelBooking(bookingId) {
    const reason = document.getElementById('cancelReason').value;
    if (!reason) {
        showToast('Please select a reason', 'warning');
        return;
    }

    const booking = DB.bookings.findById(bookingId);
    if (!booking) return;

    // Release seats
    const journeyKey = getJourneyKey(booking.service, booking.from, booking.to, booking.date, booking.time);
    DB.seatMap.releaseSeats(journeyKey, booking.seats);

    // Cancel booking
    DB.bookings.cancel(bookingId, reason);

    // Calculate refund (80% of paid total — 20% cancellation fee)
    const cancellationFee = booking.total * 0.20;
    const refundAmount    = parseFloat((booking.total - cancellationFee).toFixed(2));

    // Credit wallet
    DB.wallet.credit(
        currentUser.id,
        refundAmount,
        `Refund for cancelled booking ${bookingId} (${booking.from} → ${booking.to})`,
        bookingId
    );

    // Update wallet badge in sidebar
    updateWalletBadge();

    bootstrap.Modal.getInstance(document.getElementById('cancelModal')).hide();

    showToast(
        `✅ Booking cancelled! ₹${refundAmount.toFixed(2)} refunded to your Wallet (20% fee deducted).`,
        'success'
    );

    loadBookings();
    updateDashboardStats();
}

// Profile
function loadProfile() {
    document.getElementById('profileName').value = currentUser.name;
    document.getElementById('profileMobile').value = currentUser.mobile;
    document.getElementById('profileEmail').value = currentUser.email;
}

function updateProfile(event) {
    event.preventDefault();
    
    const name = document.getElementById('profileName').value.trim();
    const mobile = document.getElementById('profileMobile').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    
    // Validate Mobile
    const phoneRegex = /^[6789]\d{9}$/;
    if (!phoneRegex.test(mobile)) {
        showToast('Invalid Mobile Number! Must start with 6, 7, 8, or 9 and have 10 digits.', 'danger');
        return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address.', 'danger');
        return;
    }

    DB.users.update(currentUser.id, { name, mobile, email });
    currentUser.name = name;
    currentUser.mobile = mobile;
    currentUser.email = email;
    
    DB.session.set(currentUser);
    
    showToast('Profile updated successfully!', 'success');
    document.getElementById('userName').textContent = name;
}

// Travel History
function loadHistory() {
    const bookings = DB.bookings.getByUserId(currentUser.id);
    const container = document.getElementById('historyList');
    
    if (bookings.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No travel history</div>';
        return;
    }
    
    // Sort by date
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    let html = '<div class="table-responsive"><table class="table table-hover"><thead><tr><th>Booking ID</th><th>Service</th><th>Route</th><th>Date</th><th>Status</th><th>Amount</th></tr></thead><tbody>';
    
    bookings.forEach(booking => {
        const statusClass = booking.cancelled ? 'text-danger' : 'text-success';
        const statusText = booking.cancelled ? 'CANCELLED' : 'COMPLETED';
        
        html += `
            <tr onclick="viewBookingDetails('${booking.bookingId}')" style="cursor: pointer;">
                <td>${booking.bookingId}</td>
                <td>${booking.service}</td>
                <td>${booking.from} → ${booking.to}</td>
                <td>${formatDate(booking.date)}</td>
                <td class="${statusClass}">${statusText}</td>
                <td>₹${booking.total.toFixed(2)}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// ── Mobile Navigation Helpers ──
function updateMobileNav(clickedBtn) {
    const btns = document.querySelectorAll('.mobile-nav-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    clickedBtn.classList.add('active');
}