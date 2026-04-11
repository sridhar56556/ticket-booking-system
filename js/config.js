// Configuration file for Travel Booking System

const CONFIG = {
    // Application Settings
    APP_NAME: 'Travel Booking System',
    APP_VERSION: '1.0.0',
    
    // API Settings (for backend integration)
    USE_API: false, // Set to true to use PHP backend instead of localStorage
    API_BASE_URL: 'http://localhost/travel-booking-system/api.php',
    
    // Coupon Codes
    COUPONS: {
        'FIRST10': {
            discount: 0.10,
            description: '10% off on first booking',
            minAmount: 0
        },
        'SAVE20': {
            discount: 0.20,
            description: '20% off on all bookings',
            minAmount: 1000
        },
        'FLAT15': {
            discount: 0.05,
            description: 'Flat ₹15 off',
            minAmount: 500
        }
    },
    
    // City Multipliers (for dynamic pricing)
    CITY_MULTIPLIERS: {
        'DELHI_MUMBAI': 1.3,
        'MUMBAI_DELHI': 1.3,
        'HYDERABAD_BENGALURU': 1.1,
        'BENGALURU_HYDERABAD': 1.1,
        'KOLKATA_CHENNAI': 1.05,
        'CHENNAI_KOLKATA': 1.05,
        'DELHI_BENGALURU': 1.25,
        'BENGALURU_DELHI': 1.25
    },
    
    // Service Operators
    OPERATORS: {
        'Bus': ['RedBus', 'TSRTC', 'VRL', 'Rajadhani', 'KSRTC', 'Orange Travels'],
        'Train': ['IRCTC Express', 'Rajdhani', 'Shatabdi', 'Duronto', 'Garib Rath'],
        'Flight': ['Indigo', 'AirIndia', 'Vistara', 'SpiceJet', 'GoAir'],
        'Ship': ['Goa Ferries', 'SeaLines', 'Oceanic', 'Blue Waters']
    },
    
    // Service Types with Pricing
    SERVICE_TYPES: {
        'Bus': [
            {
                value: 1,
                label: 'Non-AC Seater',
                description: 'Basic seating without AC',
                baseMin: 200,
                baseMax: 500,
                capacity: 30,
                amenities: ['Water Bottle', 'Reading Light']
            },
            {
                value: 2,
                label: 'AC Seater',
                description: 'Comfortable seating with AC',
                baseMin: 300,
                baseMax: 700,
                capacity: 30,
                amenities: ['Water Bottle', 'Reading Light', 'AC', 'Charging Point']
            },
            {
                value: 3,
                label: 'AC Sleeper',
                description: 'Sleeper berths with AC',
                baseMin: 600,
                baseMax: 1200,
                capacity: 30,
                amenities: ['Water Bottle', 'Blanket', 'AC', 'Charging Point', 'Pillow']
            },
            {
                value: 4,
                label: 'Luxury Volvo',
                description: 'Premium luxury buses',
                baseMin: 900,
                baseMax: 1500,
                capacity: 30,
                amenities: ['Water Bottle', 'Blanket', 'AC', 'Charging Point', 'Pillow', 'WiFi', 'Entertainment']
            }
        ],
        'Train': [
            {
                value: 1,
                label: 'Sleeper (SL)',
                description: 'Budget sleeper class',
                baseMin: 150,
                baseMax: 400,
                capacity: 72,
                amenities: ['Bedding on request', 'Fan']
            },
            {
                value: 2,
                label: '3AC',
                description: 'Three-tier AC sleeper',
                baseMin: 450,
                baseMax: 900,
                capacity: 72,
                amenities: ['Bedding', 'AC', 'Charging Point']
            },
            {
                value: 3,
                label: '2AC',
                description: 'Two-tier AC sleeper',
                baseMin: 800,
                baseMax: 1500,
                capacity: 72,
                amenities: ['Bedding', 'AC', 'Charging Point', 'Curtains']
            },
            {
                value: 4,
                label: '1AC',
                description: 'First class AC sleeper',
                baseMin: 1500,
                baseMax: 2500,
                capacity: 72,
                amenities: ['Premium Bedding', 'AC', 'Charging Point', 'Curtains', 'Meal']
            }
        ],
        'Flight': [
            {
                value: 1,
                label: 'Economy',
                description: 'Standard economy class',
                baseMin: 2500,
                baseMax: 6000,
                capacity: 120,
                amenities: ['Baggage 15kg', 'Meal on request', 'Entertainment']
            },
            {
                value: 2,
                label: 'Premium Economy',
                description: 'Extra legroom and comfort',
                baseMin: 6000,
                baseMax: 9000,
                capacity: 120,
                amenities: ['Baggage 20kg', 'Complimentary Meal', 'Entertainment', 'Extra Legroom']
            },
            {
                value: 3,
                label: 'Business',
                description: 'Premium business class',
                baseMin: 9000,
                baseMax: 15000,
                capacity: 120,
                amenities: ['Baggage 30kg', 'Premium Meal', 'Entertainment', 'Lounge Access', 'Priority Boarding']
            }
        ],
        'Ship': [
            {
                value: 1,
                label: 'Deck',
                description: 'Open deck seating',
                baseMin: 500,
                baseMax: 1200,
                capacity: 200,
                amenities: ['Life Jacket', 'Drinking Water']
            },
            {
                value: 2,
                label: 'Cabin',
                description: 'Private cabin with bed',
                baseMin: 1200,
                baseMax: 3000,
                capacity: 200,
                amenities: ['Life Jacket', 'Drinking Water', 'Private Cabin', 'AC']
            },
            {
                value: 3,
                label: 'Deluxe Suite',
                description: 'Luxury suite with amenities',
                baseMin: 3000,
                baseMax: 6000,
                capacity: 200,
                amenities: ['Life Jacket', 'Drinking Water', 'Deluxe Suite', 'AC', 'TV', 'Mini Bar']
            }
        ]
    },
    
    // Payment Settings
    PAYMENT: {
        GST_RATE: 0.18, // 18% GST
        CANCELLATION_CHARGES: 0.20, // 20% cancellation charges (80% refund)
        LUGGAGE_PRICE: 50, // ₹50 per passenger
        MIN_BOOKING_HOURS: 2 // Minimum hours before journey to book
    },
    
    // Validation Rules
    VALIDATION: {
        MOBILE_PATTERN: /^[789]\d{9}$/,
        EMAIL_PATTERN: /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
        PASSWORD_PATTERN: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&^#()_+=<>\/\\-]).{6,}$/,
        UPI_PATTERN: /^[a-zA-Z0-9._\-]{3,}@[a-zA-Z]{3,}$/,
        CARD_PATTERN: /^\d{16}$/,
        CVV_PATTERN: /^\d{4}$/,
        MIN_PASSENGER_COUNT: 1,
        MAX_PASSENGER_COUNT: 5,
        MIN_AGE: 0,
        MAX_AGE: 150
    },
    
    // UI Settings
    UI: {
        TOAST_DURATION: 3000, // milliseconds
        ANIMATION_DURATION: 500, // milliseconds
        MAX_SEATS_DISPLAY: 40, // Maximum seats to show in seat map preview
        DATE_FORMAT: 'DD-MM-YYYY',
        TIME_FORMAT: 'HH:MM AM/PM'
    },
    
    // Feature Flags
    FEATURES: {
        ENABLE_RATINGS: true,
        ENABLE_FEEDBACK: true,
        ENABLE_COUPONS: true,
        ENABLE_LUGGAGE: true,
        ENABLE_CANCELLATION: true,
        ENABLE_NOTIFICATIONS: false, // Email/SMS notifications
        ENABLE_PRINT_RECEIPT: true
    },
    
    // Popular Cities (for autocomplete)
    POPULAR_CITIES: [
        'Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai',
        'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat',
        'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
        'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara'
    ],
    
    // Error Messages
    ERRORS: {
        INVALID_CREDENTIALS: 'Invalid username or password',
        USER_NOT_FOUND: 'No account found. Please signup first.',
        EMAIL_EXISTS: 'Email already registered',
        INVALID_EMAIL: 'Invalid email format. Must be @gmail.com',
        INVALID_MOBILE: 'Invalid mobile number. Must start with 7, 8, or 9',
        INVALID_PASSWORD: 'Password must contain letters, numbers, special characters and be at least 6 characters',
        SAME_CITIES: 'FROM and TO cities cannot be same',
        SEAT_TAKEN: 'Seat already taken. Please choose another.',
        BOOKING_NOT_FOUND: 'Booking not found',
        CANNOT_CANCEL_PAST: 'Cannot cancel past bookings',
        ALREADY_CANCELLED: 'Booking already cancelled',
        INVALID_COUPON: 'Invalid coupon code',
        PAYMENT_FAILED: 'Payment failed. Please try again.',
        NETWORK_ERROR: 'Network error. Please check your connection.'
    },
    
    // Success Messages
    SUCCESS: {
        SIGNUP: 'Signup successful! Please login.',
        LOGIN: 'Login successful! Welcome',
        BOOKING: 'Booking confirmed successfully!',
        CANCELLATION: 'Booking cancelled. Refund will be processed.',
        PROFILE_UPDATE: 'Profile updated successfully!',
        COUPON_APPLIED: 'Coupon applied successfully!',
        RATING_SAVED: 'Thank you for your rating!'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}