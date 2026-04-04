# 🚀 FinSpark Enterprise Prototype

An enterprise-grade React dashboard and Node.js backend prototype demonstrating a secure, multi-tenant Feature Intelligence Framework. This project was built to showcase a lightweight telemetry SDK with batching (circuit breaker), strict database-level isolation, and a dynamic PII masking ETL pipeline.

## Live Demo
link: https://finspark-wvea.vercel.app/overview
## ✨ Key Features

- **Multi-Tenant Edge Security:** The backend explicitly requires strict `x-tenant-id` database boundary checks, instantly blocking unauthorized cross-tenant requests.
- **Dynamic PII Masking Pipeline:** As telemetry data hits the backend, an ETL module automatically hashes emails, masks account numbers, and strips IP subnets based on live governance rules before writing to the database.
- **Robust Telemetry SDK:** A secure frontend JavaScript API that groups interactions into optimized batches and leverages memory queuing and `navigator.sendBeacon()` to ensure high fidelity capture even when users navigate away.
- **Enterprise Hot-Reload Mock Database:** Because setting up a live PostgreSQL/Mongo cluster for a hackathon demo is risky, the backend dynamically hot-reloads data from a central `mock_api_responses.json` file. Updating a number in that JSON file instantly changes the data in the React dashboard!
- **Predictive Business Logic:** The dashboard actively highlights instances where user engagement drops below critical thresholds, enabling Customer Success Managers (CSMs) to proactively tackle churn.

## ⚙️ How to Run Locally

You will need two separate terminal windows to run both the frontend UI and the backend mock server simultaneously.

### 1. Start the Backend API (Mock Database Server)
```bash
# Navigate to the backend directory
cd server

# Install dependencies
npm install

# Start the Node.js server (Runs on port 3001)
node index.js
```
*Note: Any time you edit `mock_api_responses.json`, the server will log `[HOT-RELOAD]` and instantly update the API endpoints.*

### 2. Start the Frontend React Dashboard
Open a new terminal window:
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server (Runs on port 5173)
npm run dev
```

### 3. Open in Browser
Once both servers are running, open your web browser and navigate to:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🏗️ Architecture overview

* `frontend/`: A React + Vite SPA using `lucide-react` and `recharts` for clean, glassmorphic UI visualizations.
* `server/`: An Express.js mock server that simulates an enterprise Data Engineering pipeline and isolated multi-tenant databases.
* `mock_api_responses.json`: The "Command Center." Edit this JSON file on the fly to permanently alter backend statistics without modifying source code.
