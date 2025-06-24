import { sseManager } from './sseManager';
import { DatabaseService } from './databaseService';

export class EventService {
  // Broadcast leaderboard updates
  static async broadcastLeaderboardUpdate(tournamentNumber: number) {
    try {
      const tournament = await DatabaseService.getTournamentByNumber(tournamentNumber);
      if (!tournament) return;

      const leaderboard = await DatabaseService.getLeaderboard(tournament.id);
      const parsArray = await DatabaseService.getPars(tournament.golf_course_id);
      
      // Transform pars array into object format expected by frontend
      const pars = parsArray.reduce((acc, hole) => {
        acc[hole.hole_number.toString()] = hole.par;
        return acc;
      }, {} as { [hole_number: string]: number });

      const data = {
        type: 'leaderboard_update',
        tournament: {
          id: tournament.id,
          name: tournament.name,
          tournament_number: tournament.tournament_number,
          status: tournament.status
        },
        leaderboard,
        pars
      };

      sseManager.broadcast(tournamentNumber.toString(), 'leaderboard', data);
    } catch (error) {
      console.error('Error broadcasting leaderboard update:', error);
    }
  }

  // Broadcast chat message updates
  static async broadcastChatUpdate(tournamentNumber: number, newMessage?: any) {
    try {
      const tournament = await DatabaseService.getTournamentByNumber(tournamentNumber);
      if (!tournament) return;

      const data = {
        type: 'chat_update',
        tournament_number: tournamentNumber,
        newMessage
      };

      sseManager.broadcast(tournamentNumber.toString(), 'chat', data);
    } catch (error) {
      console.error('Error broadcasting chat update:', error);
    }
  }

  // Broadcast team score update
  static async broadcastTeamScoreUpdate(tournamentNumber: number, teamId: string) {
    try {
      const tournament = await DatabaseService.getTournamentByNumber(tournamentNumber);
      if (!tournament) return;

      const team = await DatabaseService.getTeamById(teamId);
      if (!team) return;

      const data = {
        type: 'team_score_update',
        tournament_number: tournamentNumber,
        team: {
          id: team.id,
          name: team.name,
          total_score: team.total_score,
          current_hole: team.current_hole
        }
      };

      sseManager.broadcast(tournamentNumber.toString(), 'leaderboard', data);
    } catch (error) {
      console.error('Error broadcasting team score update:', error);
    }
  }
} 