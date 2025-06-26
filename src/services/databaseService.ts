import pool from '../database/pgPool';
import { 
  GolfCourse, 
  Tournament, 
  Team, 
  Player, 
  TeamScore, 
  ChatMessage, 
  LeaderboardEntry,
  PaginatedResponse,
  GolfCourseHole
} from '../types/index';

export class DatabaseService {
  // Test database connection
  static async testConnection(): Promise<void> {
    await pool.query('SELECT 1');
  }

  // Golf Course operations
  static async createGolfCourse(name: string, location: string): Promise<GolfCourse> {
    const { rows } = await pool.query(
      'INSERT INTO golf_courses (name, location) VALUES ($1, $2) RETURNING *',
      [name, location]
    );
    return rows[0];
  }

  static async getGolfCourse(id: string): Promise<GolfCourse | null> {
    const { rows } = await pool.query(
      'SELECT * FROM golf_courses WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  static async deleteGolfCourse(id: string): Promise<void> {
    await pool.query('DELETE FROM golf_courses WHERE id = $1', [id]);
  }

  static async getGolfCourseHoles(golfCourseId: string): Promise<{ hole_number: number; par: number }[]> {
    const { rows } = await pool.query(
      'SELECT hole_number, par FROM golf_course_holes WHERE golf_course_id = $1 ORDER BY hole_number',
      [golfCourseId]
    );
    return rows;
  }

  static async getPars(golfCourseId: string): Promise<GolfCourseHole[]> {
    const { rows } = await pool.query(
      'SELECT * FROM golf_course_holes WHERE golf_course_id = $1 ORDER BY hole_number',
      [golfCourseId]
    );
    return rows;
  }

  // Tournament operations
  static async createTournament(name: string, golfCourseId: string): Promise<Tournament> {
    const { rows } = await pool.query(
      'INSERT INTO tournaments (name, golf_course_id) VALUES ($1, $2) RETURNING *',
      [name, golfCourseId]
    );
    return rows[0];
  }

  static async getTournamentByNumber(tournamentNumber: number): Promise<Tournament | null> {
    const { rows } = await pool.query(
      'SELECT * FROM tournaments WHERE tournament_number = $1',
      [tournamentNumber]
    );
    return rows[0] || null;
  }

  static async updateTournament(id: string, updates: Partial<Tournament>): Promise<Tournament> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    if (fields.length === 0) throw new Error('No updates provided');
    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE tournaments SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, id]
    );
    return rows[0];
  }

  static async deleteTournament(id: string): Promise<void> {
    await pool.query('DELETE FROM tournaments WHERE id = $1', [id]);
  }

  // Team operations
  static async createTeam(tournamentId: string, name: string): Promise<Team> {
    const { rows } = await pool.query(
      'INSERT INTO teams (tournament_id, name) VALUES ($1, $2) RETURNING *',
      [tournamentId, name]
    );
    return rows[0];
  }

  static async getTeamByName(tournamentId: string, name: string): Promise<Team | null> {
    const { rows } = await pool.query(
      'SELECT * FROM teams WHERE tournament_id = $1 AND name = $2 AND is_deleted = false',
      [tournamentId, name]
    );
    return rows[0] || null;
  }

  static async getTeamById(id: string): Promise<Team | null> {
    const { rows } = await pool.query(
      'SELECT * FROM teams WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return rows[0] || null;
  }

  static async deleteTeam(id: string): Promise<void> {
    await pool.query('UPDATE teams SET is_deleted = true WHERE id = $1', [id]);
  }

  static async updateTeamScore(id: string, totalScore: number, currentHole: number): Promise<Team> {
    const { rows } = await pool.query(
      'UPDATE teams SET total_score = $1, current_hole = $2 WHERE id = $3 RETURNING *',
      [totalScore, currentHole, id]
    );
    return rows[0];
  }

  // Player operations
  static async createPlayer(phoneNumber: string, name?: string): Promise<Player> {
    const { rows } = await pool.query(
      'INSERT INTO players (phone_number, name) VALUES ($1, $2) ON CONFLICT (phone_number) DO UPDATE SET name = EXCLUDED.name RETURNING *',
      [phoneNumber, name || null]
    );
    return rows[0];
  }

  static async addPlayerToTeam(teamId: string | undefined, phoneNumber: string, name?: string): Promise<Player> {
    const { rows } = await pool.query(
      'UPDATE players SET team_id = $1, name = COALESCE($3, name) WHERE phone_number = $2 RETURNING *',
      [teamId, phoneNumber, name || null]
    );
    return rows[0];
  }

  static async getPlayerByPhone(phoneNumber: string): Promise<Player | null> {
    const { rows } = await pool.query(
      'SELECT * FROM players WHERE phone_number = $1',
      [phoneNumber]
    );
    return rows[0] || null;
  }

  // Team Score operations
  static async addTeamScore(teamId: string, holeNumber: number, strokes: number): Promise<TeamScore> {
    const { rows } = await pool.query(
      'INSERT INTO team_scores (team_id, hole_number, strokes) VALUES ($1, $2, $3) ON CONFLICT (team_id, hole_number) DO UPDATE SET strokes = EXCLUDED.strokes RETURNING *',
      [teamId, holeNumber, strokes]
    );
    return rows[0];
  }

  static async getTeamScores(teamId: string): Promise<TeamScore[]> {
    const { rows } = await pool.query(
      'SELECT * FROM team_scores WHERE team_id = $1',
      [teamId]
    );
    return rows;
  }

  // Chat Message operations
  static async addChatMessage(tournamentId: string, teamId: string, message: string): Promise<ChatMessage & { team_name: string }> {
    const { rows } = await pool.query(
      `WITH inserted_message AS (
         INSERT INTO chat_messages (tournament_id, team_id, message) 
         VALUES ($1, $2, $3) 
         RETURNING *
       )
       SELECT im.*, t.name as team_name
       FROM inserted_message im
       JOIN teams t ON im.team_id = t.id`,
      [tournamentId, teamId, message]
    );
    return rows[0];
  }

  static async getChatMessages(tournamentId: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<ChatMessage & { team_name: string }>> {
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT cm.*, t.name as team_name
       FROM chat_messages cm
       JOIN teams t ON cm.team_id = t.id
       WHERE cm.tournament_id = $1
       ORDER BY cm.created_at DESC
       LIMIT $2 OFFSET $3`,
      [tournamentId, limit, offset]
    );
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM chat_messages WHERE tournament_id = $1',
      [tournamentId]
    );
    const total = Number(countResult.rows[0].count);
    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Leaderboard
  static async getLeaderboard(tournamentId: string): Promise<LeaderboardEntry[]> {
    const { rows } = await pool.query(
      `SELECT
        t.id as team_id,
        t.name as team_name,
        t.total_score,
        t.current_hole,
        COUNT(ts.hole_number) as total_holes,
        RANK() OVER (ORDER BY t.total_score ASC) as position,
        json_object_agg(ts.hole_number, ts.strokes) as scores
      FROM teams t
      LEFT JOIN team_scores ts ON t.id = ts.team_id
      WHERE t.tournament_id = $1 AND t.is_deleted = false
      GROUP BY t.id
      ORDER BY t.total_score ASC, t.current_hole DESC` ,
      [tournamentId]
    );
    return rows;
  }

  static async getTeamPosition(tournamentId: string, teamId: string): Promise<number> {
    const { rows } = await pool.query(
      `SELECT position FROM (
        SELECT t.id, RANK() OVER (ORDER BY t.total_score ASC) as position
        FROM teams t
        WHERE t.tournament_id = $1 AND t.is_deleted = false
      ) ranked WHERE id = $2`,
      [tournamentId, teamId]
    );
    return rows[0]?.position || null;
  }
} 