import { sseManager } from './sseManager';
import { DatabaseService } from './databaseService';

export class EventService {
  // Broadcast leaderboard updates
  static async broadcastLeaderboardUpdate(tournamentKey: string) {
    try {
      const tournament = await DatabaseService.getTournamentByKey(tournamentKey);
      
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
          tournament_key: tournament.tournament_key,
          status: tournament.status
        },
        leaderboard,
        pars
      };

      sseManager.broadcast(tournamentKey, 'leaderboard', data);
    } catch (error) {
      console.error('Error broadcasting leaderboard update:', error);
    }
  }

  // Broadcast chat message updates
  static async broadcastChatUpdate(tournamentKey: string, newMessage?: any) {
    try {
      const tournament = await DatabaseService.getTournamentByKey(tournamentKey);
      
      if (!tournament) return;

      const data = {
        type: 'chat_update',
        tournament_key: tournament.tournament_key,
        newMessage
      };

      sseManager.broadcast(tournamentKey, 'chat', data);
    } catch (error) {
      console.error('Error broadcasting chat update:', error);
    }
  }

  // Broadcast team score update
  static async broadcastTeamScoreUpdate(tournamentKey: string, teamId: string) {
    try {
      const tournament = await DatabaseService.getTournamentByKey(tournamentKey);
      
      if (!tournament) return;

      const team = await DatabaseService.getTeamById(teamId);
      if (!team) return;

      const data = {
        type: 'team_score_update',
        tournament_key: tournament.tournament_key,
        team: {
          id: team.id,
          name: team.name,
          total_score: team.total_score,
          current_hole: team.current_hole
        }
      };

      sseManager.broadcast(tournamentKey, 'leaderboard', data);
    } catch (error) {
      console.error('Error broadcasting team score update:', error);
    }
  }
} 