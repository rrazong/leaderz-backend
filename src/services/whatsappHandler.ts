import { TwilioWebhookBody } from '../types';
import { DatabaseService } from './databaseService';
import { TwilioService } from './twilioService';
import { connectionManager } from './connectionManager';
import { parseScore } from '../utils/scoreParser';
import { nanoid } from 'nanoid';

export class WhatsAppHandler {
  private static readonly DEFAULT_TOURNAMENT_URL_ID = 'SD2025';
  private static readonly LEADERBOARD_BASE_URL = process.env.LEADERBOARD_BASE_URL || 'https://your-domain.com/leaderboardz';

  static async handleMessage(webhookBody: TwilioWebhookBody): Promise<void> {
    const { Body, From } = webhookBody;
    const phoneNumber = TwilioService.formatPhoneNumber(From);
    const message = Body.trim();

    try {
      // Get or create player
      let player = await DatabaseService.getPlayerByPhone(phoneNumber);
      
      if (!player) {
        // New player - welcome them
        await this.handleNewPlayer(phoneNumber, message);
        return;
      }

      if (!player.team_id) {
        const team = message;
        await this.handleTeamJoin(phoneNumber, team);
        return;
      }

      // Existing player - process their message
      await this.handleExistingPlayer(player, message);
    } catch (error) {
      console.error('Error handling WhatsApp message:', error);
      await TwilioService.sendMessage(phoneNumber, 'Sorry, there was an error processing your message. Please try again.');
    }
  }

  private static async handleNewPlayer(phoneNumber: string, message: string): Promise<void> {
    // Save the player
    console.log('Creating player', phoneNumber);
    await DatabaseService.createPlayer(phoneNumber);

    const welcomeMessage = `Welcome to the "SD Summer Golf Invitational 2025" tournament! 🏌️‍♂️

What team are you on? Just send me your team name and I'll add you to the leaderboard.`;
    
    await TwilioService.sendMessage(phoneNumber, welcomeMessage);
  }

  private static async handleExistingPlayer(player: any, message: string): Promise<void> {
    const tournament = await DatabaseService.getTournamentByUrlId(this.DEFAULT_TOURNAMENT_URL_ID);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const team = await DatabaseService.getTeamById(player.team_id);
    if (!team) {
      throw new Error('Team not found');
    }

    const messageLower = message.toLowerCase();

    // Handle help request
    if (messageLower === 'help') {
      await this.sendHelpMessage(player.phone_number, team, tournament);
      return;
    }

    // Handle team deletion
    if (messageLower.startsWith('delete ')) {
      await this.handleTeamDeletion(player, message, tournament);
      return;
    }

    // Check if this is a score submission
    const golfCourseHoles = await DatabaseService.getGolfCourseHoles(tournament.golf_course_id);
    const currentHolePar = golfCourseHoles.find(h => h.hole_number === team.current_hole)?.par;
    
    if (currentHolePar && parseScore(message, currentHolePar)) {
      await this.handleScoreSubmission(player, team, tournament, message, currentHolePar);
      return;
    }

    // Handle chat message
    await this.handleChatMessage(player, team, tournament, message);
  }

  private static async sendHelpMessage(phoneNumber: string, team: any, tournament: any): Promise<void> {
    const leaderboardUrl = `${this.LEADERBOARD_BASE_URL}/${tournament.url_id}`;
    
    const helpMessage = `Your team '${team.name}' is on Hole ${team.current_hole}.

You can enter your score, like '4' or 'par'
Or, to fix a previous score, like 'bogey on 9'
Or, you can type anything else and it will appear on the leaderboard chat

Leaderboard: ${leaderboardUrl}`;

    await TwilioService.sendMessage(phoneNumber, helpMessage);
  }

  private static async handleTeamDeletion(player: any, message: string, tournament: any): Promise<void> {
    const teamName = message.substring(7).trim(); // Remove "delete " prefix
    const team = await DatabaseService.getTeamByName(tournament.id, teamName);

    if (!team || team.id !== player.team_id) {
      await TwilioService.sendMessage(player.phone_number, `You can only delete your own team. Your team is '${player.teams.name}'.`);
      return;
    }

    // Check if team has submitted any scores
    const teamScores = await DatabaseService.getTeamScores(team.id);
    if (teamScores.length > 0) {
      await TwilioService.sendMessage(player.phone_number, 'Cannot delete team after scores have been submitted.');
      return;
    }

    // Delete the team
    await DatabaseService.deleteTeam(team.id);
    
    const response = `Team '${teamName}' has been deleted. What team are you on?`;
    await TwilioService.sendMessage(player.phone_number, response);
  }

  private static async handleScoreSubmission(player: any, team: any, tournament: any, message: string, par: number): Promise<void> {
    const scoreInput = parseScore(message, par);
    if (!scoreInput) {
      await TwilioService.sendMessage(player.phone_number, 'Invalid score format. Please try again.');
      return;
    }

    // Add the score
    await DatabaseService.addTeamScore(team.id, team.current_hole, scoreInput.strokes);

    // Calculate new total score
    const teamScores = await DatabaseService.getTeamScores(team.id);
    const totalScore = teamScores.reduce((sum, score) => sum + score.strokes, 0);

    // Determine next hole
    const golfCourseHoles = await DatabaseService.getGolfCourseHoles(tournament.golf_course_id);
    const totalHoles = golfCourseHoles.length;
    const nextHole = team.current_hole < totalHoles ? team.current_hole + 1 : team.current_hole;

    // Update team
    await DatabaseService.updateTeamScore(team.id, totalScore, nextHole);

    // Broadcast leaderboard update to connected clients
    try {
      const leaderboard = await DatabaseService.getLeaderboard(tournament.id);
      const pars = await DatabaseService.getPars(tournament.golf_course_id);
      
      // Transform pars from array to object format expected by frontend
      const parsObject = pars.reduce((acc, hole) => {
        acc[hole.hole_number] = hole.par;
        return acc;
      }, {} as { [hole_number: string]: number });

      connectionManager.broadcastToTournament(tournament.url_id, {
        type: 'leaderboard',
        leaderboard,
        pars: parsObject
      }, 'leaderboard');
    } catch (error) {
      console.error('Error broadcasting leaderboard update:', error);
    }

    const leaderboardUrl = `${this.LEADERBOARD_BASE_URL}/${tournament.url_id}`;
    const strokeText = scoreInput.strokes === 1 ? 'stroke' : 'strokes';
    let response = `Got it. Hole #${team.current_hole}, ${scoreInput.strokes} ${strokeText} (${scoreInput.description})`;

    if (team.current_hole === totalHoles) {
      // Tournament completed
      const position = await DatabaseService.getTeamPosition(tournament.id, team.id);
      const place = position === 1 ? '1st' : position === 2 ? '2nd' : position === 3 ? '3rd' : `${position}th`;
      response += `\n\n🎉 Congratulations! You've completed the tournament!\nFinal Score: ${totalScore}\nCurrent Place: ${place}\n\nLeaderboard: ${leaderboardUrl}`;
    } else {
      response += `\n\nLeaderboard: ${leaderboardUrl}`;
    }

    await TwilioService.sendMessage(player.phone_number, response);
  }

  private static async handleChatMessage(player: any, team: any, tournament: any, message: string): Promise<void> {
    // Add chat message to database
    const chatMessage = await DatabaseService.addChatMessage(tournament.id, team.id, message);
    
    // Broadcast chat update to connected clients
    try {
      const messageWithTeamName = {
        ...chatMessage,
        team_name: team.name
      };
      
      connectionManager.broadcastToTournament(tournament.url_id, {
        type: 'chat',
        message: messageWithTeamName
      }, 'chat');
    } catch (error) {
      console.error('Error broadcasting chat update:', error);
    }
    
    const response = `Message sent to leaderboard chat! 📱\n\nLeaderboard: ${this.LEADERBOARD_BASE_URL}/${tournament.url_id}`;
    await TwilioService.sendMessage(player.phone_number, response);
  }

  static async handleTeamJoin(phoneNumber: string, teamName: string): Promise<void> {
    const tournament = await DatabaseService.getTournamentByUrlId(this.DEFAULT_TOURNAMENT_URL_ID);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Check if team exists
    let team = await DatabaseService.getTeamByName(tournament.id, teamName);
    
    if (!team) {
      // Create new team
      team = await DatabaseService.createTeam(tournament.id, teamName);
    }

    // Add player to team
    await DatabaseService.addPlayerToTeam(team.id, phoneNumber);

    const leaderboardUrl = `${this.LEADERBOARD_BASE_URL}/${tournament.url_id}`;
    const response = `Welcome to team '${teamName}'! 🏌️‍♂️

You're now on Hole ${team.current_hole}. Send me your score when you finish each hole.

Leaderboard: ${leaderboardUrl}`;

    await TwilioService.sendMessage(phoneNumber, response);
  }
} 