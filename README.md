# UniVerse 🎓

[![Version](https://img.shields.io/badge/version-v0.3.0-blue.svg)](https://github.com/mderyugaTheYounger/UniVerse/releases/tag/v0.3.0)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000.svg?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![AWS S3](https://img.shields.io/badge/AWS-S3-569A31.svg?logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **UniVerse** is an all-in-one student portal platform engineered to simplify college life by uniting academic degree planning, housing discovery, roommate matching, and verified campus community into a single cohesive experience.

While architected from the ground up to support multiple universities, UniVerse's pilot implementation is built for **UNC Charlotte** (`@charlotte.edu` / `@uncc.edu`) for its inaugural release and software engineering demonstration (ITSC 3155).

---

## 📌 Project Status (Release `v0.3.0`)

UniVerse is actively developed under a milestone-based roadmap. The project is currently at **v0.3.0**, featuring completed functional skeletons and core modules across authentication, course planning, interactive mapping, roommate matching, and cloud storage:

- [x] **Institutional Authentication**: Google OAuth 2.0 with institutional email verification (`@charlotte.edu`, `@uncc.edu`) and JWT session management.
- [x] **Interactive Leaflet Campus Map**: Dynamic campus map with custom pins for housing, dining, and food plazas, featuring Charlotte Gold/Green standards, distance radius slider, and sidebar navigation.
- [x] **Academic Course Catalog**: Full catalog exploration with filtering by department, course level, credits, and search query.
- [x] **Prerequisite Dependency Tree Viewer**: Interactive visual prerequisite and corequisite hierarchy tree for academic courses.
- [x] **4-Year Degree Planner**: Multi-year, semester-by-semester course plan builder with notes and credit tracking.
- [x] **Roommate Matching System**: Compatibility scoring, lifestyle habit questionnaires, filterable candidate matching, and bookmarking.
- [x] **AWS S3 Cloud Avatar Storage**: Secure pre-signed direct upload and retrieval pipeline for student profile pictures.
- [x] **Modular Database Architecture**: Typed Kysely schemas, DDL migrations, and Docker Compose configurations for four isolated domain databases with in-memory fallbacks.
- [ ] **Live Database Integration Across All Services**: Transitioning mock data stores to live PostgreSQL instances in production.
- [ ] **Direct Student Messaging**: Real-time peer-to-peer messaging for roommate connections.
- [ ] **Verified Student Reviews**: Community rating submissions for housing, dining, and academic tracks.

---

## ✨ Key Features

### 🔒 Campus Domain & Google OAuth 2.0 Authentication
- **Institutional Login**: One-click sign-in via Google Identity Services (`@react-oauth/google`, `google-auth-library`).
- **Domain Gatekeeping**: Restricts access exclusively to verified UNC Charlotte student emails (`@charlotte.edu` and `@uncc.edu`).
- **Session Security**: Issues signed JSON Web Tokens (JWT) for authenticated API sessions, with persistent login restoration (`/api/auth/me`).
- **In-Memory Development Fallback**: Allows full authentication and profile testing even when local PostgreSQL instances are offline.

### 🗺️ Interactive Campus, Housing & Dining Explorer
- **Leaflet & React-Leaflet Integration**: Interactive map centered on the UNC Charlotte campus (`35.3075° N, 80.7337° W`).
- **Dynamic Radius Filter**: Slider control adjusting search radius from 1 to 13 miles with automatic boundary fitting (`MapController`).
- **Categorized Campus Tacks**:
  - 🏠 **Student Housing**: On-campus dorms and off-campus complexes with rent ranges and UNCC safety standards.
  - 🍔 **Dining & Local Spots**: Standalone restaurants and famous Charlotte eateries.
  - 🏬 **Dining Plazas & Hubs**: Consolidated dining plazas (e.g., University City Blvd, Shoppes at University Place) with individual tenant listings.
- **UNC Charlotte Standards**: Badges identifying complexes recognized under Charlotte Off-Campus Housing "Gold Standard" and "Green Standard" tiers.
- **Detailed Place Cards**: Synchronized sidebar cards with distance calculations, pricing tiers, crime/noise indicators, and fly-to map navigation.

### 📚 Academic Course Catalog & Degree Planning
- **Catalog Search & Filtering**: Instant lookup across departments (ITSC, ITIS, ITCS, MATH, etc.), level (1000–4000), credit count, and keywords.
- **Prerequisite Tree Visualizer (`PrereqTreeViewer`)**: Interactive component visualizing prerequisite dependency chains and corequisites to prevent circular or invalid schedules.
- **Major & Minor Requirement Tracks**: View courses grouped by degree requirements (e.g., Computer Science BS, AI Concentration, Software Engineering).
- **4-Year Degree Planner**:
  - Organize courses across academic years (Freshman, Sophomore, Junior, Senior) and terms (Fall, Spring, Summer).
  - Add custom notes per course, calculate semester credit hours, and adjust schedules.
  - Backed by typed `coursePlanDB.ts` schema and dedicated REST API endpoints.

### 🤝 Roommate Matching & Lifestyle Compatibility
- **Lifestyle Matching Algorithm**: Matches candidates based on budget limits, sleep schedules (Early bird, Night owl, Flexible), cleanliness standards, pet friendliness, and smoking preferences.
- **"My Living Preferences" Profile**: Students configure their own living habits and roommate criteria.
- **Candidate Profiles**: View compatibility percentage scores, major, graduation year, lifestyle tags, and bio.
- **Bookmark & Connect**: Save candidate roommates to a personal shortlist and send outreach connection requests.

### ☁️ Cloud Avatar Management (AWS S3)
- **Direct-to-S3 Uploads**: Uses `@aws-sdk/s3-presigned-post` to generate secure, pre-signed upload policies so user avatars upload directly to Amazon S3.
- **Upload Constraints**: Enforces client-side and server-side restrictions on file types (`image/jpeg`, `image/png`, `image/webp`) and file sizes (max 5 MB).
- **Pre-signed Access & Cleanup**: Generates short-lived GET signed URLs for secure private bucket delivery and automated deletion upon avatar updates.
- **MinIO / LocalStack Compatible**: Supports local S3-compatible endpoints for offline development.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | [React 19](https://react.dev/), [Vite 8](https://vitejs.dev/), [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/), Modern CSS |
| **Backend & APIs** | [Express 5](https://expressjs.com/), [Node.js](https://nodejs.org/), [tsx](https://github.com/privatenumber/tsx), [CORS](https://github.com/expressjs/cors) |
| **Authentication** | [Google Identity Services](https://developers.google.com/identity), [@react-oauth/google](https://www.npmjs.com/package/@react-oauth/google), [google-auth-library](https://github.com/googleapis/google-auth-library-nodejs), [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) |
| **Cloud Storage** | [AWS SDK for JavaScript v3](https://aws.amazon.com/sdk-for-javascript/) (`@aws-sdk/client-s3`, `@aws-sdk/s3-presigned-post`, `@aws-sdk/s3-request-presigner`) |
| **Database & ORM** | [PostgreSQL 16](https://www.postgresql.org/), [Kysely](https://kysely.dev/) (Type-safe SQL query builder), `pg` driver |
| **DevOps & Tooling** | [Docker](https://www.docker.com/) & Docker Compose, [Concurrently](https://github.com/open-cli-tools/concurrently), [ESLint](https://eslint.org/) |

---

## 🏛️ System Architecture

### Multi-Database Topology

The database architecture is designed with isolated domain schemas documented in [`docs/ERD.md`](docs/ERD.md). Each domain is maintained as a typed Kysely client with migration scripts:

```
UniVerse Multi-Database Services
├── user-db       (Port 5433) → Users, Profiles, University Domains, Google OAuth IDs
├── course-db     (Port 5434) → Departments, Courses, Prerequisites, Majors, Minors
├── roommate-db   (Port 5435) → Roommate Preferences, Lifestyle Attributes, Candidate Matches
└── map-tack-db   (Port 5436) → Universities, Housing, Food Places, Geo Coordinates & Badges
```

- **`src/database/userDB.ts`**: User credentials, Google OAuth linkage, student profiles. Initialized via `src/database/init/001_user_schema.sql`.
- **`src/database/courseDB.ts`**: Academic departments, course offerings, major and minor degree requirements, and prerequisite dependency graphs.
- **`src/database/coursePlanDB.ts`**: Planned course schedules, semester-by-semester assignments, and student notes.
- **`src/database/roommateDB.ts`**: Student living preferences, budget ranges, sleep schedules, cleanliness ratings, and matching queries.
- **`src/database/mapTackDB.ts`**: Geo-tagged housing complexes, dining hubs, coordinates, and bounding box queries.
- **`src/database/docker-compose.yaml`**: Pre-configured multi-container PostgreSQL 16 environment.

### Backend API & Dev Server Integration

UniVerse runs a unified full-stack development environment:
- **Express Backend (`server/index.js` on Port 5001)**:
  - `POST /api/auth/google`: Verifies Google ID tokens, enforces campus domain rules, and issues session JWTs.
  - `GET /api/auth/me`: Restores user session data from Bearer JWT.
  - `GET /api/health`: Service health check.
- **Vite Dev Server (Port 5173)**:
  - Proxies `/api/auth` and `/api/health` requests to Express on port 5001.
  - Provides Vite middleware API for course catalog, majors, minors, and degree plan endpoints (`/api/departments`, `/api/courses`, `/api/majors`, `/api/minors`, `/api/plan`).

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.x or v20.x+)
- **npm** (v9.x+)
- **Docker & Docker Compose** *(optional, for running local PostgreSQL databases)*

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mderyugaTheYounger/UniVerse.git
   cd UniVerse
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```

   Configure the variables inside `.env`:
   ```env
   # Google OAuth 2.0 Credentials
   VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

   # Express Server Configuration
   PORT=5001
   JWT_SECRET=your-secure-jwt-secret-here

   # Database URL (Optional: defaults to in-memory store if DB is offline)
   USER_DATABASE_URL=postgres://app_user:change-me@localhost:5433/user_db

   # AWS S3 Configuration (Optional: for cloud profile picture uploads)
   S3_BUCKET=your-bucket-name
   S3_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   ```

4. **(Optional) Start Local Database Containers:**
   To spin up the 4 PostgreSQL micro-databases:
   ```bash
   docker compose -f src/database/docker-compose.yaml up -d
   ```
   > *Note:* If you do not have Docker running, UniVerse will automatically fall back to its internal in-memory stores and mock datasets so you can still develop and test the full UI without database errors.

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   This command uses `concurrently` to boot both the Express auth server (port `5001`) and the Vite client application (port `5173`).

6. **Open the Application:**
   Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Concurrently starts the Express backend server (`server/index.js`) and Vite frontend dev server. |
| `npm run client` | Starts only the Vite frontend dev server (port `5173`). |
| `npm run server` | Starts only the Express backend authentication server (port `5001`) via `tsx`. |
| `npm run build` | Compiles and bundles production assets into `dist/`. |
| `npm run preview` | Locally serves and previews the production build from `dist/`. |
| `npm run lint` | Runs ESLint across the codebase to check syntax and code quality. |

---

## 📁 Project Structure

```text
UniVerse/
├── docs/
│   └── ERD.md                          # Entity Relationship Diagram & architecture docs
├── public/
│   ├── UniVerseLogo.png                # Main UniVerse branding logo
│   ├── UniVerseSmallLogo.png           # Small logo and favicon asset
│   ├── hero-campus.jpg                 # Landing page hero photography
│   └── campus-panorama.jpg             # Campus panorama visual asset
├── server/
│   └── index.js                        # Express server: Google OAuth verification & JWT sessions
├── src/
│   ├── components/
│   │   ├── LandingPage.jsx             # Public landing page with portal navigation
│   │   ├── LoginPage.jsx               # Campus-restricted Sign-in / Sign-up with Google OAuth
│   │   ├── ProfilePage.jsx             # Student profile dashboard & lifestyle preferences
│   │   ├── Map.jsx                     # Interactive Leaflet campus & housing explorer
│   │   ├── CourseCatalogPage.jsx       # Course catalog, major requirements & 4-year degree planner
│   │   ├── CourseCatalogPage.css       # Catalog & planner styling
│   │   ├── PrereqTreeViewer.jsx        # Visual prerequisite dependency tree viewer
│   │   ├── PrereqTreeViewer.css        # Tree visualizer styling
│   │   ├── RoommateFinderPage.jsx      # Roommate finder & lifestyle compatibility matching
│   │   └── RoommateFinderPage.css      # Roommate page styling
│   ├── database/
│   │   ├── docker-compose.yaml         # Multi-database container orchestration (ports 5433-5436)
│   │   ├── .env.example                # Database connection strings template
│   │   ├── init/
│   │   │   └── 001_user_schema.sql     # PostgreSQL user and profile initialization schema
│   │   ├── userDB.ts                   # User, profile, and university schema & Kysely helpers
│   │   ├── courseDB.ts                 # Departments, courses, prerequisites, majors schema
│   │   ├── coursePlanDB.ts             # Course plan entries schema & planner helpers
│   │   ├── roommateDB.ts               # Roommate preference schema & matching queries
│   │   └── mapTackDB.ts                # Housing, food places, and map pins schema & helpers
│   ├── data/
│   │   ├── mappingData.ts              # Verified Charlotte housing & dining dataset with tiers
│   │   ├── mockCourseData.js           # UNC Charlotte course, department, major & prerequisite data
│   │   └── mockRoommateData.js         # Roommate candidates dataset and filter algorithms
│   ├── s3.ts                           # AWS S3 avatar upload & pre-signed URL management
│   ├── App.jsx                         # Main client routing and view controller
│   ├── App.css                         # Global application layout styling
│   ├── index.css                       # Base stylesheet & reset rules
│   └── main.jsx                        # React root entrypoint
├── .env.example                        # Template environment variables
├── eslint.config.js                    # ESLint configuration
├── index.html                          # HTML5 root template
├── package.json                        # Dependencies, scripts, and package metadata
├── tsconfig.json                       # TypeScript compiler options
└── vite.config.js                      # Vite config with proxy & Course Catalog API plugin
```

---

## 👥 Team & Contributors — ITSC 3155

Developed for **ITSC 3155 - Software Engineering** at the University of North Carolina at Charlotte:

- **Jaden Patterson**
- **Misha Deryuga**
- **Asal Tiwari**
- **Harsimran Singh**
- **Riley Smitherman**
