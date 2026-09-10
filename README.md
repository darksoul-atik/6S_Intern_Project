# Dev Community

Dev Community is a full-stack developer community platform built as a clean, modular monorepo. It features a NestJS backend powered by MongoDB and Mongoose for scalable domain logic and persistent data management, alongside a modern Next.js App Router frontend styled with Tailwind CSS for interactive client experiences.

---

## Tech Stack Summary

- **Backend**: [NestJS](https://nestjs.com/) (Node.js, TypeScript), [Mongoose](https://mongoosejs.com/) (MongoDB ODM), `@nestjs/config`
- **Frontend**: [Next.js](https://nextjs.org/) (React, TypeScript, App Router), [Tailwind CSS](https://tailwindcss.com/)
- **Database**: MongoDB (Atlas cloud cluster or local instance)
- **Package Manager**: npm

---

## Prerequisites

- **Node.js**: `v20.x` or `v22.x` (tested on `v22.15.1`)
- **npm**: `v10.x` or `v11.x`
- **MongoDB**: Active MongoDB database instance (MongoDB Atlas connection string or local MongoDB running at `mongodb://localhost:27017`)

---

## Monorepo Layout

```
dev-community/
├── backend/               # NestJS + Mongoose API server
│   ├── src/
│   │   ├── health/        # Health check module, controller, & service
│   │   ├── app.module.ts  # Root application module wiring Mongoose & Config
│   │   └── main.ts        # Bootstrap, CORS, and port configuration
│   ├── .env.example       # Backend environment variables template
│   └── package.json
├── frontend/              # Next.js App Router frontend
│   ├── src/
│   │   ├── app/           # App Router pages and layouts
│   │   └── lib/           # Shared utilities (generic apiClient helper)
│   ├── .env.example       # Frontend environment variables template
│   └── package.json
├── .gitignore             # Root monorepo ignore rules (strictly ignores secrets)
├── README.md              # Project documentation & run guide
└── AI_USAGE.md            # LLM & AI assistance audit log
```

---

## Environment Variables

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

## Getting Started Locally

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

## Verification & Health Check

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

2. **Frontend UI Verification**:
   Navigate to `http://localhost:3000` in your web browser. The dashboard displays real-time connection status to both the backend API and MongoDB with a live re-check trigger.

3. **Interactive Swagger API Documentation**:
   Navigate to `http://localhost:5000/docs` in your browser to explore and test the interactive OpenAPI documentation for all backend routes (including `GET /health`).
   - OpenAPI JSON Schema: `http://localhost:5000/docs-json`

