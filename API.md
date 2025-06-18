# Leaderz API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
Currently, the API does not require authentication. In production, consider implementing API keys or JWT tokens.

## Endpoints

### Health Check
**GET** `/health`

Returns server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "environment": "development"
}
```

### Twilio Webhooks

#### Incoming WhatsApp Messages
**POST** `/twilio/webhook`

Handles incoming WhatsApp messages from Twilio.

**Request Body:**
```json
{
  "Body": "4",
  "From": "whatsapp:+1234567890",
  "To": "whatsapp:+14155238886",
  "MessageSid": "SM1234567890",
  "AccountSid": "AC1234567890"
}
```

**Response:** `200 OK` (empty response)

#### Manual Team Join
**POST** `/twilio/join-team`

Manually add a player to a team.

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "teamName": "The Noobies"
}
```

**Response:**
```json
{
  "message": "Team join request processed"
}
```

### Leaderboard & Chat

#### Get Leaderboard
**GET** `/api/leaderboard/:tournamentId`

Get the current leaderboard for a tournament.

**Parameters:**
- `tournamentId` (string) - Tournament URL ID (e.g., "SD2025")

**Response:**
```json
{
  "tournament": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "SD Summer Golf Invitational 2025",
    "url_id": "SD2025",
    "status": "active"
  },
  "leaderboard": [
    {
      "team_name": "Tiger's Team",
      "current_score": 72,
      "current_hole": 18,
      "total_holes": 18,
      "position": 1
    },
    {
      "team_name": "The Noobies",
      "current_score": 78,
      "current_hole": 15,
      "total_holes": 15,
      "position": 2
    }
  ]
}
```

#### Get Chat Messages
**GET** `/api/chat/:tournamentId`

Get paginated chat messages for a tournament.

**Parameters:**
- `tournamentId` (string) - Tournament URL ID
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Messages per page (default: 20, max: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "tournament_id": "660e8400-e29b-41d4-a716-446655440001",
      "team_id": "880e8400-e29b-41d4-a716-446655440003",
      "message": "Hi everyone, LFG!",
      "created_at": "2025-01-15T10:30:00.000Z",
      "team_name": "The Noobies"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Server-Sent Events
**GET** `/api/events/:tournamentId`

Real-time updates for tournament events.

**Parameters:**
- `tournamentId` (string) - Tournament URL ID

**Response:** Server-Sent Events stream

**Event Types:**
- `connected` - Initial connection established
- `ping` - Keep-alive ping (every 30 seconds)
- `score_update` - New score submitted
- `chat_message` - New chat message
- `team_join` - New team joined

### Golf Courses

#### Create Golf Course
**POST** `/api/golf-courses`

Create a new golf course.

**Request Body:**
```json
{
  "name": "Pebble Beach Golf Links",
  "location": "Pebble Beach, CA"
}
```

**Response:**
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440004",
  "name": "Pebble Beach Golf Links",
  "location": "Pebble Beach, CA",
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T10:30:00.000Z"
}
```

#### Delete Golf Course
**DELETE** `/api/golf-courses/:id`

Delete a golf course.

**Parameters:**
- `id` (string) - Golf course ID

**Response:** `204 No Content`

### Tournaments

#### Create Tournament
**POST** `/api/tournaments`

Create a new tournament.

**Request Body:**
```json
{
  "name": "Spring Championship 2025",
  "golfCourseId": "990e8400-e29b-41d4-a716-446655440004"
}
```

**Response:**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440005",
  "url_id": "Spr25",
  "name": "Spring Championship 2025",
  "golf_course_id": "990e8400-e29b-41d4-a716-446655440004",
  "status": "active",
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T10:30:00.000Z"
}
```

#### Get Tournament
**GET** `/api/tournaments/:urlId`

Get tournament details by URL ID.

**Parameters:**
- `urlId` (string) - Tournament URL ID

**Response:**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440005",
  "url_id": "Spr25",
  "name": "Spring Championship 2025",
  "golf_course_id": "990e8400-e29b-41d4-a716-446655440004",
  "status": "active",
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T10:30:00.000Z"
}
```

#### Update Tournament
**PUT** `/api/tournaments/:id`

Update tournament details.

**Parameters:**
- `id` (string) - Tournament ID

**Request Body:**
```json
{
  "name": "Updated Tournament Name",
  "status": "completed"
}
```

**Response:**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440005",
  "url_id": "Spr25",
  "name": "Updated Tournament Name",
  "golf_course_id": "990e8400-e29b-41d4-a716-446655440004",
  "status": "completed",
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T10:35:00.000Z"
}
```

#### Delete Tournament
**DELETE** `/api/tournaments/:id`

Delete a tournament.

**Parameters:**
- `id` (string) - Tournament ID

**Response:** `204 No Content`

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "errors": [
    {
      "type": "field",
      "value": "",
      "msg": "Message body is required",
      "path": "Body",
      "location": "body"
    }
  ]
}
```

### 404 Not Found
```json
{
  "error": "Tournament not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Something went wrong"
}
```

## Rate Limiting

API endpoints are rate-limited to 100 requests per 15 minutes per IP address.

## WhatsApp Message Formats

### Score Submissions
Players can submit scores in various formats:

**Numbers:** `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`
**Words:** `one`, `two`, `three`, `four`, `five`, `six`, `seven`, `eight`, `nine`, `ten`
**Golf Terms:** `hole in one`, `ace`, `albatross`, `eagle`, `birdie`, `par`, `bogey`, `double bogey`, `triple bogey`, `quadruple bogey`
**Relative Scores:** `+1`, `+2`, `+3`, `+4` (strokes over par)
**Special:** `max`, `double par` (double par for the hole)

### Commands
- `help` - Get help message with current status
- `delete <team name>` - Delete your team (only if no scores submitted)

### Chat Messages
Any other message is treated as a chat message and appears on the leaderboard. 