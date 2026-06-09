# SakthiShop (E-Commerce Platform)

This is a full-stack e-commerce application styled like Flipkart.

## Folder Structure
- `frontend/` - React + Vite frontend application.
- `backend/` - Python FastAPI backend server with SQLite database.

---

## 🚀 How to Run the App

### 1. Start the Backend Server (FastAPI)
Open a new terminal window/tab:
```bash
cd backend
# Create virtual environment (if not already done)
python -m venv venv
# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```
The backend API will run on **[http://localhost:8000](http://localhost:8000)**.
- **Swagger Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Key Header:** `X-API-Key` (Default key: `sakthi_secret_key_2026`)

---

### 2. Start the Frontend App (React + Vite)
Open another terminal window/tab:
```bash
cd frontend
# Install dependencies
npm install
# Start React development server
npm run dev
```
The React frontend will run on **[http://localhost:5173](http://localhost:5173)** (or `5174`/`5175` depending on port availability).

---

## 🛡️ Admin Portal (`/admin`)
Navigate to `http://localhost:5173/admin` to manage your catalog:
1. **API Key Authentication:** Enter your key (Default: `sakthi_secret_key_2026`) to gain modify permissions.
2. **Dynamic Operations:** Add, Update, Edit and Delete products.
3. **Manual Image Upload:** Choose a file from your device and click **Upload** to save the image to the local backend server, or input a web image URL directly!
