# EVENTRA — Smart Event Discovery & Team Collaboration Platform

> A comprehensive, full-stack campus event management and peer recruitment platform built on the **MERN** stack (MongoDB, Express, React, Node.js).

---

## 🌟 Overview

**EVENTRA** streamlines campus life by connecting students, event organizers, and administrative faculty into a unified, role-based ecosystem. Students can discover curated events, form or join hackathon teams, and sync schedules. Organizers can draft and submit events for dean approval while managing attendee rosters. Campus administrators maintain institutional governance with audit trails and multi-stage approval workflows.

---

## 🚀 Key Features

### 🎓 1. Student Portal
- **Interactive Event Discovery:** Search and filter campus events by category (Hackathon, Workshop, Fest, Cultural, etc.), date range, department restrictions, and capacity.
- **Calendar & Timeline View:** Visual campus event calendar to avoid exam clashes and track registration deadlines.
- **Personalized Recommendations:** Events tailored based on student department, interests, and academic year.
- **Bookmarks & Registrations:** One-click event registration, QR-ready ticketing metadata, and saved events.
- **Team Formation & Recruitment:** 
  - Create hackathon teams with specific skill tags (e.g., UI/UX, Backend, AI/ML).
  - Public Team Finder with search by skills and open member slots.
  - Send join requests and team invitations with automated notifications.

### 🎨 2. Organizer Studio
- **Event Creation & Drafting:** Comprehensive multi-step event submission (dates, venues, restrictions, pricing, team limits, and rules).
- **Approval Workflow:** Drafted events are automatically sent to the Campus Admin Desk with status tracking (`draft`, `pending_approval`, `approved`, `rejected`, `published`).
- **Roster & Attendee Management:** Real-time visibility into registered participants, attendee check-ins, and team compositions.

### 🏛️ 3. Campus Admin Governance Desk
- **Dean / Admin Approval Queue:** Inspect pending event proposals, review venues to avoid campus scheduling conflicts.
- **Decision Controls:** One-click Approve or Reject with feedback comments.
- **Audit Trails & History:** Immutable audit logs tracking who created, edited, approved, or rejected each event with timestamps.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide React, Axios, React Router v7 |
| **Backend** | Node.js (ES Modules), Express.js 5, Mongoose 9, JWT Auth, bcryptjs, Morgan |
| **Database** | MongoDB / MongoDB Atlas |
| **Deployment** | Netlify (Frontend SPA), Render / Railway (Backend API) |

---

## 📁 Repository Structure

```text
├── backend/
│   ├── src/
│   │   ├── controllers/       # Auth, Event, Team, Bookmark, Notification controllers
│   │   ├── middleware/        # JWT auth verification, role-based access control
│   │   ├── models/            # Mongoose schemas (User, Event, Team, Registration, etc.)
│   │   ├── routes/            # REST API route definitions
│   │   ├── seed.js            # Initial database demo seeder
│   │   └── server.js          # Express server entry point & MongoDB connection
│   ├── .env                   # Backend environment variables
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── _redirects         # Netlify SPA routing rewrite rule (/* -> /index.html)
│   ├── src/
│   │   ├── api/               # Axios client configuration & API interceptors
│   │   ├── components/        # Reusable UI components, Modals, Navbar, AuditTimeline
│   │   ├── context/           # AuthContext (JWT management & session persistence)
│   │   ├── pages/             # Student, Organizer, Admin portal pages
│   │   ├── App.jsx            # Application routing & role guards
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── render.yaml                # Infrastructure-as-Code for Render deployment
└── README.md
```

---

## ⚡ Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas connection string)
- Git

---

### 1. Clone Repository
```powershell
git clone https://github.com/<your-username>/event.git
cd event
```

---

### 2. Backend Setup
1. Navigate to the `backend` directory:
   ```powershell
   cd backend
   npm install
   ```

2. Create or verify your `.env` file in the `backend/` folder:
   ```env
   PORT=5000
   JWT_SECRET=your_jwt_secret_key_here
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/eventra?retryWrites=true&w=majority
   ```
   > **Note:** Ensure you remove any `< >` bracket placeholders from your MongoDB URI username and password.

3. Populate demo users, events, and teams:
   ```powershell
   npm run seed
   ```

4. Start the backend development server:
   ```powershell
   npm run dev
   ```
   Backend will be running at `http://localhost:5000`.

---

### 3. Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory:
   ```powershell
   cd frontend
   npm install
   ```

2. *(Optional)* Create a `.env` in `frontend/` if connecting to a remote backend:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
   *(If omitted, Vite dev proxy routes `/api` directly to `http://127.0.0.1:5000`).*

3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## 🔑 Demo Login Credentials

The database seeder (`npm run seed`) automatically prepares accounts for each portal:

| Role | Email | Password | Access Portal |
| :--- | :--- | :--- | :--- |
| **Campus Admin** | `admin@eventra.edu` | `password123` | **Campus Admin** tab (`/login/admin`) |
| **Lead Organizer** | `organizer@eventra.edu` | `password123` | **Organizer Studio** tab (`/login/organizer`) |
| **Student** | `student@eventra.edu` | `password123` | **Student Portal** tab (`/login/student`) |

---

## 📡 REST API Overview

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a student or organizer account
- `POST /api/auth/login` — Sign in and obtain JWT token
- `GET  /api/auth/me` — Fetch authenticated user profile

### Events (`/api/events`)
- `GET    /api/events` — Retrieve published events (search, filter, pagination)
- `GET    /api/events/recommended` — Personalized events for student
- `GET    /api/events/calendar` — Events structured for calendar display
- `GET    /api/events/:id` — Event details and registration status
- `POST   /api/events` — Create new event draft (Organizer / Admin)
- `PUT    /api/events/:id` — Update event details
- `PATCH  /api/events/:id/status` — Approve, reject, or publish event (Admin)
- `POST   /api/events/:id/register` — Register individual or team for an event

### Teams (`/api/teams`)
- `GET    /api/teams` — Discover recruiting teams
- `POST   /api/teams` — Create a new team
- `GET    /api/teams/me` — List user's joined teams
- `GET    /api/teams/:id` — Team details & roster
- `POST   /api/teams/:id/join` — Request to join team
- `POST   /api/teams/:id/invite` — Invite peer to team

### Bookmarks & Notifications
- `GET    /api/bookmarks` — List bookmarked events
- `POST   /api/bookmarks/:eventId` — Toggle event bookmark
- `GET    /api/notifications` — Fetch user alerts and invitation updates

---

## 🌐 Deployment Guide

### Frontend Deployment (Netlify)
1. Link your GitHub repository in Netlify.
2. Configure **Build Settings**:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Add **Environment Variable**:
   - `VITE_API_URL` = `https://your-backend.onrender.com`
4. The included `frontend/public/_redirects` file ensures full SPA route navigation on refreshes.

### Backend Deployment (Render / Railway)
1. Deploy as a **Web Service** targeting the `backend` directory.
2. **Build Command:** `npm install`
3. **Start Command:** `npm start`
4. Configure Environment Variables:
   - `PORT` = `5000`
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `<secure-random-string>`
   - `CLIENT_URL` = `https://your-netlify-site.netlify.app`
   - `MONGODB_URI` = `mongodb+srv://...`

---

## 📄 License
This project is developed for academic and campus management purposes. Open-source under the [ISC License](LICENSE).
