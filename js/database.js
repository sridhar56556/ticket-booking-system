// Database Management using LocalStorage
const DB = {
    // Initialize database
    init() {
        if (!localStorage.getItem('tbs_users')) {
            localStorage.setItem('tbs_users', JSON.stringify([]));
        }
        if (!localStorage.getItem('tbs_bookings')) {
            localStorage.setItem('tbs_bookings', JSON.stringify([]));
        }
        if (!localStorage.getItem('tbs_seatMap')) {
            localStorage.setItem('tbs_seatMap', JSON.stringify({}));
        }
    },

    // User Operations
    users: {
        getAll() {
            return JSON.parse(localStorage.getItem('tbs_users') || '[]');
        },
        
        findByEmail(email) {
            const users = this.getAll();
            return users.find(u => u.email === email);
        },
        
        findByUsername(username) {
            const users = this.getAll();
            return users.find(u => u.name === username);
        },

        findByIdentifier(identifier) {
            const users = this.getAll();
            const iden = identifier.toLowerCase().trim();
            return users.find(u => 
                u.name.toLowerCase().trim() === iden || 
                u.email.toLowerCase().trim() === iden || 
                u.mobile.trim() === iden
            );
        },
        
        create(userData) {
            const users = this.getAll();
            const newUser = {
                id: Date.now().toString(),
                name: userData.name,
                mobile: userData.mobile,
                email: userData.email,
                password: userData.password,
                createdAt: new Date().toISOString()
            };
            users.push(newUser);
            localStorage.setItem('tbs_users', JSON.stringify(users));
            return newUser;
        },
        
        update(userId, updates) {
            const users = this.getAll();
            const index = users.findIndex(u => u.id === userId);
            if (index !== -1) {
                users[index] = { ...users[index], ...updates };
                localStorage.setItem('tbs_users', JSON.stringify(users));
                return users[index];
            }
            return null;
        }
    },

    // Booking Operations
    bookings: {
        getAll() {
            return JSON.parse(localStorage.getItem('tbs_bookings') || '[]');
        },
        
        getByUserId(userId) {
            const bookings = this.getAll();
            return bookings.filter(b => b.userId === userId);
        },
        
        findById(bookingId) {
            const bookings = this.getAll();
            return bookings.find(b => b.bookingId === bookingId);
        },
        
        create(bookingData) {
            const bookings = this.getAll();
            bookings.push(bookingData);
            localStorage.setItem('tbs_bookings', JSON.stringify(bookings));
            return bookingData;
        },
        
        update(bookingId, updates) {
            const bookings = this.getAll();
            const index = bookings.findIndex(b => b.bookingId === bookingId);
            if (index !== -1) {
                bookings[index] = { ...bookings[index], ...updates };
                localStorage.setItem('tbs_bookings', JSON.stringify(bookings));
                return bookings[index];
            }
            return null;
        },
        
        cancel(bookingId, reason) {
            return this.update(bookingId, { cancelled: true, cancelReason: reason });
        }
    },

    // Seat Map Operations
    seatMap: {
        getAll() {
            return JSON.parse(localStorage.getItem('tbs_seatMap') || '{}');
        },
        
        getJourney(journeyKey) {
            const seatMap = this.getAll();
            return seatMap[journeyKey] || [];
        },
        
        bookSeats(journeyKey, seats) {
            const seatMap = this.getAll();
            if (!seatMap[journeyKey]) {
                seatMap[journeyKey] = [];
            }
            seatMap[journeyKey].push(...seats);
            localStorage.setItem('tbs_seatMap', JSON.stringify(seatMap));
        },
        
        releaseSeats(journeyKey, seats) {
            const seatMap = this.getAll();
            if (seatMap[journeyKey]) {
                seatMap[journeyKey] = seatMap[journeyKey].filter(s => !seats.includes(s));
                localStorage.setItem('tbs_seatMap', JSON.stringify(seatMap));
            }
        }
    },

    // Session Management
    session: {
        set(user) {
            sessionStorage.setItem('tbs_currentUser', JSON.stringify(user));
        },
        
        get() {
            const user = sessionStorage.getItem('tbs_currentUser');
            return user ? JSON.parse(user) : null;
        },
        
        clear() {
            sessionStorage.removeItem('tbs_currentUser');
        }
    },

    // ===== WALLET OPERATIONS =====
    wallet: {
        _key(userId) { return `tbs_wallet_${userId}`; },

        get(userId) {
            const raw = localStorage.getItem(this._key(userId));
            return raw ? JSON.parse(raw) : { balance: 0, transactions: [] };
        },

        credit(userId, amount, description, bookingId = '') {
            const wallet = this.get(userId);
            wallet.balance = parseFloat((wallet.balance + amount).toFixed(2));
            wallet.transactions.unshift({
                id: Date.now().toString(),
                type: 'credit',
                amount: parseFloat(amount.toFixed(2)),
                description,
                bookingId,
                date: new Date().toISOString()
            });
            localStorage.setItem(this._key(userId), JSON.stringify(wallet));
            return wallet;
        },

        debit(userId, amount, description) {
            const wallet = this.get(userId);
            if (wallet.balance < amount) return null; // insufficient
            wallet.balance = parseFloat((wallet.balance - amount).toFixed(2));
            wallet.transactions.unshift({
                id: Date.now().toString(),
                type: 'debit',
                amount: parseFloat(amount.toFixed(2)),
                description,
                date: new Date().toISOString()
            });
            localStorage.setItem(this._key(userId), JSON.stringify(wallet));
            return wallet;
        }
    },

    // Clear all data (for testing)
    clearAll() {
        localStorage.removeItem('tbs_users');
        localStorage.removeItem('tbs_bookings');
        localStorage.removeItem('tbs_seatMap');
        sessionStorage.removeItem('tbs_currentUser');
        // Wallet keys are per-user so clear all tbs_wallet_ keys
        Object.keys(localStorage).filter(k => k.startsWith('tbs_wallet_')).forEach(k => localStorage.removeItem(k));
        this.init();
    }
};

// Initialize database on load
DB.init();