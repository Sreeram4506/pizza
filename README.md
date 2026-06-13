# Burger Blast - Premium Burger Shop Website

A modern, premium fast-food burger restaurant website with smooth animations, responsive design, and an AI-powered chatbot for menu, orders, tracking, and customer support.

![Burger Blast](https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800)

## Features

- **Premium Design**: Dark theme with warm food palette (orange, red, gold)
- **Smooth Animations**: Framer Motion, GSAP, scroll-based reveals, 3D hover effects
- **AI Chatbot**: Intent recognition for menu, orders, tracking, gift cards, FAQs
- **Responsive**: Mobile-first design, works on all devices
- **Fast**: Vite + React, optimized builds

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, GSAP
- **Backend**: Node.js, Express
- **Data**: JSON menu, in-memory order storage

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone or navigate to project
cd Website

# Install dependencies
npm install

# Run both frontend and backend
npm run dev
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### Alternative: Run separately

```bash
# Terminal 1 - Frontend
npm run dev:frontend

# Terminal 2 - Backend
npm run dev:backend
```

## Project Structure

```
Website/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── Navbar.jsx
│   │   ├── Hero.jsx
│   │   ├── About.jsx
│   │   ├── BurgerGallery.jsx
│   │   ├── ComboDeals.jsx
│   │   ├── Testimonials.jsx
│   │   ├── Contact.jsx
│   │   ├── Footer.jsx
│   │   └── Chatbot.jsx
│   ├── context/
│   │   └── ChatbotContext.jsx
│   ├── data/
│   │   └── menu.json    # Menu data
│   ├── utils/
│   │   └── chatbotLogic.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── server/
│   ├── routes/
│   │   ├── menu.js
│   │   └── orders.js
│   ├── config.js
│   └── index.js
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Chatbot Capabilities

| Intent | Triggers | Response |
|--------|----------|----------|
| Menu | "menu", "burgers", "what do you have" | Shows burger list with prices |
| Order | "order", "buy", "place order" | Order flow, popular items |
| Track | "track", "order status" | Asks for order ID/phone |
| Gift Cards | "gift card" | Shows amounts ($25-$200) |
| Hours | "hours", "open" | Mon-Sun 10AM-11PM |
| Location | "address", "where" | 123 Burger Street |
| Contact | "phone", "email" | Contact details |
| Delivery | "delivery" | Fee, min order |
| Offers | "deals", "combos" | Combo deals |

## API Endpoints

- `GET /api/menu` - Full menu (burgers, combos, sides, drinks)
- `GET /api/menu/burgers` - Burgers only
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders/track/:phone` - Track by phone

## Build for Production

```bash
npm run build
```

Output in `dist/`. Serve with any static host. For full API support, deploy the Express server.

## Customization

- **Menu**: Edit `src/data/menu.json`
- **Colors**: Edit `tailwind.config.js` (burger, primary colors)
- **Restaurant info**: Update `restaurant` in `menu.json`

## License

MIT
