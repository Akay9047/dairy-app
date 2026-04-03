# 🐄 Smart Dairy Solution
### Aapki Apni Digital Dairy — Rajasthan Dairy Management System

A complete production-ready dairy management web application built for rural dairy owners in Rajasthan.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Validation | Zod |
| Data Fetching | React Query |
| Styling | Tailwind CSS |

---

## Features

- ✅ Admin Authentication (JWT)
- ✅ Farmer (Kisaan) Management — Add / Edit / Delete / Search
- ✅ Milk Entry — Daily collection with auto fat calculation
- ✅ Receipt Generation — Print, PDF Download
- ✅ WhatsApp & SMS Notifications
- ✅ Dashboard with charts
- ✅ Reports — Farmer-wise, Monthly summary, CSV Export
- ✅ Payments (Bhugtan) Tracking
- ✅ Hinglish UI (Hindi + English)
- ✅ Mobile-friendly responsive design

---

## Prerequisites

- Node.js v18+
- PostgreSQL (local or cloud)
- npm

---

## Setup Instructions

### 1. Clone / Download the project

```bash
cd dairy-app
```

### 2. Install all dependencies

```bash
npm run install:all
```

### 3. Configure the database

Create a PostgreSQL database:
```sql
CREATE DATABASE dairy_db;
```

Copy and configure the server environment:
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/dairy_db"
JWT_SECRET="your-secret-key-change-this"
PORT=5000
```

### 4. Run database migrations

```bash
npm run db:migrate
```

### 5. Seed the database (creates admin + sample farmers)

```bash
npm run db:seed
```

Default login after seed:
- **Username:** admin
- **Password:** dairy@1234

### 6. Start the application

```bash
npm run dev
```

This starts:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## WhatsApp Integration Setup

1. Create a Meta Developer account at https://developers.facebook.com
2. Create a WhatsApp Cloud API app
3. Get your **Access Token** and **Phone Number ID**
4. Add to `server/.env`:
```env
WHATSAPP_TOKEN="EAAxxxxxxxxxxxxxxx"
WHATSAPP_PHONE_ID="1234567890"
```

---

## SMS Integration Setup (Twilio)

1. Create account at https://twilio.com
2. Get Account SID, Auth Token, and a phone number
3. Add to `server/.env`:
```env
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_PHONE="+1234567890"
```

---

## Project Structure

```
dairy-app/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # Reusable components
│       │   ├── receipt/    # Receipt with PDF/Print
│       │   └── ui/         # Layout, Sidebar
│       ├── pages/          # Route pages
│       ├── hooks/          # Auth context
│       └── lib/            # API client
├── server/                 # Express backend
│   └── src/
│       ├── routes/         # API routes
│       ├── middleware/      # Auth middleware
│       ├── lib/             # Prisma client
│       └── seed.ts         # DB seed
├── shared/                 # Shared types/schemas
└── package.json            # Root scripts
```

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/login | Admin login |
| GET | /api/farmers | List farmers |
| POST | /api/farmers | Add farmer |
| PUT | /api/farmers/:id | Update farmer |
| DELETE | /api/farmers/:id | Delete farmer |
| GET | /api/milk | List milk entries |
| POST | /api/milk | Add milk entry |
| PUT | /api/milk/:id | Edit entry |
| DELETE | /api/milk/:id | Delete entry |
| GET | /api/dashboard/stats | Dashboard data |
| GET | /api/reports/monthly | Monthly report |
| GET | /api/reports/farmer/:id | Farmer report |
| GET | /api/reports/export/csv | CSV export |
| POST | /api/notify/whatsapp/:id | Send WhatsApp |
| POST | /api/notify/sms/:id | Send SMS |

---

## Fat Rate Formula

Standard formula used in Rajasthan dairy cooperatives:

```
Fat Rate = Fat% × 0.5
Rate per Liter = (Fat% × 0.33) + 6.5
Total Amount = Liters × Rate per Liter
```

You can adjust these constants in:
- `server/src/routes/milk.ts` (backend calculation)
- `client/src/pages/MilkEntryPage.tsx` (frontend preview)

---

## Useful Commands

```bash
npm run dev           # Start both frontend and backend
npm run dev:client    # Frontend only
npm run dev:server    # Backend only
npm run db:migrate    # Run DB migrations
npm run db:seed       # Seed admin + sample data
npm run db:studio     # Open Prisma Studio (DB GUI)
npm run build         # Build for production
```

---

## 🙏 Aapke vishwas ka shukriya!
