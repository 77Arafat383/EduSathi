# 🚀 EduSathi Deployment Guide

This guide provides step-by-step instructions to deploy EduSathi to production.

---

## 📌 Architecture Overview

EduSathi consists of:
1. **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS (served via Nginx).
2. **Backend:** Express 4 + TypeScript REST API.
3. **Database:** PostgreSQL (Cloud Supabase or self-hosted) with zero-config embedded SQLite fallback.
4. **AI Assistants:** Multi-provider LLM support (Google Gemini, Groq LPU, OpenAI).

---

## 🌟 Method 1: All-In-One Docker VPS Deployment (Recommended)

This is the easiest and most robust method. Both the frontend and backend are deployed onto a single Linux VPS (e.g., DigitalOcean Droplet, AWS EC2, Hetzner, Linode) using Docker Compose.

### Step 1: Provision a Server
- Operating System: **Ubuntu 22.04 LTS** or **Ubuntu 24.04 LTS**
- Minimum Specs: **1 vCPU, 1 GB RAM** (2 GB recommended)

### Step 2: Install Docker on the Server
SSH into your server and run:
```bash
# Update and install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Enable Docker without sudo
sudo usermod -aG docker $USER
newgrp docker

# Verify Docker installation
docker --version
docker compose version
```

### Step 3: Clone the Repository
```bash
git clone https://github.com/your-username/edusathi.git
cd edusathi
```

### Step 4: Configure Production Environment Variables
Create your production `.env` file on the server:
```bash
cp .env.example .env
nano .env
```
Fill in your production secrets:
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=generate_a_random_64_char_secret_key_here
DATABASE_URL=postgresql://postgres:yourpassword@db.supabase.co:5432/postgres

# AI Keys
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
AI_PROVIDER=gemini
```

### Step 5: Start the Application with Docker Compose
```bash
# Build and start the containers in detached mode
docker compose up -d --build
```

### Step 6: Verify Deployment
Check the running containers and logs:
```bash
# Check container status
docker compose ps

# View live application logs
docker compose logs -f
```
Your application is now live at `http://your-server-ip`! Nginx automatically handles the frontend and proxies all `/api/*` requests to the backend.

### Step 7: (Optional) Setup Custom Domain & Free SSL (HTTPS)
If you have a domain (e.g. `edusathi.com`):
1. Point your domain's DNS `A` record to your server's IP address.
2. Install Certbot to secure your domain with Let's Encrypt SSL:
```bash
sudo apt update && sudo apt install -y certbot python3-certbot-nginx
```

---

## ☁️ Method 2: Free-Tier Serverless / PaaS Deployment

If you prefer not to manage a Linux VPS server, you can deploy the frontend, backend, and database separately across free cloud platforms:

### 1. Database &rarr; Supabase (PostgreSQL)
1. Sign up at [supabase.com](https://supabase.com) and create a new project.
2. Go to **Project Settings &rarr; Database &rarr; Connection string (URI)**.
3. Copy the URI (e.g. `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`).
4. Paste this into your `DATABASE_URL` environment variable.

### 2. Backend API &rarr; Render.com
1. Sign up at [render.com](https://render.com) and click **New + &rarr; Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. In **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `DATABASE_URL`: *(Your Supabase connection string)*
   - `JWT_SECRET`: *(A secure random string)*
   - `AI_API_KEY`: *(Your AI API key)*
   - `GROQ_API_KEY`: *(Your Groq API key)*
   - `OPENAI_API_KEY`: *(Your OpenAI API key)*
   - `CLIENT_URL`: `https://your-frontend.vercel.app`
5. Click **Deploy Web Service**. You will get a URL like `https://edusathi-api.onrender.com`.

### 3. Frontend &rarr; Vercel (or Netlify)
1. Sign up at [vercel.com](https://vercel.com) and click **Add New &rarr; Project**.
2. Import your GitHub repository.
3. Set **Root Directory** to `client`.
4. Framework Preset will automatically detect **Vite**.
5. In **Environment Variables**, add:
   - `VITE_API_URL`: `https://edusathi-api.onrender.com/api`
6. Click **Deploy**. Your frontend is now live with global CDN edge caching!

---

## 🛠️ Helpful Docker Commands

| Command | Action |
| :--- | :--- |
| `docker compose up -d` | Start all containers in the background |
| `docker compose down` | Stop all containers |
| `docker compose logs -f` | Stream live server logs |
| `docker compose restart` | Restart all services |
| `docker compose build --no-cache` | Rebuild images from scratch |
| `docker compose ps` | Check running container status and health |

