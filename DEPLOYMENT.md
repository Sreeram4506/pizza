# 🚀 Pizza Blast Deployment Guide

This guide outlines how to deploy the **Pizza Blast** application to **Vercel** (Frontend) and **Render** (Backend).

## 📡 Deployment Strategy

*   **Frontend**: React (Vite) deployed on [Vercel](https://vercel.com)
*   **Backend**: Node.js (Express) + Socket.IO deployed on [Render](https://render.com)
*   **Database**: MongoDB Atlas

---

## 🛠️ Step 1: Backend Deployment (Render)

1.  Connect your GitHub repository to **Render**.
2.  Create a new **Web Service**.
3.  **Name**: `pizza-backend`
4.  **Runtime**: `Node`
5.  **Build Command**: `npm install`
6.  **Start Command**: `npm run server`
7.  **Environment Variables**:
    *   `PORT`: `5000` (Render sets this automatically)
    *   `NODE_ENV`: `production`
    *   `MONGODB_URI`: `your_mongodb_atlas_uri`
    *   `JWT_SECRET`: `your_secure_random_string`
    *   `NVIDIA_API_KEY`: `your_nvidia_key`
    *   `STRIPE_SECRET_KEY`: `your_stripe_sk`
    *   `FRONTEND_URL`: `https://pizza-blast-frontend.vercel.app` (The URL where your frontend will live)
    *   `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (For email delivery)

---

## ⚡ Step 2: Frontend Deployment (Vercel)

1.  Connect your GitHub repository to **Vercel**.
2.  Import the project.
3.  **Root Directory**: `./` (or the folder containing `package.json`)
4.  **Framework Preset**: `Vite`
5.  **Build Command**: `npm run build`
6.  **Output Directory**: `dist`
7.  **Environment Variables**:
    *   `VITE_API_URL`: `https://pizza-backend.onrender.com` (Your Render URL)
    *   `VITE_WS_URL`: `pizza-backend.onrender.com` (Render host without protocol)
    *   `VITE_STRIPE_PUBLISHABLE_KEY`: `your_stripe_pk`
8.  **Vercel Configuration**:
    The included `vercel.json` will automatically proxy `/api` and `/socket.io` requests to your backend.

---

## 📝 Critical Deployment Files Updated

*   **`vercel.json`**: Configured to proxy API requests and Socket.IO.
*   **`server/middleware/tenant.js`**: Updated to ignore Render/Vercel domains for testing.
*   **`server/index.js`**: Added health check at `/api/health` and dynamic CORS.
*   **`src/services/websocket.js`**: Dynamic WebSocket support.

---

## ✅ Post-Deployment Checks

1.  **Health Check**: Visit `https://your-backend.onrender.com/api/health`
2.  **WebSocket**: Open browser console on the frontend and ensure "WebSocket connected" appears.
3.  **AI Chat**: Test the chatbot to ensure backend communication is working.
