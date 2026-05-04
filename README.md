# ⚖️ Legal Mapper — SaaS Edition

**Legal Mapper** is a production-ready SaaS application for Indian legal professionals. It maps Indian Penal Code (IPC) sections to their equivalents in the Bharatiya Nyaya Sanhita (BNS), with authentication, rate limiting, AI-powered explanations, and Razorpay payments.

> **Disclaimer:** This tool is for informational purposes only and is not legal advice. Always consult a qualified legal professional.

---

## 📁 Folder Structure

```
kapil/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── database.py          # SQLAlchemy engine & session
│   │   ├── models/
│   │   │   ├── user.py          # User model (email, password_hash, plan)
│   │   │   ├── mapping.py       # Mapping model (IPC ↔ BNS data)
│   │   │   ├── search_history.py
│   │   │   └── saved_item.py
│   │   ├── routes/
│   │   │   ├── auth.py          # POST /auth/signup, /auth/login
│   │   │   ├── search.py        # GET /search (rate-limited)
│   │   │   ├── saved.py         # POST /save, DELETE /save/{id}, GET /saved
│   │   │   ├── history.py       # GET /history
│   │   │   ├── explain.py       # GET /mappings/{id}/explain (Pro only)
│   │   │   ├── payments.py      # Razorpay create-order & verify
│   │   │   └── users.py         # GET /me
│   │   ├── services/
│   │   │   ├── search_service.py # Normalisation & ranked search
│   │   │   └── seed_service.py   # One-time import from mapping.json
│   │   └── auth/
│   │       ├── jwt_handler.py    # JWT create/decode, bcrypt helpers
│   │       └── dependencies.py  # get_current_user, require_pro
│   ├── alembic/                 # Database migrations
│   ├── mapping.json             # Source data (seeded on first startup)
│   ├── requirements.txt
│   ├── alembic.ini
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar.jsx
│   │   │   ├── ResultCard.jsx   # With copy, save, AI explain buttons
│   │   │   └── Sidebar.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx    # Main app with sidebar navigation
│   │   │   └── Upgrade.jsx      # Razorpay upgrade flow
│   │   ├── services/
│   │   │   └── api.js           # Axios-based API client
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # JWT auth state management
│   │   ├── App.jsx              # React Router setup
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## 🚀 Running Locally

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ (local or hosted)

### 1. Database Setup

Create a local PostgreSQL database:
```bash
createdb legalmapper
# or using psql:
psql -c "CREATE DATABASE legalmapper;"
```

### 2. Backend (FastAPI)

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL and JWT_SECRET

# Run the server
uvicorn app.main:app --reload
```

On first startup, the app will:
1. Create all database tables automatically
2. Seed mappings from `mapping.json` into the `mappings` table

The API is now running at **http://localhost:8000**.
Interactive docs at: **http://localhost:8000/docs**

#### Running Migrations (Alembic)

```bash
# Generate a new migration after model changes
alembic revision --autogenerate -m "describe your change"

# Apply migrations
alembic upgrade head
```

### 3. Frontend (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:8000

# Start dev server
npm run dev
```

The app is at **http://localhost:5173**.

---

## 🔑 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | — | Health check |
| `POST` | `/auth/signup` | — | Create account |
| `POST` | `/auth/login` | — | Get JWT token |
| `GET` | `/me` | ✅ | Get current user profile |
| `GET` | `/search?query=` | ✅ | Search mappings (rate-limited for free plan) |
| `POST` | `/save` | ✅ | Save a mapping |
| `DELETE` | `/save/{id}` | ✅ | Unsave a mapping |
| `GET` | `/saved` | ✅ | Get saved mappings |
| `GET` | `/history` | ✅ | Get search history |
| `GET` | `/mappings/{id}/explain` | ✅ Pro | AI explanation |
| `GET` | `/payments/plans` | — | List plans |
| `POST` | `/payments/create-order` | ✅ | Create Razorpay order |
| `POST` | `/payments/verify` | ✅ | Verify payment & upgrade plan |

---

## 🌐 Deployment

### Database → [Neon](https://neon.tech) or [Supabase](https://supabase.com)

1. Create a free PostgreSQL database on Neon or Supabase.
2. Copy the connection string — it looks like:
   ```
   postgresql://user:password@host.neon.tech/neondb?sslmode=require
   ```
3. Set this as `DATABASE_URL` in your backend environment.

### Backend → [Render](https://render.com)

1. Push the repo to GitHub.
2. Create a new **Web Service** on Render.
3. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add **Environment Variables** (under Render → Environment):
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-long-random-secret
   ALLOWED_ORIGINS=https://your-app.vercel.app
   FREE_DAILY_SEARCH_LIMIT=10
   OPENAI_API_KEY=sk-...         # Optional: for AI explain
   RAZORPAY_KEY_ID=rzp_...       # Optional: for payments
   RAZORPAY_KEY_SECRET=...       # Optional: for payments
   ```
5. Deploy — Render will auto-restart when you push to main.

### Frontend → [Vercel](https://vercel.com)

1. Create a new project on Vercel, pointing at your GitHub repo.
2. Set:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
3. Add **Environment Variables**:
   ```
   VITE_API_BASE_URL=https://your-backend.onrender.com
   VITE_FREE_DAILY_LIMIT=10
   ```
4. Deploy — Vercel builds and hosts automatically.

---

## 🔍 Search Examples

| Input | What it matches |
|-------|-----------------|
| `420` | IPC §420 → BNS §318 (Cheating) |
| `IPC 302` | IPC §302 → BNS §103 (Murder) |
| `BNS 64` | BNS §64 ← IPC §376 (Rape) |
| `cheating` | All entries with "cheating" in title |
| `dacoity` | IPC §395 → BNS §310 |

---

## 💳 Plans

| Feature | Free | Pro |
|---------|------|-----|
| Searches/day | 10 | Unlimited |
| Save mappings | ✅ | ✅ |
| Search history | ✅ | ✅ |
| AI Explanations | ❌ | ✅ |
| Price | Free | ₹499/month |

---

## 📄 mapping.json Schema

```json
{
  "old_code": "IPC",
  "old_section": "420",
  "new_code": "BNS",
  "new_section": "318",
  "title": "Cheating and dishonestly inducing delivery of property",
  "notes": "Updated wording; check updated punishment details."
}
```
