import { supabase } from '../database/connection';
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
    const { error } = await supabase
      .from('tournaments')
      .select('id')
      .limit(1);

    if (error) throw new Error(`Database connection failed: ${error.message}`);
  }

  // Golf Course operations
  static async createGolfCourse(name: string, location: string): Promise<GolfCourse> {
    const { data, error } = await supabase
      .from('golf_courses')
      .insert({ name, location })
      .select()
      .single();

    if (error) throw new Error(`Failed to create golf course: ${error.message}`);
    return data;
  }

  static async getGolfCourse(id: string): Promise<GolfCourse | null> {
    const { data, error } = await supabase
      .from('golf_courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Failed to get golf course: ${error.message}`);
    return data;
  }

  static async deleteGolfCourse(id: string): Promise<void> {
    const { error } = await supabase
      .from('golf_courses')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete golf course: ${error.message}`);
  }

  static async getGolfCourseHoles(golfCourseId: string): Promise<{ hole_number: number; par: number }[]> {
    const { data, error } = await supabase
      .from('golf_course_holes')
      .select('hole_number, par')
      .eq('golf_course_id', golfCourseId)
      .order('hole_number');

    if (error) throw new Error(`Failed to get golf course holes: ${error.message}`);
    return data || [];
  }

  static async getPars(golfCourseId: string): Promise<GolfCourseHole[]> {
    const { data, error } = await supabase
      .from('golf_course_holes')
      .select('*')
      .eq('golf_course_id', golfCourseId)
      .order('hole_number');

    if (error) throw new Error(`Failed to get pars: ${error.message}`);
    return data || [];
  }

  // Tournament operations
  static async createTournament(name: string, golfCourseId: string): Promise<Tournament> {
    const { data, error } = await supabase
      .from('tournaments')
      .insert({ name, golf_course_id: golfCourseId })
      .select()
      .single();

    if (error) throw new Error(`Failed to create tournament: ${error.message}`);
    return data;
  }

  static async getTournamentByNumber(tournamentNumber: number): Promise<Tournament | null> {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('tournament_number', tournamentNumber)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Failed to get tournament: ${error.message}`);
    return data;
  }

  static async updateTournament(id: string, updates: Partial<Tournament>): Promise<Tournament> {
    const { data, error } = await supabase
      .from('tournaments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update tournament: ${error.message}`);
    return data;
  }

  static async deleteTournament(id: string): Promise<void> {
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete tournament: ${error.message}`);
  }

  // Team operations
  static async createTeam(tournamentId: string, name: string): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .insert({ tournament_id: tournamentId, name })
      .select()
      .single();

    if (error) throw new Error(`Failed to create team: ${error.message}`);
    return data;
  }

  static async getTeamByName(tournamentId: string, name: string): Promise<Team | null> {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('name', name)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Failed to get team: ${error.message}`);
    return data;
  }

  static async getTeamById(id: string): Promise<Team | null> {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Failed to get team: ${error.message}`);
    return data;
  }

  static async deleteTeam(id: string): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) throw new Error(`Failed to delete team: ${error.message}`);
  }

  static async updateTeamScore(id: string, totalScore: number, currentHole: number): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .update({ total_score: totalScore, current_hole: currentHole })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update team score: ${error.message}`);
    return data;
  }

  // Player operations
  static async createPlayer(phoneNumber: string, name?: string): Promise<Player> {
    const { data, error } = await supabase
      .from('players')
      .insert({ phone_number: phoneNumber, name })
      .select()
      .single();

    if (error) throw new Error(`Failed to create player: ${error.message}`);
    return data;
  }

  static async addPlayerToTeam(teamId: string | undefined, phoneNumber: string, name?: string): Promise<Player> {
    const { data, error } = await supabase
      .from('players')
      .upsert(
        { team_id: teamId, phone_number: phoneNumber, name },
        { 
          onConflict: 'phone_number',
          ignoreDuplicates: false
        }
      )
      .select()
      .single();

    if (error) throw new Error(`Failed to add player to team: ${error.message}`);
    return data;
  }

  static async getPlayerByPhone(phoneNumber: string): Promise<Player | null> {
    console.log('Getting player by phone number', phoneNumber);
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Failed to get player: ${error.message}`);
    return data;
  }

  // Score operations
  static async addTeamScore(teamId: string, holeNumber: number, strokes: number): Promise<TeamScore> {
    const { data, error } = await supabase
      .from('team_scores')
      .upsert({ team_id: teamId, hole_number: holeNumber, strokes })
      .select()
      .single();

    if (error) throw new Error(`Failed to add team score: ${error.message}`);
    return data;
  }

  static async getTeamScores(teamId: string): Promise<TeamScore[]> {
    const { data, error } = await supabase
      .from('team_scores')
      .select('*')
      .eq('team_id', teamId)
      .order('hole_number');

    if (error) throw new Error(`Failed to get team scores: ${error.message}`);
    return data || [];
  }

  // Chat operations
  static async addChatMessage(tournamentId: string, teamId: string, message: string): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ tournament_id: tournamentId, team_id: teamId, message })
      .select()
      .single();

    if (error) throw new Error(`Failed to add chat message: ${error.message}`);
    return data;
  }

  static async getChatMessages(tournamentId: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<ChatMessage & { team_name: string }>> {
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('chat_messages')
      .select(`
        *,
        teams!inner(name)
      `, { count: 'exact' })
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to get chat messages: ${error.message}`);

    const messages = data?.map(msg => ({
      ...msg,
      team_name: msg.teams.name
    })) || [];

    return {
      data: messages,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  // Leaderboard operations
  static async getLeaderboard(tournamentId: string): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        total_score,
        current_hole,
        team_scores(hole_number, strokes)
      `)
      .eq('tournament_id', tournamentId)
      .eq('is_deleted', false)
      .order('total_score', { ascending: true })
      .order('current_hole', { ascending: false });

    if (error) throw new Error(`Failed to get leaderboard: ${error.message}`);

    return (data || []).map((team, index) => {
      // Transform team_scores array into object with hole_number as key
      const scores: { [hole_number: string]: number } = {};
      if (team.team_scores) {
        team.team_scores.forEach((score: any) => {
          scores[score.hole_number] = score.strokes;
        });
      }

      return {
        team_id: team.id,
        team_name: team.name,
        total_score: team.total_score,
        current_hole: team.current_hole,
        total_holes: team.team_scores?.length || 0,
        position: index + 1,
        scores
      };
    });
  }

  static async getTeamPosition(tournamentId: string, teamId: string): Promise<number> {
    const { data, error } = await supabase
      .from('teams')
      .select('id, total_score, current_hole')
      .eq('tournament_id', tournamentId)
      .eq('is_deleted', false)
      .order('total_score', { ascending: true })
      .order('current_hole', { ascending: false });

    if (error) throw new Error(`Failed to get team position: ${error.message}`);

    const team = data?.find(t => t.id === teamId);
    if (!team) return 0;

    return data?.findIndex(t => 
      t.total_score < team.total_score || 
      (t.total_score === team.total_score && t.current_hole > team.current_hole)
    ) + 1 || 0;
  }
} 