# 🏋️ FitTrack V7 — The Autonomous AI Fitness Ecosystem

FitTrack V7 is a professional-grade Progressive Web Application (PWA) built with **React 19 + Vite 8**. Designed for athletes and power users, it goes beyond simple rep tracking by integrating **Machine Learning (MediaPipe)**, **Generative AI (Anthropic Claude)**, **Biometric Security (WebAuthn)**, and advanced **Gamification**. 

Built with a paranoid focus on data sovereignty, the application operates on an **Offline-First Zero-Trust Architecture**, ensuring personal health data remains fiercely protected.

---

## 🏗️ Core Architecture & Security

### 1. Zero Trust & Local Encryption (AES-GCM)
All sensitive training data (weights, reps, RPE, 1RM estimations, body measurements) is stored entirely in the browser's `IndexedDB`. 
Upon opening the app, users are challenged to decrypt their local vault. We utilize the Web Crypto API to derive a non-extractable 256-bit AES-GCM key from a 4-digit PIN. **Your data never touches our servers in plain text.**

### 2. Passkeys & Key Escrow (WebAuthn)
For a frictionless experience, users can opt into **Biometric Login (FaceID / TouchID / Windows Hello)** via Supabase WebAuthn. 
Because biometrics don't provide a deterministic symmetric key to unlock the local database, we implemented a secure **Key Escrow**: the AES key is encrypted and stored in the user's Supabase session metadata, automatically reconstructing the local `CryptoKey` upon successful biometric challenge.

### 3. Backend For Frontend (BFF) Proxy
The AI Coach (Claude) requires an Anthropic API Key. To prevent exposing this secret in the client bundle, FitTrack employs a lightweight **Node.js BFF Proxy**. The PWA communicates with the BFF using ephemeral JWTs (signed with a 256-bit `API_SHARED_SECRET`), and the BFF securely proxies the requests to Anthropic.

### 4. Row Level Security (RLS) & PostgreSQL
To protect social and synchronization features, the PostgreSQL database (via Supabase) employs strict **Row Level Security (RLS)** policies. All queries are scoped to the authenticated user's context. The BFF service operates under a heavily restricted service role, while client access is strictly gated by JWT claims, preventing data leakage across tenants.

---

## 🚀 Key Features

- **AI Biofeedback Coach:** Context-aware training adjustments, RPE evaluations, and auto-regulation powered by the Anthropic SDK.
- **Biomechanical Prescription Engine:** Calculates optimal load based on 1RM estimations, fatigue curves, and joint-protection constraints.
- **MediaPipe Computer Vision:** Uses the device camera for real-time form validation and automatic rep counting.
- **Advanced Gamification:** An effort-normalized XP system (XP Calculator), ghost sets, streaks, and a "GitHub-style" 365-day Activity Heatmap.
- **Social & P2P Arena:** Leaderboards and 1v1 challenges hosted on PostgreSQL, built to share achievements without exposing underlying encrypted logs.
- **Progressive Web App (PWA):** Installs natively on iOS and Android. Includes service workers for full offline capability.

---

## 🛠️ Technology Stack

| Domain | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, TypeScript, Framer Motion, Tailwind CSS |
| **State & Data** | Zustand, Zod, IndexedDB (idb-keyval), Recharts |
| **AI & ML** | Anthropic Claude API, MediaPipe |
| **Security** | Web Crypto API (AES-GCM), Supabase Auth (WebAuthn / Passkeys), RLS |
| **Visuals** | Three.js / React Three Fiber (3D Anatomy Viewer) |
| **DevOps** | Docker Compose, Nginx, Node.js (BFF) |

---

## 🐳 Self-Hosted Deployment (Docker Compose)

FitTrack V7 is engineered to be instantly deployed on any local homelab or VPS with Docker, ensuring 100% data sovereignty.

```bash
# 1. Clone the repository
git clone https://github.com/JucimarPatmarlove/Fittrack.git
cd Fittrack

# 2. Run the automated interactive setup
chmod +x scripts/selfhost-setup.sh
./scripts/selfhost-setup.sh

# 3. Access your private instance
open http://localhost:8090
```

The infrastructure runs on a highly optimized footprint (~200MB RAM) comprising:
- **Nginx (Frontend):** Serves the static PWA with extreme cache policies and Strict CSP/HSTS headers.
- **Node.js (BFF):** Proxies API calls to Anthropic AI, keeping secrets isolated.
- **PostgreSQL 16:** Automatically applies migrations for social/leaderboard features via `init.sql`.

> 📚 For deep configuration, port mapping, and backup strategies, read the **[Self-Hosted Guide](docs/SELFHOST.md)**.

---

## 💻 Local Development

If you wish to contribute or run the development server:

```bash
# Install dependencies
npm install

# Start the Vite dev server
npm run dev
```

### Important Scripts
- `npm run build`: Compiles the application and generates the Service Worker.
- `npm run security-check`: Scans the `dist/` folder post-build to ensure no API keys or secrets have leaked into the client bundle.
- `npm run download-exercises`: Utility script to fetch missing media assets for the exercise library.

---

## 📡 Remote Access & PWA Testing

To test the application on a mobile device (for FaceID/WebAuthn or MediaPipe features), use a secure tunnel to expose the local server:

```bash
npm run dev -- --host 0.0.0.0
# In a new terminal tab:
ngrok http 5173
```
*Note: WebAuthn (Passkeys) strictly requires a secure context (`https://` or `localhost`). Use the ngrok HTTPS URL.*

---

## 🛡️ Code Quality & Conventions

This repository enforces strict CI/CD pipelines and architectural guidelines. Before submitting a PR, ensure you review the **[Agent Instructions (AGENTS.md)](AGENTS.md)**, which dictates:
- TypeScript Strict Mode compliance (`npx tsc --noEmit`).
- Framer Motion UI/UX standards (Skeleton loading, stagger animations).
- Zod Schemas for data validation (using Discriminated Unions).
- Conventional Commits (`feat(auth): ...`).

> *"Engineering is about finding the optimal intersection between uncompromising security, seamless user experience, and relentless performance."*
