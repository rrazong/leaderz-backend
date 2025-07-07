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
- `GET /api/leaderboard/:tournamentKey` - Get tournament leaderboard
- `GET /api/chat/:tournamentKey` - Get paginated chat messages
- `POST /api/chat/:tournamentKey` - Add a new chat message

### Real-time Updates (SSE)
- `GET /api/sse/:tournamentKey` - Server-Sent Events for real-time updates (leaderboard and chat)

### Golf Courses
- `POST /api/golf-courses` - Create a new golf course
- `DELETE /api/golf-courses/:id` - Delete a golf course

### Tournaments
- `POST /api/tournaments` - Create a new tournament
- `GET /api/tournaments/:tournamentKey` - Get tournament by tournament key
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
- `tournaments` - Tournament details (tournament name, golf course, and status)
- `teams` - Team information and current status
- `players` - Player information linked to teams
- `team_scores` - Individual hole scores for teams
- `chat_messages` - Team chat messages

## Tournament Keys

Tournament keys are alphanumeric strings that provide a user-friendly way to identify tournaments compared to numeric tournament numbers. They are generated using a custom character set and are reversible.

### Character Set

Tournament keys use the character set: `"23478GLFZHARD"`

This set was chosen to:
- Avoid confusing characters (0/O, 1/I, 6/G, 9/g)
- Include golf-related letters (G, L, F, Z, H, A, R, D)
- Provide a good balance of length and readability

### Generation Algorithm

Tournament keys are generated using a custom character set approach:

1. Convert the tournament number to base-13 (length of character set)
2. Map each digit to the corresponding character in the set
3. Pad with leading '2' characters to ensure minimum length of 4

### Examples

- Tournament #1000 → "2GRD"
- Tournament #1234 → "2F7D" 
- Tournament #9999 → "8F44"

### Database Schema

The `tournaments` table includes a `tournament_key` column:

```sql
ALTER TABLE tournaments ADD COLUMN tournament_key VARCHAR(20) UNIQUE;
```

### Migration

To migrate existing tournaments to use tournament keys:

1. Run the database schema update:
   ```bash
   npm run db:schema
   ```

2. Run the migration script:
   ```bash
   npm run db:migrate
   ```

This will run all pending migrations, including generating tournament keys for all existing tournaments that don't have one.

### Frontend Integration

The frontend uses tournament keys in URLs:

- Old: `/tournament/1000`
- New: `/tournament/2GRD`

### Utility Functions

```typescript
import { generateTournamentKey, tournamentKeyToNumber } from '../utils/tournamentKeyGenerator';

// Generate key from number
const key = generateTournamentKey(1000); // "2GRD"

// Convert key back to number
const number = tournamentKeyToNumber("2GRD"); // 1000
```

### Benefits

1. **User-friendly**: Easier to share and remember than numeric IDs
2. **Golf-themed**: Uses golf-related letters in the character set
3. **Reversible**: Can convert back to tournament numbers if needed
4. **Collision-free**: Each tournament number maps to a unique key
5. **Consistent length**: Minimum 4 characters for readability

### Backward Compatibility

The system maintains backward compatibility by:
- Keeping tournament numbers in the database (internal use only)
- Supporting tournament keys in all external APIs
- Providing migration tools for existing data

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

- **Unified updates**: Single SSE endpoint for both leaderboard and chat updates
- **Leaderboard updates**: Sent when scores are submitted via WhatsApp
- **Chat updates**: Sent when new messages are added via WhatsApp or API
- **Connection management**: Automatic cleanup of disconnected clients

### Frontend Integration

```javascript
// Unified real-time updates
const eventSource = new EventSource('/api/sse/2GRD');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'leaderboard_update') {
    // Update your leaderboard UI
  } else if (data.type === 'chat_update') {
    // Update your chat UI
  }
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