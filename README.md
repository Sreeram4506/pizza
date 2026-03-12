# Pizza Blast - Premium Neapolitan Pizza Website

A modern, premium Neapolitan pizza restaurant website with smooth animations, responsive design, and an AI-powered chatbot for menu, orders, tracking, and customer support.

![Pizza Blast](https://images.unsplash.com/photo-1574071318508-1cdbad80ad50?w=800)

## Features

- **Premium Design**: Mediterranean aesthetic with high-end typography (Cormorant Garamond)
- **Smooth Animations**: Framer Motion, GSAP, scroll-based reveals
- **AI Chatbot**: NVIDIA-powered intent recognition for menu, orders, and support
- **Real-time Updates**: Socket.io for order status and admin notifications
- **Secure Payments**: Integrated with Stripe
- **Admin Dashboard**: Full control over menu, orders, customers, and analytics

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, GSAP
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB (Mongoose)
- **AI**: NVIDIA NIM (Meta Llama 3)
- **Payments**: Stripe

## Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB (Local or Atlas)
- NVIDIA API Key (for Chatbot)
- Stripe Keys (for Payments)

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your keys

# Run both frontend and backend
npm run dev
```

## Production Readiness Checklist

This project is equipped with production-grade features:

- [x] **Security**: Helmet, Rate Limiting, NoSQL Injection protection
- [x] **Performance**: Response compression, MongoDB indexing
- [x] **Reliability**: Centralized error handling, environment validation
- [x] **Resilience**: Frontend Error Boundaries, Health check routes
- [x] **Analytics**: Integrated dashboard for sales and customer behavior

## Deployment

Refer to [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on deploying to **Vercel** (Frontend) and **Render** (Backend).

## License

MIT
