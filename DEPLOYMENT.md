# Leaderz Backend - Railway Deployment Guide

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Railway Postgres Database**: Set up a managed Postgres database in Railway
3. **Twilio Account**: Set up your Twilio account for WhatsApp integration

## Environment Variables

Set these environment variables in your Railway project settings:

### Required Variables
```
PGHOST=your_railway_pg_host
PGPORT=5432
PGUSER=your_railway_pg_user
PGPASSWORD=your_railway_pg_password
PGDATABASE=your_railway_pg_database
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

## Managed Postgres on Railway

1. In your Railway project, click **"Add Plugin"** and select **Postgres**.
2. Railway will provision a Postgres database and set the connection variables automatically.
3. Use these variables in your backend or scripts as needed (see `env.example`).

## Deployment Steps

### 1. Push Your Code to GitHub
- Railway deploys from GitHub (or GitLab). Commit and push your latest code.

### 2. Create a New Railway Project
- Go to [railway.app](https://railway.app/)
- Click **"New Project"** → **"Deploy from GitHub repo"**
- Select your repo and follow the prompts

### 3. Set Environment Variables
- In the Railway dashboard, go to your project → **Variables**
- Add all required variables from above
- If you added a Railway Postgres plugin, the variables will be set automatically

### 4. Deploy
- Railway will automatically build and deploy your app on every push to your repo
- You can also trigger a manual deploy from the dashboard

### 5. Database Setup (Optional)
After deployment, you may want to run your DB setup scripts:

```bash
# Set up database schema
npm run db:schema

# Initialize with sample data
npm run db:init
```

You can run these from the Railway shell or locally (with the right env vars).

### 6. Configure Twilio Webhook
Update your Twilio WhatsApp webhook URL to:
```
https://your-railway-app.up.railway.app/twilio/webhook
```

## API Endpoints

### Health Check
- `GET /api/health` - Check if the service is running (includes git commit hash)

### Leaderboard
- `GET /api/leaderboard/:tournamentNumber` - Get tournament leaderboard

### Chat
- `GET /api/chat/:tournamentNumber` - Get chat messages for a tournament
- `POST /api/chat/:tournamentNumber` - Add a new chat message

### Real-time Updates (SSE)
- `GET /api/leaderboard/:tournamentNumber/stream` - Server-Sent Events for real-time leaderboard updates
- `GET /api/chat/:tournamentNumber/stream` - Server-Sent Events for real-time chat updates

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

## Real-time Updates

The backend uses **Server-Sent Events (SSE)** for real-time updates:

- **Leaderboard updates**: Sent when scores are submitted via WhatsApp
- **Chat updates**: Sent when new messages are added via WhatsApp or API
- **Connection management**: Automatic cleanup of disconnected clients

### Frontend Integration

To connect to SSE streams from your frontend:

```javascript
// Leaderboard updates
const eventSource = new EventSource('/api/leaderboard/1000/stream');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Update your leaderboard UI
};

// Chat updates
const chatEventSource = new EventSource('/api/chat/1000/stream');
chatEventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Update your chat UI
};
```

## CORS Configuration

The backend is configured to allow requests from:
- Local development: `localhost:5173`, `localhost:3000`
- Railway domains: `*.up.railway.app`
- Custom domain: Set via `FRONTEND_URL` environment variable

## Troubleshooting

### Build Issues
- Ensure all TypeScript files compile: `npm run build`
- Check that all dependencies are in `dependencies` (not `devDependencies`)

### Runtime Issues
- Check Railway logs in the dashboard
- Verify environment variables are set correctly
- Test database connection with the health endpoint

### CORS Issues
- Verify the frontend domain is in the allowed origins
- Check that `NODE_ENV` is set to `production` in Railway

### SSE Issues
- Ensure your frontend is connecting to the correct SSE endpoints
- Check that CORS is properly configured for SSE connections
- Monitor Railway logs for SSE connection errors

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

- Use the `/api/health` endpoint to monitor service status (shows git commit hash)
- Check Railway logs for errors
- Monitor Railway Postgres database performance
- Track Twilio webhook delivery status
- Monitor SSE connection counts and performance 