# Inventory Management System

A modern inventory management system built with Next.js frontend and Node.js backend, replacing the legacy PARTS ENTRY system with a professional, user-friendly interface.

## Features

- **User Authentication**: Secure login and registration with JWT tokens
- **Part Management**: Complete CRUD operations for inventory parts
- **Model Association**: Link model numbers and quantities to parts (P1/P2 tabs)
- **Search & Filter**: Quick search and pagination for parts list
- **Modern UI**: Clean, responsive interface built with shadcn/ui components
- **Real-time Updates**: Instant updates across all panels

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Zustand for state management
- Axios for API calls

### Backend
- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT authentication
- bcryptjs for password hashing

## Prerequisites

- Node.js 18+ and npm
- Git

**Note:** This project uses SQLite, so no database server installation is required!

## Setup Instructions

### 1. Navigate to Project

```bash
cd "CTC-ERP system/frontend"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

The `.env` file should be configured for SQLite. If you need to create it:

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
```

**Note:** SQLite database file (`dev.db`) will be created automatically in the `prisma` folder.

### 4. Initialize Database (if needed)

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Create Admin User (optional)

```bash
npm run create-admin
```

### 6. Start the Application

```bash
npm run dev
```

The application will run on `http://localhost:3000`
- Frontend: `http://localhost:3000`
- API: `http://localhost:3000/api`

### 4. Access the Application

1. Open `http://localhost:3000` in your browser
2. Register a new account or login
3. Start managing your inventory!

## Project Structure

```
CTC-ERP-system/
├── frontend/                 # Main application (merged frontend + backend)
│   ├── app/
│   │   ├── (auth)/          # Auth pages
│   │   ├── dashboard/       # Main inventory panel
│   │   └── api/             # Next.js API routes
│   ├── server/
│   │   └── src/
│   │       ├── routes/      # Express API routes
│   │       ├── middleware/  # Auth middleware
│   │       └── scripts/     # Utility scripts
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── inventory/       # Inventory components
│   │   └── layout/          # Layout components
│   ├── lib/                 # Utilities, API client, Prisma
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── migrations/      # Database migrations
│   ├── server.ts            # Custom Next.js server with Express
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Parts
- `GET /api/parts` - List all parts (with pagination and search)
- `GET /api/parts/:id` - Get single part with models
- `GET /api/parts/partno/:partNo` - Get part by part number
- `POST /api/parts` - Create new part
- `PUT /api/parts/:id` - Update part
- `DELETE /api/parts/:id` - Delete part
- `GET /api/parts/search/:query` - Search parts

### Models
- `GET /api/models/part/:partId` - Get models for a part
- `POST /api/models/part/:partId` - Add model to part
- `PUT /api/models/:id` - Update model
- `DELETE /api/models/:id` - Delete model

All endpoints except `/api/auth/register` and `/api/auth/login` require authentication.

## Database Schema

- **User**: Authentication and user management
- **Part**: Main inventory part information
- **PartModel**: Model numbers and quantities associated with parts
- **Stock**: Stock levels for parts

## Development

### Backend
```bash
cd backend
npm run dev      # Development mode with hot reload
npm run build    # Build for production
npm start        # Run production build
```

### Frontend
```bash
cd frontend
npm run dev      # Development mode
npm run build    # Build for production
npm start        # Run production build
```

## Production Deployment

### 🚀 Single Command Installation (Recommended)

**No Docker required!** Just upload files and run:

```bash
sudo bash install-production.sh
```

See **[INSTALL.md](./INSTALL.md)** for complete instructions.

### Alternative: Docker Setup

If you prefer Docker, see:
- **[Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)** - Docker-based deployment
- **[Quick Start Production](./README_PRODUCTION.md)** - Docker quick start
- **[Quick Reference](./QUICK_REFERENCE.md)** - Command reference

### What Gets Installed

The native installation script (`install-production.sh`) automatically:
- ✅ Installs Node.js, PostgreSQL, Nginx, PM2
- ✅ Sets up database and user
- ✅ Builds backend and frontend
- ✅ Configures reverse proxy
- ✅ Sets up SSL certificates (if domain provided)
- ✅ Starts all services with PM2
- ✅ Handles errors automatically

## Notes

- **Development**: This project uses SQLite for local development
- **Production**: Use PostgreSQL for production (see production guides)
- Make sure PostgreSQL is running before starting the backend in production
- Update the `DATABASE_URL` in `.env` to match your database setup
- The JWT_SECRET should be a strong, random string in production
- All API calls from the frontend automatically include the authentication token

## License

ISC

