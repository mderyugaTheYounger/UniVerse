# UniVerse 🎓

## 📌 Overview

**UniVerse** is a modern student portal platform built to simplify college life by uniting academic degree planning, housing discovery, and student community into a single platform.

While engineered from the ground up to support multiple universities, UniVerse is launching its pilot implementation for **UNC Charlotte** (`@charlotte.edu` / `@uncc.edu`) for its inaugural release and software engineering code demonstration.

---

## ✨ Key Features

- 🗺️ **Interactive Campus & Housing Map**:
  - Discover on-campus and off-campus housing complexes and dining spots via geo-tagged map tacks.
  - Transparent housing insights including monthly rent ranges, noise levels, and crime scores.
  - Coordinate bounding-box queries for efficient map rendering.

- 📚 **Course Catalog & Degree Requirements**:
  - Full academic catalog mapping courses to departments.
  - Degree planning tracking Major requirements (BA, BS, etc.) and Minor requirements.
  - Prerequisite dependency trees preventing circular course dependencies.

- 🤝 **Roommate Matching**:
  - Lifestyle compatibility matching based on budget caps, cleanliness, sleep schedules, and smoking/pet preferences.

- ⭐ **Community Ratings & Reviews**:
  - Verified student reviews across housing complexes, dining halls, majors, and minors.

- 🔒 **Campus Domain Verification**:
  - Institutional email verification ensuring reviews and roommate connections are authentic to verified students.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Data & Query Layer**: [TypeScript](https://www.typescriptlang.org/), [Kysely](https://kysely.dev/) (Type-safe SQL query builder)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (`pg` driver)
- **Code Quality**: ESLint

---

## 🏛️ Database Architecture

The data model is documented in [`docs/ERD.md`](docs/ERD.md). The schema is divided into modular typed Kysely schemas:

- **Course Catalog Domain** (`src/database/course-db/courseDB.ts`):
  - Tables: `departments`, `courses`, `majors`, `minors`, `major_requirements`, `minor_requirements`, `prerequisites`.
  - Includes programmatic migrations (`up` / `down`) and views for entity queries.
- **Map & Campus Life Domain** (`src/database/mapTack-db/mapTackDB.ts`):
  - Tables: `universities`, `housing`, `food_places`, `map_tacks`.
  - Supports bounding box lookups (`getMapTacksInBounds`) and pinned entity joins (`getMapTackWithDetails`).
- **User & Review Domain** (`docs/ERD.md`):
  - Entities: `USER`, `PROFILE`, `ROOMMATE_PREFERENCE`, `REVIEW`.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.x or v20.x+)
- **npm** (v9.x+)
- **PostgreSQL** instance (local or hosted)

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
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgres://username:password@localhost:5432/universe_db
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the Vite development server with Hot Module Replacement (HMR). |
| `npm run build` | Bundles production assets into `dist/`. |
| `npm run preview` | Locally previews the production build. |
| `npm run lint` | Runs ESLint to check for code formatting and quality issues. |

---

## 📁 Project Structure

```text
UniVerse/
├── docs/
│   └── ERD.md                          # Entity Relationship Diagram & documentation
├── public/
│   ├── UniVerseLogo.png                # Main project logo
│   └── UniVerseSmallLogo.png           # Favicon & icon asset
├── src/
│   ├── database/
│   │   ├── course-db/
│   │   │   └── courseDB.ts             # Course catalog schema, DDL migrations & Kysely client
│   │   └── mapTack-db/
│   │       └── mapTackDB.ts            # Housing, food, map pins schema & query helpers
│   ├── App.css
│   ├── App.jsx                         # Main application shell
│   ├── index.css
│   └── main.jsx                        # React root entrypoint
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.js
```

---

## 👥 Team & Contributors — ITSC 3155

Developed by our ITSC 3155 - Software Engineering project team:
- **Jaden Patterson**
- **Misha Deryuga**
- **Asal Tiwari**
- **Harsimran Singh**
- **Riley Smitherman**
