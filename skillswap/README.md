# SkillSwap - Dynamic Peer-to-Peer Knowledge Exchange Platform

SkillSwap is a full-stack, production-ready peer-to-peer knowledge exchange platform built on **Node.js (v24+)** and **SQLite (`node:sqlite`)** with **zero external npm dependencies**.

All user authentication, profile data, skills matching, exchange proposals, sessions, calendar scheduling, real-time messaging, Google Meet room sharing, community discussions feed, favorites bookmarking, notifications, and reviews are **100% dynamic and backed by a real SQLite database**.

---

## 🌟 Key Features

### 1. Database-Driven Authentication & Security
- **Sign Up Free**: Registers new users with secure password hashing (`scrypt` + unique cryptographically secure salt) and creates persistent user profiles in SQLite.
- **Login**: Validates credentials against DB. Incorrect details return: *“Invalid email or password. Please try again.”*
- **Google Sign-In**: Authenticates Google accounts and links/persists them in SQLite.
- **Session Tokens**: Fast HMAC-SHA256 JWT tokens with automatic expiry and verification.
- **Instant Guest Access**: Auto-seeds the database with verified community members so users can immediately experience the interactive community.

### 2. Intelligent Skill Matching & Discovery
- **Reciprocal Matching Algorithm**: Matches users whose taught skills match your learning goals and vice-versa.
- **Filter by Category**: All Skills, Design, Technology, Business, Creative, Languages, and **⭐ My Saved Favorites**.
- **Instant Search with Clear Button**: Real-time debounce search across names, skills, and project interests.
- **Peer Profile Modal**: Detailed profile inspection displaying verified bio, skills chips, learning targets, and peer reviews.

### 3. Proposals & Automated Conversation Flow
- **Exchange Proposal Modal**: Propose what you want to learn, what you offer in return, and personal introduction.
- **Incoming Proposals Banner**: Real-time accept / decline actions.
- **Automatic Orchestration**: Accepting an exchange proposal automatically initializes a dedicated chat conversation, generates a Google Meet room, schedules a kickoff session, and sends mutual notifications.

### 4. Real-Time Messenger & Google Meet Rooms
- **Multi-Peer Chat**: Switch between active conversations.
- **Live Background Polling**: Messages poll automatically every 3 seconds for a fluid real-time chat experience without page reloads.
- **Google Meet Integration**: Instant room generator, copy link button, and 1-click **📹 Join Google Meet** launcher.
- **In-Chat Rating**: Quick shortcut to rate your partner directly from the messenger header.

### 5. Sessions Hub & Interactive Calendar
- **Live Dynamic Calendars**: Weekly gateway calendar and monthly app calendar with session date indicators.
- **Session Scheduler Modal**: Select peer, date/time, Google Meet URL, and topic agenda.
- **Active Sessions List**: View upcoming sessions, join meeting in 1 click, or cancel.

### 6. Community Knowledge Wall & Discussions Feed
- **Discussions Feed**: Share tutorials, case studies, questions, and project showcases.
- **Category Filter**: All, Design, Tech, Career, Showcase, General.
- **Interactive Likes**: Persistent like counters stored in SQLite with togglable user state.

### 7. Real-Time Notification System
- **Notification Bell & Badge**: Dynamic unread counter badge.
- **Interactive Dropdown**: Displays proposals received, proposals accepted, new messages, sessions scheduled, and reviews received.
- **Mark All as Read**: Instant sync with backend database.

### 8. Verified Peer Ratings & Community Reviews
- **1–5 Star Rating System**: Stored and dynamically aggregated from SQLite.
- **Leave a Review Modal**: Star picker and partner dropdown.
- **Dynamic Community Stats**: Real-time counter of Active Peers, Total Exchanges, Sessions, and Community Rating.

### 9. Complete Profile & Avatar Gallery Editor
- **Avatar Gallery Picker**: Choose from high-quality photorealistic avatars or enter a custom photo URL.
- **Profile Customization**: Update display name, professional role/title, short bio, learning goals, skills offered, target projects, and preferred exchange cadence.

---

## 🚀 Quick Start & Running the Server

### 1. Start the Dynamic Server
Run the following command from the `skillswap` directory:

```bash
node server.js
```

The server starts at `http://localhost:3000`.

### 2. Open in Browser
Navigate to:
```
http://localhost:3000
```

### 3. Run Automated Tests
```bash
npm test
# or
node test-backend.js
node test-e2e.js
```

---

## 📁 File Structure

```text
skillswap/
├── server.js         # REST API & static file HTTP server
├── database.js       # SQLite database layer (node:sqlite) + scrypt security
├── skillswap.db      # Persistent SQLite database file
├── index.html        # Dynamic responsive frontend with modals & views
├── styles.css        # Living animations, 3D parallax, modern glassmorphism
├── scripts.js       # Client controller, API client, real-time polling
├── test-backend.js   # Unit & database integration tests
├── test-e2e.js       # Complete end-to-end HTTP API test suite
├── package.json      # Project configuration
└── README.md         # Full documentation
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register new user account |
| `POST` | `/api/auth/login` | Authenticate existing user |
| `POST` | `/api/auth/google` | Google sign-in / registration |
| `GET` | `/api/auth/me` | Fetch currently authenticated user |
| `POST` | `/api/auth/logout` | End active session |
| `GET` | `/api/users` | List all registered users with ratings & skills |
| `GET` | `/api/users/:id` | Fetch user details by ID |
| `PUT` | `/api/users/profile` | Update current user's profile and skills |
| `GET` | `/api/users/:id/reviews` | Get reviews for a specific user |
| `GET` | `/api/matches` | Get reciprocal/high-compatibility matches |
| `GET` | `/api/favorites` | Get user's saved favorite peers |
| `POST` | `/api/favorites/:id` | Add peer to favorites |
| `DELETE` | `/api/favorites/:id` | Remove peer from favorites |
| `POST` | `/api/proposals` | Send skill exchange proposal |
| `GET` | `/api/proposals` | List user's received and sent proposals |
| `PUT` | `/api/proposals/:id/status` | Accept or reject proposal |
| `GET` | `/api/conversations` | List active peer conversations |
| `GET` | `/api/conversations/:id/messages` | Get conversation chat history |
| `POST` | `/api/conversations/:id/messages` | Post message to conversation |
| `PUT` | `/api/conversations/:id/meet` | Update Google Meet room link |
| `GET` | `/api/sessions` | List user's scheduled learning sessions |
| `POST` | `/api/sessions` | Schedule a new 1-on-1 session |
| `PUT` | `/api/sessions/:id` | Update session time or status |
| `DELETE` | `/api/sessions/:id` | Cancel scheduled session |
| `GET` | `/api/notifications` | List user's real-time notifications |
| `PUT` | `/api/notifications/:id/read` | Mark notification as read |
| `PUT` | `/api/notifications/read-all` | Mark all notifications as read |
| `GET` | `/api/community/posts` | Get community discussion posts |
| `POST` | `/api/community/posts` | Publish a new discussion post |
| `POST` | `/api/community/posts/:id/like` | Toggle like on a community post |
| `GET` | `/api/reviews` | Get verified community reviews |
| `POST` | `/api/reviews` | Submit rating & review for partner |
| `GET` | `/api/stats` | Real-time database platform metrics |
| `POST` | `/api/seed` | Seed initial peer demonstration accounts |
