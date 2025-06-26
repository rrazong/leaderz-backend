# Leaderz Backend

A Node.js TypeScript backend for the Leaderz golf tournament leaderboard app. This service handles WhatsApp messages via Twilio webhooks and provides APIs for managing golf tournaments, teams, scores, and real-time leaderboards.

## Features

- **WhatsApp Integration**: Process incoming messages via Twilio webhooks
- **Golf Score Parsing**: Support for various score formats (numbers, golf terms, relative scores)
- **Team Management**: Create teams, add players, track scores
- **Real-time Leaderboard**: Live updates via Server-Sent Events (SSE)
- **Chat System**: Team chat messages with pagination
- **Tournament Management**: Create, update, and delete tournaments
- **Golf Course Management**: Add and manage golf courses with hole configurations
- **Database Integration**: PostgreSQL with Railway

## Prerequisites

- Node.js 22+ 
- PostgreSQL database (Railway recommended)
- Twilio account with WhatsApp messaging service
- TypeScript

## Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd leaderz-backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment example file:
```bash
cp env.example .env
```

4. Configure your environment variables in `.env`:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Railway Postgres Configuration
PGHOST=your_railway_pg_host
PGPORT=5432
PGUSER=your_railway_pg_user
PGPASSWORD=your_railway_pg_password
PGDATABASE=your_railway_pg_database

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=whatsapp:+14155238886

# Application Configuration
APP_BASE_URL=https://your-domain.com
LEADERBOARD_BASE_URL=https://leaderz-frontend-production.up.railway.app

# Frontend URL (for CORS in production)
FRONTEND_URL=https://your-frontend-domain.com
```

## Database Setup

1. Create a Railway project and add a Postgres plugin
2. Run the database schema:
```bash
npm run db:schema
```

3. Initialize with sample data:
```bash
npm run db:init
```

This will create:
- Lakehouse Golf Resort (San Marcos, CA) with 18 holes
- SD Summer Golf Invitational 2025 tournament (tournament number: 1000)

## Development

Start the development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- `GET /api/health` - Server health status (includes git commit hash)

### Twilio Webhooks
- `POST /twilio/webhook` - Incoming WhatsApp messages

### Leaderboard & Chat
- `GET /api/leaderboard/:tournamentNumber` - Get tournament leaderboard
- `GET /api/chat/:tournamentNumber` - Get paginated chat messages
- `POST /api/chat/:tournamentNumber` - Add a new chat message

### Real-time Updates (SSE)
- `GET /api/leaderboard/:tournamentNumber/stream` - Server-Sent Events for real-time leaderboard updates
- `GET /api/chat/:tournamentNumber/stream` - Server-Sent Events for real-time chat updates

### Golf Courses
- `POST /api/golf-courses` - Create a new golf course
- `DELETE /api/golf-courses/:id` - Delete a golf course

### Tournaments
- `POST /api/tournaments` - Create a new tournament
- `GET /api/tournaments/:tournamentNumber` - Get tournament by tournament number
- `PUT /api/tournaments/:id` - Update tournament
- `DELETE /api/tournaments/:id` - Delete tournament

## WhatsApp Message Formats

### Score Submissions
Players can submit scores in various formats:

**Numbers**: `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`
**Words**: `one`, `two`, `three`, `four`, `five`, `six`, `seven`, `eight`, `nine`, `ten`
**Golf Terms**: `hole in one`, `ace`, `albatross`, `eagle`, `birdie`, `par`, `bogey`, `double bogey`, `triple bogey`, `quadruple bogey`
**Relative Scores**: `+1`, `+2`, `+3`, `+4` (strokes over par)
**Special**: `max`, `double par` (double par for the hole)

### Commands
- `help` - Get help message with current status
- `delete <team name>` - Delete your team (only if no scores submitted)

### Chat Messages
Any other message is treated as a chat message and appears on the leaderboard.

## Database Schema

### Tables
- `golf_courses` - Golf course information
- `golf_course_holes` - Hole configurations for each course
- `tournaments` - Tournament details (with auto-incrementing tournament numbers starting at 1000)
- `teams` - Team information and current status
- `players` - Player information linked to teams
- `team_scores` - Individual hole scores for teams
- `chat_messages` - Team chat messages

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `NODE_ENV` | Environment (development/production) | No |
| `PGHOST` | Railway Postgres host | Yes |
| `PGPORT` | Railway Postgres port | No (default: 5432) |
| `PGUSER` | Railway Postgres user | Yes |
| `PGPASSWORD` | Railway Postgres password | Yes |
| `PGDATABASE` | Railway Postgres database name | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | Yes |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | Yes |
| `TWILIO_PHONE_NUMBER` | Twilio WhatsApp phone number | Yes |
| `APP_BASE_URL` | Base URL for the application | Yes |
| `LEADERBOARD_BASE_URL` | Base URL for leaderboard links | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | No |

## Railway Setup

1. Create a Railway account at [railway.app](https://railway.app)
2. Create a new project and connect your GitHub repository
3. Add a Postgres plugin to your project
4. Set all required environment variables in the Railway dashboard
5. Deploy your application

## Twilio Setup

1. Create a Twilio account
2. Set up a WhatsApp messaging service
3. Configure the webhook URL: `https://your-railway-app.up.railway.app/twilio/webhook`
4. Add your Twilio credentials to the environment variables

## Deployment

### Railway Deployment
1. Push your code to GitHub
2. Connect your repository to Railway
3. Add a Postgres plugin
4. Set environment variables
5. Deploy automatically on every push

### Production Build
```bash
npm run build
npm start
```

### Environment
Set `NODE_ENV=production` and configure all required environment variables.

### Recommended Hosting
- Railway (recommended)
- Render
- Fly.io
- Heroku
- DigitalOcean App Platform

## Real-time Updates

The backend uses Server-Sent Events (SSE) for real-time updates:

- **Leaderboard updates**: Sent when scores are submitted via WhatsApp
- **Chat updates**: Sent when new messages are added via WhatsApp or API
- **Connection management**: Automatic cleanup of disconnected clients

### Frontend Integration

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

## Testing

Run tests:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT 