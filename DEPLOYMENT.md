# Leaderz Backend - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Project**: Set up your Supabase project with the required tables
3. **Twilio Account**: Set up your Twilio account for WhatsApp integration

## Environment Variables

Set these environment variables in your Vercel project settings:

### Required Variables
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886
```

### Optional Variables
```
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
APP_BASE_URL=https://your-backend-domain.com
LEADERBOARD_BASE_URL=https://your-frontend-domain.com
```

## Deployment Steps

### 1. Connect to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 2. Database Setup
After deployment, run the database setup scripts:

```bash
# Set up database schema
npm run db:schema

# Initialize with sample data
npm run db:init
```

### 3. Configure Twilio Webhook
Update your Twilio WhatsApp webhook URL to:
```
https://your-vercel-domain.vercel.app/twilio/webhook
```

## API Endpoints

### Health Check
- `GET /api/health` - Check if the service is running

### Leaderboard
- `GET /api/leaderboard/:tournamentNumber` - Get tournament leaderboard

### Chat
- `GET /api/chat/:tournamentNumber` - Get chat messages for a tournament

### Tournaments
- `GET /api/tournaments/:tournamentNumber` - Get tournament details
- `POST /api/tournaments` - Create a new tournament
- `PUT /api/tournaments/:id` - Update tournament
- `DELETE /api/tournaments/:id` - Delete tournament

### Golf Courses
- `POST /api/golf-courses` - Create a new golf course
- `DELETE /api/golf-courses/:id` - Delete golf course

### Twilio Webhook
- `POST /twilio/webhook` - Handle WhatsApp messages

## CORS Configuration

The backend is configured to allow requests from:
- Local development: `localhost:5173`, `localhost:3000`
- Vercel domains: `*.vercel.app`
- Custom domain: Set via `FRONTEND_URL` environment variable

## Troubleshooting

### Build Issues
- Ensure all TypeScript files compile: `npm run build`
- Check that all dependencies are in `dependencies` (not `devDependencies`)

### Runtime Issues
- Check Vercel function logs in the dashboard
- Verify environment variables are set correctly
- Test database connection with the health endpoint

### CORS Issues
- Verify the frontend domain is in the allowed origins
- Check that `NODE_ENV` is set to `production` in Vercel

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Monitoring

- Use the `/api/health` endpoint to monitor service status
- Check Vercel function logs for errors
- Monitor Supabase database performance
- Track Twilio webhook delivery status 