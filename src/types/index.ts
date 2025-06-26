export interface GolfCourse {
  id: string;
  name: string;
  location: string;
  created_at: Date;
  updated_at: Date;
}

export interface GolfCourseHole {
  id: string;
  golf_course_id: string;
  hole_number: number;
  par: number;
  created_at: Date;
}

export interface Tournament {
  id: string;
  tournament_number: number;
  name: string;
  golf_course_id: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export interface Team {
  id: string;
  tournament_id: string;
  name: string;
  current_hole: number;
  total_score: number;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Player {
  id: string;
  team_id?: string;
  phone_number: string;
  name?: string;
  created_at: Date;
}

export interface TeamScore {
  id: string;
  team_id: string;
  hole_number: number;
  strokes: number;
  created_at: Date;
}

export interface ChatMessage {
  id: string;
  tournament_id: string;
  team_id: string;
  message: string;
  created_at: Date;
  team_name?: string;
}

export interface LeaderboardEntry {
  team_id: string;
  team_name: string;
  total_score: number;
  current_hole: number;
  total_holes: number;
  position: number;
  scores: { [hole_number: string]: number };
}

export interface TwilioWebhookBody {
  Body: string;
  From: string;
  To: string;
  MessageSid: string;
  AccountSid: string;
}

export interface ScoreInput {
  raw: string;
  strokes: number;
  description: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} 