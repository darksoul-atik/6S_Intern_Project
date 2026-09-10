# ⚡ DevPulse

> **Next-Generation Full-Stack Developer Community & Collaboration Hub**  
> *(Intern Project — 7-Day Sprint)*

DevPulse is a high-performance, engineering-first developer community platform engineered as a clean, unified monorepo. It features a scalable **NestJS** backend integrated with **MongoDB** via **Mongoose** for resilient domain logic, alongside a sleek **Next.js** App Router frontend styled with **Tailwind CSS** for an engaging, reactive developer experience.

---

## 📅 7-Day Roadmap & Implementation Status

| Day | Milestone | Focus Areas | Status |
|:---:|---|---|:---:|
| **Day 1** | **Foundation, Health Check & OpenAPI** | Monorepo scaffolding, NestJS + Next.js App Router setup, Mongoose Atlas integration, live DB connection diagnostics (`/health`), interactive Swagger UI (`/docs`), generic typed API client (`lib/api.ts`), and strict dual-branch git hygiene. | ✅ **Completed** |
| **Day 2** | **Auth, Identity & Security** | JWT-based authentication & refresh tokens, password hashing with bcrypt, registration/login endpoints, NestJS route guards, and responsive Next.js auth pages. | ⏳ *Upcoming* |
| **Day 3** | **Profiles & Account Management** | Extended user schema (bio, avatars, tech tags, socials), profile CRUD APIs, account settings dashboard, and dynamic `/profile/[username]` routing. | ⏳ *Upcoming* |
| **Day 4** | **Content Engine & Markdown Posts** | Markdown post editor with live preview, tags & categories, post CRUD operations, cursor/page pagination, and unified home feed. | ⏳ *Upcoming* |
| **Day 5** | **Community Engagement & Socials** | Threaded/nested comments system, polymorphic reactions (likes, stars, bookmarks), and optimistic UI interaction feedback. | ⏳ *Upcoming* |
| **Day 6** | **Trending Algorithms & Discovery** | Time-decay + engagement ranking algorithm (hot/trending/top), tag-based search and filtering, and an interactive Explore portal. | ⏳ *Upcoming* |
| **Day 7** | **Hardening, Testing & Final Audit** | End-to-end integration tests, rate limiting, audit logging, production optimization, final `AI_USAGE.md` compilation, and showcase preparation. | ⏳ *Upcoming* |

---

## 🛠️ Tech Stack Summary

- **Backend**: [NestJS](https://nestjs.com/) (Node.js, TypeScript), [Mongoose](https://mongoosejs.com/) (MongoDB ODM), `@nestjs/config`, `@nestjs/swagger`
- **Frontend**: [Next.js](https://nextjs.org/) (React, TypeScript, App Router), [Tailwind CSS](https://tailwindcss.com/)
- **Database**: MongoDB (Atlas cloud cluster or local MongoDB)
- **API Documentation**: OpenAPI 3.0 / Swagger UI
- **Package Manager**: npm

---

## 📋 Prerequisites

- **Node.js**: `v20.x` or `v22.x` (tested on `v22.15.1`)
- **npm**: `v10.x` or `v11.x`
- **MongoDB**: Active MongoDB database instance (MongoDB Atlas connection string or local instance at `mongodb://localhost:27017`)

---

## 📁 Monorepo Layout

```
dev-community/
├── backend/               # NestJS + Mongoose API server
│   ├── src/
│   │   ├── health/        # Health check module, controller, service, & DTOs
│   │   ├── app.module.ts  # Root application module wiring Mongoose & Config
│   │   └── main.ts        # Bootstrap, CORS, Swagger, and port configuration
│   ├── .env.example       # Backend environment variables template
│   └── package.json
├── frontend/              # Next.js App Router frontend
│   ├── src/
│   │   ├── app/           # App Router pages and layouts
│   │   └── lib/           # Shared utilities (generic apiClient helper)
│   ├── .env.example       # Frontend environment variables template
│   └── package.json
├── .gitignore             # Root monorepo ignore rules (strictly ignores secrets)
├── README.md              # Project documentation, roadmap & run guide
└── AI_USAGE.md            # LLM & AI assistance audit log
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Port on which the NestJS HTTP API listens | `5000` |
| `MONGODB_URI` | MongoDB connection URI (Atlas or local) | `mongodb+srv://<user>:<pass>@cluster.mongodb.net/dev_community` |

### Frontend (`frontend/.env.local`)

Copy `frontend/.env.example` to `frontend/.env.local`:

| Variable | Description | Example / Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API | `http://localhost:5000` |

---

## 🚀 Getting Started Locally

### 1. Clone the Repository

```bash
git clone https://github.com/darksoul-atik/6S_Intern_Project.git
cd 6S_Intern_Project
```

### 2. Backend Setup & Run

In a new terminal:

```bash
cd backend

# 1. Configure environment
cp .env.example .env
# Edit .env with your MongoDB connection string and desired port (default 5000)

# 2. Install dependencies
npm install

# 3. Start development server
npm run start:dev
```

The backend boots at `http://localhost:5000` (or your configured `PORT`).

### 3. Frontend Setup & Run

In a second terminal:

```bash
cd frontend

# 1. Configure environment
cp .env.example .env.local
# Verify NEXT_PUBLIC_API_URL points to http://localhost:5000

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

The frontend boots at `http://localhost:3000`.

---

## 🔍 Verification & Health Check

1. **Direct Backend Health Check**:
   ```bash
   curl http://localhost:5000/health
   ```
   **Expected Response:**
   ```json
   {
     "success": true,
     "data": {
       "status": "ok",
       "db": "connected"
     }
   }
   ```
   *(The `db` field dynamically reflects live Mongoose connection state: `connected` or `disconnected`)*.

2. **Frontend UI Dashboard**:
   Navigate to `http://localhost:3000` in your web browser. The dashboard displays real-time connection status to both the backend API and MongoDB with a live re-check trigger.

3. **Interactive Swagger API Documentation**:
   Navigate to `http://localhost:5000/docs` in your browser to explore and test the interactive OpenAPI documentation for all backend routes.
   - OpenAPI JSON Schema: `http://localhost:5000/docs-json`
