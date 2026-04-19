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

    // Show celebration toast
    const stars = '★'.repeat(selectedModalRating) + '☆'.repeat(5 - selectedModalRating);
    showToast(`🙏 Thank you! You rated us ${stars} — ${label}`, 'success');

    selectedModalRating = 0;

    // Return to main booking page (Dashboard Home)
    showDashboardHome();
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
        // Show animated success overlay with checkmark
        const successOverlay = document.getElementById('successOverlay');
        const successTitle   = document.getElementById('successTitle');
        const successSub     = document.getElementById('successSub');

        if (successTitle) successTitle.textContent = 'Account Created! ✅';
        if (successSub)   successSub.textContent   = 'Registration successful! Please login with your details.';

        if (successOverlay) {
            successOverlay.classList.remove('d-none');
        }

        setTimeout(() => {
            if (successOverlay) successOverlay.classList.add('d-none');
            
            // Switch to Login Tab
            const loginTab = document.getElementById('login-tab');
            if (loginTab) {
                loginTab.click();
            }
            
            // Reset signup form
            event.target.reset();
            
            showToast('✅ Registration successful! Please log in.', 'success');
        }, 3000);
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

    // ── Show "Signed In Successfully" overlay with checkmark ──────────────
    const overlay    = document.getElementById('successOverlay');
    const titleEl    = document.getElementById('successTitle');
    const subEl      = document.getElementById('successSub');
    const chipEl     = document.getElementById('successUserChip');

    if (titleEl) titleEl.textContent = 'Welcome Back! 👋';
    if (subEl)   subEl.textContent   = 'Signed in successfully as ' + user.name;
    if (chipEl) {
        chipEl.textContent = '👤 ' + user.name + '  |  📞 ' + (user.mobile || '');
        chipEl.classList.remove('d-none');
    }
    if (overlay) overlay.classList.remove('d-none');

    setTimeout(() => {
        if (overlay)  overlay.classList.add('d-none');
        if (chipEl)   chipEl.classList.add('d-none');
        showDashboard();

        // Add Welcome Notification
        addNotification({
            title: 'Welcome Back! 👋',
            message: `Great to see you again, ${user.name}. Your dashboard is ready.`,
            type: 'info'
        });
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

    // Strict time format check (e.g. 12:09 is valid, 12:9 is invalid)
    const hourPart = document.getElementById('journeyHour')?.value?.trim() || '';
    if (!hourPart.match(/^(1[0-2]|[1-9]):[0-5][0-9]$/)) {
        showToast('Invalid time format! Please enter minutes as two digits (e.g., 12:09)', 'danger');
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

// ══════════════════════════════════════════════════════
// PAYMENT METHOD SELECTION & RENDERING SYSTEM
// ══════════════════════════════════════════════════════

// Bank data for Card & Online Banking
const BANKS = [
    { id: 'sbi',    name: 'State Bank of India', short: 'SBI',   css: 'bank-sbi' },
    { id: 'icici',  name: 'ICICI Bank',          short: 'ICICI', css: 'bank-icici' },
    { id: 'hdfc',   name: 'HDFC Bank',           short: 'HDFC',  css: 'bank-hdfc' },
    { id: 'axis',   name: 'Axis Bank',           short: 'AXIS',  css: 'bank-axis' },
    { id: 'kotak',  name: 'Kotak Mahindra',      short: 'KMB',   css: 'bank-kotak' },
    { id: 'pnb',    name: 'Punjab National Bank', short: 'PNB',  css: 'bank-pnb' },
    { id: 'bob',    name: 'Bank of Baroda',      short: 'BOB',   css: 'bank-bob' },
    { id: 'canara', name: 'Canara Bank',         short: 'CNB',   css: 'bank-canara' },
    { id: 'union',  name: 'Union Bank',          short: 'UBI',   css: 'bank-union' },
    { id: 'idbi',   name: 'IDBI Bank',           short: 'IDBI',  css: 'bank-idbi' }
];

let selectedPayMethod = '';
let selectedBank = null;

function selectPayMethod(method) {
    selectedPayMethod = method;
    selectedBank = null;

    // Update hidden select for backward compat
    const sel = document.getElementById('paymentMethod');
    if (sel) sel.value = method;

    // Visual active state
    document.querySelectorAll('.pay-method-card').forEach(c => {
        c.classList.toggle('active', c.dataset.method === method);
    });

    // Show Pay Now button
    const payBtn = document.getElementById('payNowBtn');
    if (payBtn) payBtn.style.display = (method === 'Cash') ? 'none' : 'block';

    // Render the payment form
    showPaymentFields();
}

function showPaymentFields() {
    const method    = selectedPayMethod || document.getElementById('paymentMethod')?.value || '';
    const container = document.getElementById('paymentFields');
    if (!container) return;

    const exact     = currentBooking.total.toFixed(2);
    const rounded   = Math.ceil(currentBooking.total);

    if (!method) {
        container.innerHTML = '';
        return;
    }

    // ── CARD PAYMENT ──────────────────────────────────────
    if (method === 'Card') {
        container.innerHTML = `
            <div class="pay-form-card">
                <div class="pay-form-title"><i class="bi bi-credit-card-2-front text-primary"></i> Select Your Bank</div>
                <div class="bank-grid" id="cardBankGrid">
                    ${BANKS.map(b => `
                        <div class="bank-card" data-bank="${b.id}" onclick="selectBank('${b.id}', 'card')">
                            <div class="bank-logo ${b.css}">${b.short}</div>
                            <div class="bank-info">
                                <div class="bank-name">${b.name}</div>
                                <div class="bank-type">Debit / Credit</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div id="cardFormArea"></div>
            </div>`;

    // ── ONLINE BANKING ──────────────────────────────────────
    } else if (method === 'OnlineBanking') {
        container.innerHTML = `
            <div class="pay-form-card">
                <div class="pay-form-title"><i class="bi bi-bank2 text-success"></i> Choose Your Bank</div>
                <div class="bank-grid" id="netBankGrid">
                    ${BANKS.map(b => `
                        <div class="bank-card" data-bank="${b.id}" onclick="selectBank('${b.id}', 'net')">
                            <div class="bank-logo ${b.css}">${b.short}</div>
                            <div class="bank-info">
                                <div class="bank-name">${b.name}</div>
                                <div class="bank-type">Net Banking</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div id="netBankFormArea"></div>
            </div>`;

    // ── UPI PAYMENT ──────────────────────────────────────
    } else if (method === 'UPI') {
        container.innerHTML = `
            <div class="pay-form-card">
                <div class="pay-form-title"><i class="bi bi-phone text-danger"></i> UPI Payment</div>
                <p class="text-muted small mb-3">Select your UPI app or enter your UPI ID directly</p>
                <div class="upi-apps-grid">
                    <div class="upi-app-chip active" onclick="selectUpiApp(this)">
                        <div class="upi-app-icon" style="background:linear-gradient(135deg,#4285f4,#34a853);color:white;">G</div>
                        Google Pay
                    </div>
                    <div class="upi-app-chip" onclick="selectUpiApp(this)">
                        <div class="upi-app-icon" style="background:linear-gradient(135deg,#5f259f,#7b2ff7);color:white;">P</div>
                        PhonePe
                    </div>
                    <div class="upi-app-chip" onclick="selectUpiApp(this)">
                        <div class="upi-app-icon" style="background:linear-gradient(135deg,#002970,#00457c);color:white;">P</div>
                        Paytm
                    </div>
                    <div class="upi-app-chip" onclick="selectUpiApp(this)">
                        <div class="upi-app-icon" style="background:linear-gradient(135deg,#e74c3c,#c0392b);color:white;">B</div>
                        BHIM
                    </div>
                </div>
                <div class="mb-3 mt-3">
                    <label class="form-label fw-bold"><i class="bi bi-at me-1"></i>Enter UPI ID</label>
                    <input type="text" class="form-control form-control-glass" id="upiId" placeholder="9347389152@upi or name@upi" autocomplete="new-password" spellcheck="false" required>
                    <small class="text-muted">Example: 9876543210@upi, john@okaxis</small>
                </div>
                <div class="pay-form-card" style="background:rgba(168,85,247,0.12); border: 2px solid rgba(168,85,247,0.3); padding:20px; margin-top:16px;">
                    <div class="d-flex justify-content-between align-items-center">
                        <span style="color:rgba(255,255,255,0.9); font-weight:600;">Amount to Pay</span>
                        <span class="fs-2 fw-bold" style="color:#d8b4fe; text-shadow: 0 0 20px rgba(168,85,247,0.6);">₹${rounded}</span>
                    </div>
                    <div class="d-flex justify-content-between mt-1">
                        <small style="color:rgba(216,180,254,0.6);">Payment via ${document.querySelector('.upi-app-chip.active')?.textContent.trim() || 'UPI'}</small>
                        <small style="color:rgba(255,255,255,0.4);">Exact: ₹${exact}</small>
                    </div>
                </div>
            </div>`;

    // ── CASH PAYMENT ──────────────────────────────────────
    } else if (method === 'Cash') {
        const payBtn = document.getElementById('payNowBtn');
        if (payBtn) payBtn.style.display = 'none';

        container.innerHTML = `
            <div class="cash-total-card">
                <p class="text-muted small mb-1 text-uppercase fw-bold" style="letter-spacing:2px;">Total Amount Due</p>
                <div class="cash-total-amount">₹${rounded}</div>
                <p class="text-muted small">Exact: ₹${exact} (paise waived)</p>
                <button type="button" class="cash-confirm-btn" onclick="handleCashPayment()">
                    <i class="bi bi-cash-coin me-2"></i> Confirm Cash Payment
                </button>
                <p class="text-muted small mt-3"><i class="bi bi-info-circle me-1"></i>Pay the above amount at the counter before boarding</p>
            </div>`;

    // ── WALLET PAYMENT ──────────────────────────────────────
    } else if (method === 'Wallet') {
        const balance = currentUser ? DB.wallet.get(currentUser.id).balance : 0;
        const total   = Math.ceil(currentBooking.total);
        const enough  = balance >= total;
        
        container.innerHTML = `
            <div style="animation: payFormSlideIn 0.3s ease;">
                <div class="pay-form-card" style="background:rgba(124,58,237,0.08); border: 2px solid rgba(124,58,237,0.25); padding:20px;">
                    <div class="d-flex align-items-center mb-3">
                        <div class="user-avatar-glass me-3" style="width:50px; height:50px; background:rgba(124,58,237,0.2); border-color:rgba(124,58,237,0.4);">
                            <i class="bi bi-wallet2" style="color:#a78bfa;"></i>
                        </div>
                        <div>
                            <div class="fw-bold">Virtual Wallet</div>
                            <div class="text-muted small">Safe & Instant Payment</div>
                        </div>
                        <div class="ms-auto text-end">
                            <div class="text-muted small">Available Balance</div>
                            <div class="fw-bold fs-5" style="color:#a78bfa;">₹${balance.toFixed(2)}</div>
                        </div>
                    </div>

                    <div class="p-3 rounded-4 mb-3" style="background:rgba(255,255,255,0.03); border:1px border:rgba(255,255,255,0.05);">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="text-muted">Booking Total</span>
                            <span class="fw-bold text-white">₹${total}</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-muted">Status</span>
                            ${enough 
                                ? '<span class="badge rounded-pill bg-success bg-opacity-10 text-success"><i class="bi bi-check-circle me-1"></i>Sufficient</span>'
                                : '<span class="badge rounded-pill bg-danger bg-opacity-10 text-danger"><i class="bi bi-exclamation-triangle me-1"></i>Insufficient Balance</span>'
                            }
                        </div>
                    </div>

                    <div class="pay-form-card" style="background:rgba(139,92,246,0.1); border:1px solid rgba(139,92,246,0.2); padding:16px;">
                        <div class="d-flex justify-content-between align-items-center">
                            <span style="color:rgba(255,255,255,0.8); font-weight:600;">Net Payable</span>
                            <span class="fs-2 fw-bold" style="color:#c084fc; text-shadow: 0 0 15px rgba(168,85,247,0.4);">₹${total}</span>
                        </div>
                    </div>
                </div>
                ${!enough ? `
                <div class="alert alert-warning bg-opacity-10 border-warning border-opacity-25 text-warning mt-3 rounded-4" style="background:rgba(251,191,36,0.05);">
                    <i class="bi bi-info-circle-fill me-2"></i>
                    Your balance is ₹${balance.toFixed(2)}. Please cancel a previous booking to get a refund or choose another payment method.
                </div>` : ''}
            </div>`;
        
        const payBtn = document.getElementById('payNowBtn');
        if (payBtn) {
            payBtn.style.display = enough ? 'block' : 'none';
        }
    } else {
        container.innerHTML = '';
    }
}

// ── Select a bank (Card or Net Banking) ──
function selectBank(bankId, type) {
    selectedBank = BANKS.find(b => b.id === bankId);
    if (!selectedBank) return;

    const exact   = currentBooking.total.toFixed(2);
    const rounded = Math.ceil(currentBooking.total);

    // Update bank card active state
    const gridId = type === 'card' ? 'cardBankGrid' : 'netBankGrid';
    document.querySelectorAll(`#${gridId} .bank-card`).forEach(c => {
        c.classList.toggle('selected', c.dataset.bank === bankId);
    });

    const formAreaId = type === 'card' ? 'cardFormArea' : 'netBankFormArea';
    const formArea = document.getElementById(formAreaId);
    if (!formArea) return;

    const bankDisplay = `
        <div class="selected-bank-display">
            <div class="bank-logo ${selectedBank.css}">${selectedBank.short}</div>
            <div>
                <div class="fw-bold">${selectedBank.name}</div>
                <div class="text-muted small">${type === 'card' ? 'Debit / Credit Card' : 'Net Banking'}</div>
            </div>
            <i class="bi bi-check-circle-fill text-success ms-auto fs-5"></i>
        </div>`;

    if (type === 'card') {
        formArea.innerHTML = `
            <div style="margin-top:20px; animation: payFormSlideIn 0.3s ease;">
                ${bankDisplay}
                <div class="mb-3">
                    <label class="form-label">Cardholder Name</label>
                    <input type="text" class="form-control form-control-glass" id="cardHolderName" placeholder="Name on card" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Card Number</label>
                    <input type="text" class="form-control form-control-glass" id="cardNumber" placeholder="Enter any 16 digits" maxlength="19" oninput="formatCardNumber(this)" autocomplete="new-password" spellcheck="false" required>
                    <small class="text-muted mt-1 d-block"><i class="bi bi-info-circle me-1"></i>Format: 16 digits total</small>
                </div>
                <div class="row">
                    <div class="col-4 mb-3">
                        <label class="form-label">CVV</label>
                        <input type="password" class="form-control form-control-glass" id="cardCvv" placeholder="•••" maxlength="4" required>
                    </div>
                    <div class="col-4 mb-3">
                        <label class="form-label">Amount (₹)</label>
                        <input type="number" class="form-control form-control-glass" id="paymentAmount" value="${rounded}" required>
                    </div>
                    <div class="col-4 mb-3">
                        <label class="form-label">PIN</label>
                        <input type="password" class="form-control form-control-glass" id="cardPin" placeholder="4-digit PIN" maxlength="4" autocomplete="new-password" required>
                    </div>
                </div>
                <div class="pay-form-card" style="background:rgba(59,130,246,0.1); border: 2px solid rgba(59,130,246,0.3); padding:20px; margin-top:16px;">
                    <div class="d-flex justify-content-between align-items-center">
                        <span style="color:rgba(255,255,255,0.9); font-weight:600;">Total Payable</span>
                        <span class="fs-2 fw-bold" style="color:#60a5fa; text-shadow: 0 0 20px rgba(59,130,246,0.5);">₹${rounded}</span>
                    </div>
                    <div class="d-flex justify-content-between mt-1">
                        <small style="color:rgba(96,165,250,0.6);">Processing Fee: ₹0.00</small>
                        <small style="color:rgba(255,255,255,0.4);">Exact: ₹${exact}</small>
                    </div>
                </div>
            </div>`;
    } else {
        // Net Banking form
        formArea.innerHTML = `
            <div style="margin-top:20px; animation: payFormSlideIn 0.3s ease;">
                ${bankDisplay}
                <div class="mb-3">
                    <label class="form-label">Account Number</label>
                    <input type="text" class="form-control form-control-glass" id="accountNumber" placeholder="Enter 9-18 digit account number" autocomplete="new-password" spellcheck="false" required>
                    <small class="text-muted mt-1 d-block"><i class="bi bi-info-circle me-1"></i>Supports any input from 9 to 18 digits</small>
                </div>
                <div class="mb-3">
                    <label class="form-label">Transaction PIN</label>
                    <input type="password" class="form-control form-control-glass" id="netPin" placeholder="Enter any 4-digit PIN" maxlength="4" autocomplete="new-password" required>
                    <small class="text-muted mt-1 d-block"><i class="bi bi-shield-lock me-1"></i>Secure 4-digit transaction PIN</small>
                </div>
                <div class="pay-form-card" style="background:rgba(0,255,127,0.12); border: 2px solid rgba(0,255,127,0.3); padding:20px; margin-top:16px;">
                    <div class="d-flex justify-content-between align-items-center">
                        <span style="color:rgba(255,255,255,0.9); font-weight:600;">Amount to Pay</span>
                        <span class="fs-2 fw-bold" style="color:#00ff7f; text-shadow: 0 0 20px rgba(0,255,127,0.5);">₹${rounded}</span>
                    </div>
                    <div class="d-flex justify-content-between mt-1">
                        <small style="color:rgba(16,185,129,0.7);">Seamless Bank Transfer</small>
                        <small style="color:rgba(255,255,255,0.4);">Exact: ₹${exact}</small>
                    </div>
                </div>
            </div>`;
    }

    // Show pay button
    const payBtn = document.getElementById('payNowBtn');
    if (payBtn) payBtn.style.display = 'block';
}

// ── Format card number with spaces ──
function formatCardNumber(input) {
    let val = input.value.replace(/\D/g, '');
    val = val.substring(0, 16);
    val = val.replace(/(.{4})/g, '$1 ').trim();
    input.value = val;
}

// ── Select UPI app ──
function selectUpiApp(el) {
    document.querySelectorAll('.upi-app-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
}

// ── Cash payment handler ──
function handleCashPayment() {
    // Already set by selectPayMethod, but ensure here
    document.getElementById('paymentMethod').value = 'Cash';
    selectedPayMethod = 'Cash';
    handleBookingSubmit();
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
        const upiId = (document.getElementById('upiId')?.value || '').trim();
        // Permissive validation: requires only '@' to support phone@upi or name@upi
        if (!upiId || !upiId.includes('@')) {
            showToast('Please enter a valid UPI ID (e.g. 9347389152@upi or john@upi)', 'danger');
            return;
        }

    } else if (paymentMethod === 'Card') {
        // Validate bank selected
        if (!selectedBank) {
            showToast('Please select a bank first', 'warning');
            return;
        }
        const cardHolderName = document.getElementById('cardHolderName')?.value?.trim();
        if (!cardHolderName) {
            showToast('Please enter cardholder name', 'warning');
            return;
        }
        const cardNumber = (document.getElementById('cardNumber')?.value || '').replace(/\s/g, '');
        if (!cardNumber.match(/^\d{16}$/)) {
            showToast('Invalid card number — must be 16 digits', 'danger');
            return;
        }
        const cvv = document.getElementById('cardCvv')?.value || '';
        if (!cvv.match(/^\d{3,4}$/)) {
            showToast('Invalid CVV — must be 3 or 4 digits', 'danger');
            return;
        }
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
        const cardPin = document.getElementById('cardPin')?.value || '';
        if (!cardPin.match(/^\d{4}$/)) {
            showToast('Please enter a valid 4-digit PIN', 'danger');
            return;
        }

    } else if (paymentMethod === 'OnlineBanking') {
        // Validate bank selected
        if (!selectedBank) {
            showToast('Please select a bank first', 'warning');
            return;
        }
        const accountNum = (document.getElementById('accountNumber')?.value || '').trim();
        // Specific check for < 9 digits
        if (accountNum.length > 0 && accountNum.length < 9) {
            showToast('Bank account is not sufficient', 'danger');
            return;
        }
        // General numeric and length (9-18) check
        if (!accountNum.match(/^\d{9,18}$/)) {
            showToast('Invalid account number — must be 9 to 18 digits', 'danger');
            return;
        }
        const netPin = document.getElementById('netPin')?.value || '';
        // Check if exactly 4 digits
        if (!netPin.match(/^\d{4}$/)) {
            showToast('Invalid PIN — must be exactly 4 digits', 'danger');
            return;
        }

    } else if (paymentMethod === 'Cash') {
        // Cash — confirmed via button
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
    
    // ── STEP 1: Show Processing Overlay ──
    const processingOverlay = document.createElement('div');
    processingOverlay.className = 'pay-processing-overlay';
    processingOverlay.innerHTML = `
        <div class="pay-processing-spinner"></div>
        <div class="pay-processing-text">Processing Payment...</div>
        <div class="pay-processing-sub">Please wait, do not close this page</div>
    `;
    document.body.appendChild(processingOverlay);

    setTimeout(() => {
        // Remove processing overlay
        processingOverlay.remove();

        // ── STEP 2: Show Green Checkmark Success ──
        const successOverlay = document.getElementById('successOverlay');
        const successTitle = document.getElementById('successTitle');
        const successSub = document.getElementById('successSub');
        
        if (successTitle) successTitle.textContent = 'Payment Successful! ✅';
        if (successSub) successSub.textContent = `₹${currentBooking.total.toFixed(2)} paid via ${paymentMethod}`;
        
        successOverlay.classList.remove('d-none');

        // Add Notification
        addNotification({
            title: 'Booking Confirmed! 🎫',
            message: `Your ${currentBooking.service} ticket (${bookingId}) from ${currentBooking.from} to ${currentBooking.to} is booked successfully.`,
            type: 'success'
        });
        
        setTimeout(() => {
            successOverlay.classList.add('d-none');
            
            // Mark all progress steps green
            updateProgressBar(5);
            
            // Show receipt
            showReceipt(booking);
            
            // Reset form & payment state
            resetBookingForm();
            selectedPayMethod = '';
            selectedBank = null;
            
            showToast('🎉 Booking confirmed! Your journey begins!', 'success');
            updateDashboardStats();
            
            // ── STEP 3: Show Star Rating Modal ──
            setTimeout(() => {
                selectedModalRating = 0;
                document.querySelectorAll('#modalStarRating .star').forEach(s => s.classList.remove('active'));
                const lbl = document.getElementById('ratingLabel');
                if (lbl) lbl.textContent = '';
                const feedbackEl = document.getElementById('ratingFeedbackModal');
                if (feedbackEl) feedbackEl.value = '';
                
                setTimeout(() => {
                    const ratingModal = new bootstrap.Modal(document.getElementById('ratingModal'), { backdrop: 'static' });
                    ratingModal.show();
                }, 600);
            }, 1500);
        }, 2500);
    }, 1800);
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
    const serviceColors = { Bus: '#fb923c', Train: '#38bdf8', Flight: '#c084fc', Ship: '#2dd4bf' };

    bookings.forEach(booking => {
        const statusClass = booking.cancelled ? 'status-cancelled' : 'status-active';
        const statusText = booking.cancelled ? 'CANCELLED' : 'ACTIVE';
        const color = serviceColors[booking.service] || '#8b5cf6';
        
        html += `
            <div class="card booking-card ${booking.cancelled ? 'cancelled' : ''}" style="border-left: 4px solid ${color};">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h5 style="color: ${color}; font-weight: 800; letter-spacing: 1px;">${booking.bookingId}</h5>
                            <p class="mb-1" style="color: #fff; opacity: 0.9;">
                                <strong style="color: ${color}">${booking.service}</strong> 
                                <span style="opacity: 0.7; margin: 0 5px;">|</span> 
                                <span style="color: #cbd5e1;">${booking.operator}</span>
                            </p>
                            <p class="mb-1" style="color: #f8fafc; font-weight: 500;">
                                ${booking.from} <i class="bi bi-arrow-right mx-2" style="color: ${color}"></i> ${booking.to}
                            </p>
                            <p class="mb-0" style="color: #94a3b8; font-size: 0.9rem;">
                                <i class="bi bi-calendar3 me-1"></i> ${formatDate(booking.date)} 
                                <span class="mx-2">at</span> 
                                <i class="bi bi-clock me-1"></i> ${formatTime(booking.time)}
                            </p>
                        </div>
                        <div class="col-md-4 text-end">
                            <div class="mb-2">
                                <span class="status-badge ${statusClass}">${statusText}</span>
                            </div>
                            <h4 class="fw-bold mb-0" style="color: ${color}; text-shadow: 0 0 10px ${color}40;">
                                ₹${booking.total.toFixed(2)}
                            </h4>
                            <div class="mt-3">
                                <button class="btn btn-sm btn-primary-glass px-3" onclick="viewBookingDetails('${booking.bookingId}')">
                                    <i class="bi bi-receipt me-1"></i> Details
                                </button>
                                ${!booking.cancelled ? `
                                <button class="btn btn-sm btn-danger-glass px-3" onclick="cancelBooking('${booking.bookingId}')">
                                    <i class="bi bi-x-circle me-1"></i> Cancel
                                </button>` : ''}
                            </div>
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

    // Add Notification
    addNotification({
        title: 'Booking Cancelled ❌',
        message: `Your booking ${bookingId} has been cancelled. ₹${refundAmount.toFixed(2)} refunded to your wallet.`,
        type: 'danger'
    });
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

// ==========================================================================
// NOTIFICATION LOGIC
// ==========================================================================

function updateNotificationUI() {
    if (!currentUser) return;
    const notifs = DB.notifications.get(currentUser.id);
    const badge = document.getElementById('notificationBadge');
    const list = document.getElementById('notificationList');
    
    if (!badge || !list) return;

    // Badge Count
    const unreadCount = notifs.filter(n => !n.read).length;
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.classList.remove('d-none');
    } else {
        badge.classList.add('d-none');
    }

    // List rendering
    if (notifs.length === 0) {
        list.innerHTML = `
            <div class="notif-empty">
                <i class="bi bi-bell-slash"></i>
                <p>No notifications yet</p>
            </div>`;
        return;
    }

    list.innerHTML = notifs.map(n => `
        <div class="notif-item ${n.read ? '' : 'unread'} notif-${n.type}">
            <div class="d-flex align-items-start">
                <div class="notif-icon">
                    <i class="bi ${n.type === 'success' ? 'bi-patch-check-fill' : 
                                   n.type === 'danger' ? 'bi-x-circle-fill' : 
                                   n.type === 'warning' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'}"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="notif-title">${n.title}</div>
                    <div class="notif-msg">${n.message}</div>
                    <div class="notif-time">${formatTimeAgo(n.date)}</div>
                </div>
            </div>
        </div>
    `).join('');
}

function addNotification(notif) {
    if (!currentUser) return;
    DB.notifications.add(currentUser.id, notif);
    updateNotificationUI();
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;
    const isHidden = dropdown.classList.contains('d-none');
    
    if (isHidden) {
        dropdown.classList.remove('d-none');
        // Mark all as read when opening
        if (currentUser) {
            DB.notifications.markAllAsRead(currentUser.id);
            // We refresh the UI after a small delay to let user see "unread" state for a split second
            setTimeout(() => updateNotificationUI(), 400);
        }
    } else {
        dropdown.classList.add('d-none');
    }
}

function clearNotifications() {
    if (!currentUser) return;
    DB.notifications.clear(currentUser.id);
    updateNotificationUI();
}

function formatTimeAgo(dateStr) {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000000) === 0 ? 1 : Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return formatDate(dateStr);
}

// Close notifications when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notificationDropdown');
    const btn = document.getElementById('notificationBtn');
    if (dropdown && !dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.classList.add('d-none');
    }
});

// Update updateDashboardStats to also refresh notifications
const originalUpdateDashboardStats = window.updateDashboardStats;
window.updateDashboardStats = function() {
    if (typeof originalUpdateDashboardStats === 'function') originalUpdateDashboardStats();
    updateNotificationUI();
};

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

// ==========================================================================
// CITY AUTOCOMPLETE — OpenStreetMap Nominatim API (FREE, no API key)
// ==========================================================================

(function() {
    const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
    const DEBOUNCE_MS = 350;
    const MIN_CHARS = 2;
    let activeDropdown = null;
    let debounceTimers = {};

    // ── Place type classification ──
    function getPlaceTypeClass(type) {
        type = (type || '').toLowerCase();
        if (['city', 'municipality', 'metropolis'].includes(type)) return 'city-type';
        if (['town', 'district', 'suburb', 'borough', 'quarter'].includes(type)) return 'town-type';
        if (['village', 'hamlet', 'locality', 'isolated_dwelling'].includes(type)) return 'village-type';
        return 'default-type';
    }

    function getPlaceIcon(type) {
        type = (type || '').toLowerCase();
        if (['city', 'municipality', 'metropolis'].includes(type)) return 'bi-buildings';
        if (['town', 'district', 'suburb'].includes(type)) return 'bi-building';
        if (['village', 'hamlet'].includes(type)) return 'bi-house-door';
        if (['state', 'region', 'province', 'county'].includes(type)) return 'bi-map';
        return 'bi-geo-alt-fill';
    }

    // ── Parse display name into city + region ──
    function parsePlaceName(displayName) {
        const parts = displayName.split(',').map(p => p.trim());
        const cityName = parts[0] || '';
        const region = parts.slice(1, -1).join(', '); // Skip last (country)
        const country = parts[parts.length - 1] || '';
        return { cityName, region, country };
    }

    // ── Highlight matching text ──
    function highlightMatch(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<span class="match">$1</span>');
    }

    // ── Fetch places from Nominatim ──
    async function searchPlaces(query) {
        try {
            const params = new URLSearchParams({
                q: query,
                format: 'json',
                addressdetails: 1,
                limit: 8,
                'accept-language': 'en'
            });

            const response = await fetch(`${NOMINATIM_URL}?${params}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Nominatim API error');
            return await response.json();
        } catch (err) {
            console.error('City search error:', err);
            return [];
        }
    }

    // ── Render dropdown content ──
    function renderDropdown(dropdownEl, results, query, inputEl) {
        if (results.length === 0) {
            dropdownEl.innerHTML = `
                <div class="city-dropdown-empty">
                    <i class="bi bi-search"></i>
                    No places found for "<strong>${query}</strong>"
                    <br><small>Try a different spelling</small>
                </div>`;
            dropdownEl.classList.add('active');
            return;
        }

        let html = '';
        results.forEach((place, index) => {
            const { cityName, region, country } = parsePlaceName(place.display_name);
            const placeType = place.type || place.class || '';
            const typeClass = getPlaceTypeClass(placeType);
            const icon = getPlaceIcon(placeType);

            html += `
                <div class="city-dropdown-item" data-index="${index}" 
                     data-display="${cityName}, ${region ? region.split(',')[0] : country}"
                     data-lat="${place.lat}" data-lon="${place.lon}">
                    <div class="city-icon ${typeClass}">
                        <i class="bi ${icon}"></i>
                    </div>
                    <div class="city-info">
                        <div class="city-name">${highlightMatch(cityName, query)}</div>
                        <div class="city-region">${region || ''}</div>
                    </div>
                    <span class="city-country-badge">${country}</span>
                </div>`;
        });

        html += '<div class="city-dropdown-footer">🌍 Powered by OpenStreetMap</div>';
        dropdownEl.innerHTML = html;
        dropdownEl.classList.add('active');

        // ── Click handlers for items ──
        dropdownEl.querySelectorAll('.city-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const displayVal = item.getAttribute('data-display');
                inputEl.value = displayVal;
                dropdownEl.classList.remove('active');
                dropdownEl.innerHTML = '';
                // Trigger any change handlers
                inputEl.dispatchEvent(new Event('change', { bubbles: true }));
            });
        });
    }

    // ── Show loading state ──
    function showLoading(dropdownEl) {
        dropdownEl.innerHTML = `
            <div class="city-dropdown-loading">
                <i class="bi bi-arrow-repeat"></i>
                Searching places...
            </div>`;
        dropdownEl.classList.add('active');
    }

    // ── Initialize autocomplete on an input ──
    function initCityAutocomplete(inputEl) {
        const inputId = inputEl.id;
        const dropdownEl = document.getElementById(`${inputId}-dropdown`);
        if (!dropdownEl) return;

        let activeIndex = -1;

        // ── Input handler with debounce ──
        inputEl.addEventListener('input', function() {
            const query = this.value.trim();

            // Clear existing timer
            if (debounceTimers[inputId]) {
                clearTimeout(debounceTimers[inputId]);
            }

            if (query.length < MIN_CHARS) {
                dropdownEl.classList.remove('active');
                dropdownEl.innerHTML = '';
                activeIndex = -1;
                return;
            }

            showLoading(dropdownEl);
            activeDropdown = dropdownEl;

            debounceTimers[inputId] = setTimeout(async () => {
                const results = await searchPlaces(query);
                renderDropdown(dropdownEl, results, query, inputEl);
                activeIndex = -1;
            }, DEBOUNCE_MS);
        });

        // ── Keyboard navigation ──
        inputEl.addEventListener('keydown', function(e) {
            const items = dropdownEl.querySelectorAll('.city-dropdown-item');
            if (!items.length) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeIndex = Math.min(activeIndex + 1, items.length - 1);
                items.forEach((item, i) => item.classList.toggle('active', i === activeIndex));
                items[activeIndex]?.scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIndex = Math.max(activeIndex - 1, 0);
                items.forEach((item, i) => item.classList.toggle('active', i === activeIndex));
                items[activeIndex]?.scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeIndex >= 0 && items[activeIndex]) {
                    items[activeIndex].click();
                }
            } else if (e.key === 'Escape') {
                dropdownEl.classList.remove('active');
                activeIndex = -1;
            }
        });

        // ── Focus handler: re-show if there are results ──
        inputEl.addEventListener('focus', function() {
            if (dropdownEl.querySelector('.city-dropdown-item')) {
                dropdownEl.classList.add('active');
                activeDropdown = dropdownEl;
            }
        });
    }

    // ── Click outside to close ──
    document.addEventListener('click', function(e) {
        document.querySelectorAll('.city-dropdown.active').forEach(dd => {
            const input = dd.previousElementSibling;
            if (!dd.contains(e.target) && e.target !== input) {
                dd.classList.remove('active');
            }
        });
    });

    // ── Initialize all city autocomplete inputs ──
    function initAllAutocompletes() {
        document.querySelectorAll('.city-autocomplete').forEach(input => {
            initCityAutocomplete(input);
        });
    }

    // Init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllAutocompletes);
    } else {
        initAllAutocompletes();
    }

    // Expose for dynamically added inputs
    window.initCityAutocomplete = initCityAutocomplete;
})();