# ⚖️ Legal Mapper

**Legal Mapper** maps Indian Penal Code (IPC) sections to their equivalents in the Bharatiya Nyaya Sanhita (BNS) — and supports reverse lookup.

> **Disclaimer:** This tool is for informational purposes only and is not legal advice. Always consult a qualified legal professional.

---

## 📁 Folder Structure

```
kapil/
├── backend/
│   ├── main.py          # FastAPI application
│   ├── mapping.json     # IPC ↔ BNS data
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar.jsx
│   │   │   └── ResultCard.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── api.js       # API abstraction layer
│   │   └── styles.css
│   ├── .env.example
│   ├── index.html
│   └── package.json
└── README.md
```

---

## 🚀 Running Locally

### Prerequisites

- Python 3.10+
- Node.js 18+

### 1. Backend (FastAPI)

```bash
# From the project root
cd backend

# Create and activate a virtual environment (recommended)
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload
```

The API is now running at **http://localhost:8000**.

| Endpoint | Description |
|---|---|
| `GET /` | Health check |
| `GET /search?query=420` | Search mappings |

**Quick test:**
```
curl "http://localhost:8000/search?query=420"
```

### 2. Frontend (React + Vite)

```bash
# From the project root
cd frontend

# Copy environment file and set the backend URL
cp .env.example .env
# (default: VITE_API_BASE_URL=http://localhost:8000)

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app is now at **http://localhost:5173**.

---

## 🔗 Connecting Frontend to Backend

The frontend reads `VITE_API_BASE_URL` from the `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Change this URL to point to any deployed backend (see deployment section).

---

## 🌐 Deployment

### Backend → [Render](https://render.com)

1. Push the repo to GitHub.
2. Create a new **Web Service** on Render.
3. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Note the deployed URL (e.g. `https://legal-mapper-api.onrender.com`).

### Frontend → [Vercel](https://vercel.com)

1. Create a new project on Vercel, pointing at your GitHub repo.
2. Set:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Environment variable:** `VITE_API_BASE_URL=https://legal-mapper-api.onrender.com`
3. Deploy — Vercel builds and hosts automatically.

---

## 🔍 Search Examples

| Input | What it matches |
|---|---|
| `420` | IPC §420 → BNS §318 (Cheating) |
| `IPC 302` | IPC §302 → BNS §103 (Murder) |
| `BNS 64` | BNS §64 ← IPC §376 (Rape) |
| `cheating` | All entries with "cheating" in title |
| `dacoity` | IPC §395 → BNS §310 |

---

## 🏗️ Optional Enhancement Placeholders

The project is structured to accommodate these future additions:

| Feature | Where to add |
|---|---|
| **Authentication** | `backend/auth.py` + FastAPI OAuth2 middleware |
| **AI explanation layer** | `backend/ai.py` + OpenAI / Gemini API call |
| **Bookmarking** | `frontend/src/components/Bookmarks.jsx` + localStorage or DB |

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
