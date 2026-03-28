# CareSight Frontend Dashboard

This is the CareSight caregiver dashboard built with Next.js and Tailwind CSS.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production, set this in your Vercel dashboard:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app
```

## Features

- **Real-time Dashboard**: Live monitoring of medication safety events
- **Event Timeline**: Visual timeline showing violations and corrections
- **Medication Settings**: Configure expected medication color
- **Statistics**: Track total events, violations, and corrections
- **Auto-refresh**: Updates every 5 seconds

## Deployment

### Backend (FastAPI)
Deploy the backend first to Vercel from the root directory.

### Frontend (Next.js)
1. Update `vercel.json` with your backend URL
2. Deploy to Vercel from the `frontend/` directory

The frontend will automatically connect to the backend API for real-time data.

## API Integration

The dashboard connects to these backend endpoints:
- `GET /events` - Fetch event timeline
- `GET /settings/medication` - Get medication settings
- `POST /settings/medication` - Update medication settings
