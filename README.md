# Leaderz Backend

A Node.js TypeScript backend for the Leaderz golf tournament leaderboard app. This service handles WhatsApp messages via Twilio webhooks and provides APIs for managing golf tournaments, teams, scores, and real-time leaderboards.

## Features

- **WhatsApp Integration**: Process incoming messages via Twilio webhooks
- **Golf Score Parsing**: Support for various score formats (numbers, golf terms, relative scores)
- **Team Management**: Create teams, add players, track scores
- **Real-time Leaderboard**: Live updates via Server-Sent Events
- **Chat System**: Team chat messages with pagination
- **Tournament Management**: Create, update, and delete tournaments
- **Golf Course Management**: Add and manage golf courses with hole configurations
- **Database Integration**: PostgreSQL with Supabase

## Prerequisites

- Node.js 18+ 
- PostgreSQL database (Supabase recommended)
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

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=whatsapp:+14155238886

# Application Configuration
APP_BASE_URL=https://your-domain.com
LEADERBOARD_BASE_URL=https://your-domain.com/leaderboardz
```

## Database Setup

1. Create a new Supabase project or use an existing PostgreSQL database
2. Run the database schema:
```bash
# Copy the schema from src/database/schema.sql and run it in your database
```

3. Initialize with sample data:
```bash
# Copy the data from src/database/init-data.sql and run it in your database
```

This will create:
- Lakehouse Golf Resort (San Marcos, CA) with 18 holes
- SD Summer Golf Invitational 2025 tournament

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
- `GET /health` - Server health status

### Twilio Webhooks
- `POST /twilio/webhook` - Incoming WhatsApp messages
- `POST /twilio/join-team` - Manual team join requests

### Leaderboard & Chat
- `GET /api/leaderboard/:tournamentId` - Get tournament leaderboard
- `GET /api/chat/:tournamentId` - Get paginated chat messages
- `GET /api/events/:tournamentId` - Server-Sent Events for real-time updates

### Golf Courses
- `POST /api/golf-courses` - Create a new golf course
- `DELETE /api/golf-courses/:id` - Delete a golf course

### Tournaments
- `POST /api/tournaments` - Create a new tournament
- `GET /api/tournaments/:urlId` - Get tournament by URL ID
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
- `tournaments` - Tournament details
- `teams` - Team information and current status
- `players` - Player information linked to teams
- `team_scores` - Individual hole scores for teams
- `chat_messages` - Team chat messages

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `NODE_ENV` | Environment (development/production) | No |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | Yes |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | Yes |
| `TWILIO_PHONE_NUMBER` | Twilio WhatsApp phone number | Yes |
| `APP_BASE_URL` | Base URL for the application | Yes |
| `LEADERBOARD_BASE_URL` | Base URL for leaderboard links | Yes |

## Twilio Setup

1. Create a Twilio account
2. Set up a WhatsApp messaging service
3. Configure the webhook URL: `https://your-domain.com/twilio/webhook`
4. Add your Twilio credentials to the environment variables

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment
Set `NODE_ENV=production` and configure all required environment variables.

### Recommended Hosting
- Vercel
- Railway
- Heroku
- DigitalOcean App Platform

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

MIT License 