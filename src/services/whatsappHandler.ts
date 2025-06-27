import { TwilioWebhookBody } from '../types/index';
import { DatabaseService } from './databaseService';
import { TwilioService } from './twilioService';
import { EventService } from './eventService';
import { parseScore } from '../utils/scoreParser';

export class WhatsAppHandler {
  private static readonly DEFAULT_TOURNAMENT_NUMBER = 1000;
  private static readonly LEADERBOARD_BASE_URL = process.env.LEADERBOARD_BASE_URL || 'https://leaderz-frontend-production.up.railway.app';

  static async handleMessage(webhookBody: TwilioWebhookBody): Promise<void> {
    const { Body, From } = webhookBody;
    const phoneNumber = TwilioService.formatPhoneNumber(From);
    const message = Body.trim();
    console.log('Handling message from', phoneNumber, message);

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
    const tournament = await DatabaseService.getTournamentByNumber(this.DEFAULT_TOURNAMENT_NUMBER);
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

    // Handle fix score request
    if (messageLower === 'fix') {
      await this.handleFixScoreRequest(player, team, tournament);
      return;
    }

    // Check if this is a score submission
    const golfCourseHoles = await DatabaseService.getGolfCourseHoles(tournament.golf_course_id);
    const currentHolePar = golfCourseHoles.find(h => h.hole_number === team.current_hole)?.par;
    
    if (currentHolePar && parseScore(message, currentHolePar)) {
      await this.handleScoreSubmission(player, team, tournament, message, currentHolePar);
      return;
    }

    // Check for golf terms and provide helpful response
    const golfTerms = ['birdie', 'eagle', 'albatross', 'bogey', 'par', 'double', 'triple', 'quad', 'ace', 'hole in one', 'snowman'];
    const messageLowerTrim = message.toLowerCase().trim();
    if (golfTerms.includes(messageLowerTrim)) {
      await TwilioService.sendMessage(player.phone_number, `Please enter the number of strokes you took on Hole ${team.current_hole}, not the golf term. For example, if you got a bogey on a par 4, enter "5".`);
      return;
    }

    // Handle chat message
    await this.handleChatMessage(player, team, tournament, message);
  }

  private static async sendHelpMessage(phoneNumber: string, team: any, tournament: any): Promise<void> {
    const leaderboardUrl = `${this.LEADERBOARD_BASE_URL}/tournament/${tournament.tournament_number}`;
    
    const helpMessage = `'${team.name}' is on Hole ${team.current_hole}.

You can enter your score by saying the number of strokes you took, like "4".
To fix your score for the current hole, say "fix" (only works before moving to the next hole).
Or, say "help" to see this message again.
Anything else you say will appear on the leaderboard chat.

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

  private static async handleFixScoreRequest(player: any, team: any, tournament: any): Promise<void> {
    // Find the most recent hole with a score
    const teamScores = await DatabaseService.getTeamScores(team.id);
    if (!teamScores || teamScores.length === 0) {
      await TwilioService.sendMessage(player.phone_number, `You haven't entered a score for Hole #1 yet. Please enter your score first.`);
      return;
    }
    // Find the highest hole number with a score
    const lastScoredHole = Math.max(...teamScores.map(s => s.hole_number));
    const lastScore = teamScores.find(s => s.hole_number === lastScoredHole);
    if (!lastScore) {
      await TwilioService.sendMessage(player.phone_number, `You haven't entered a score for Hole #1 yet. Please enter your score first.`);
      return;
    }
    // Set the team to fix mode (no need to store hole number)
    await DatabaseService.setTeamFixMode(team.id, true);
    const response = `Okay, let's fix your score.\nWhat is your score for Hole #${lastScoredHole}?`;
    await TwilioService.sendMessage(player.phone_number, response);
  }

  private static async handleScoreSubmission(player: any, team: any, tournament: any, message: string, par: number): Promise<void> {
    const scoreInput = parseScore(message, par);
    if (!scoreInput) {
      await TwilioService.sendMessage(player.phone_number, 'Invalid score format. Please try again.');
      return;
    }

    // Check for score of 0
    if (scoreInput.strokes === 0) {
      await TwilioService.sendMessage(player.phone_number, `LOL, can't have zero strokes! Please enter the number of strokes the team took on Hole #${team.current_hole}`);
      return;
    }

    // Check if team is in fix mode
    const isFixMode = await DatabaseService.isTeamInFixMode(team.id);

    console.log('current hole', team.current_hole);
    console.log('scoreInput', scoreInput);
    console.log('isFixMode', isFixMode);
    
    if (isFixMode) {
      // Always fix the most recent hole with a score
      const teamScores = await DatabaseService.getTeamScores(team.id);
      if (!teamScores || teamScores.length === 0) {
        await TwilioService.sendMessage(player.phone_number, `You haven't entered any scores yet. Please enter your score for Hole #1 first.`);
        await DatabaseService.setTeamFixMode(team.id, false);
        return;
      }
      const lastScoredHole = Math.max(...teamScores.map(s => s.hole_number));
      await DatabaseService.updateTeamScoreForHole(team.id, lastScoredHole, scoreInput.strokes);
      // Recalculate total score
      const updatedScores = await DatabaseService.getTeamScores(team.id);
      const totalScore = updatedScores.reduce((sum, score) => sum + score.strokes, 0);
      await DatabaseService.updateTeamScore(team.id, totalScore, team.current_hole);
      await DatabaseService.setTeamFixMode(team.id, false);
      // Broadcast leaderboard update
      await EventService.broadcastLeaderboardUpdate(tournament.tournament_number);
      await EventService.broadcastTeamScoreUpdate(tournament.tournament_number, team.id);
      const leaderboardUrl = `${this.LEADERBOARD_BASE_URL}/tournament/${tournament.tournament_number}`;
      const strokeText = scoreInput.strokes === 1 ? 'stroke' : 'strokes';
      const response = `Got it. Hole #${lastScoredHole}, ${scoreInput.strokes} ${strokeText}\n\nTo fix your score for Hole #${lastScoredHole}, say "fix"\nOtherwise, let me know what you score for Hole #${team.current_hole + 1}\n\nLeaderboard: ${leaderboardUrl}`;
      await TwilioService.sendMessage(player.phone_number, response);
      return;
    }

    // Regular score submission - check if this is for the next hole
    const currentHoleScore = await DatabaseService.getTeamScoreForHole(team.id, team.current_hole);
    
    if (currentHoleScore) {
      // Team already has a score for current hole, this must be for next hole
      const golfCourseHoles = await DatabaseService.getGolfCourseHoles(tournament.golf_course_id);
      const nextHole = team.current_hole + 1;
      
      if (nextHole > golfCourseHoles.length) {
        await TwilioService.sendMessage(player.phone_number, 'You have already completed all holes in the tournament!');
        return;
      }
      
      // Add score for next hole
      await DatabaseService.addTeamScore(team.id, nextHole, scoreInput.strokes);
      
      // Calculate new total score
      const teamScores = await DatabaseService.getTeamScores(team.id);
      const totalScore = teamScores.reduce((sum, score) => sum + score.strokes, 0);
      
      // Update team to next hole
      await DatabaseService.updateTeamScore(team.id, totalScore, nextHole);
      
      // Broadcast leaderboard update
      await EventService.broadcastLeaderboardUpdate(tournament.tournament_number);
      await EventService.broadcastTeamScoreUpdate(tournament.tournament_number, team.id);
      
      const leaderboardUrl = `${this.LEADERBOARD_BASE_URL}/tournament/${tournament.tournament_number}`;
      const strokeText = scoreInput.strokes === 1 ? 'stroke' : 'strokes';
      let response = `Got it. Hole #${nextHole}, ${scoreInput.strokes} ${strokeText}`;
      await TwilioService.sendMessage(player.phone_number, response);
      return;
    }
  }

  private static async handleChatMessage(player: any, team: any, tournament: any, message: string): Promise<void> {
    // Add chat message to database
    const chatMessage = await DatabaseService.addChatMessage(tournament.id, team.id, message);
    // Broadcast chat update
    await EventService.broadcastChatUpdate(tournament.tournament_number, chatMessage);
    const response = `Message sent to leaderboard chat! 📱\n\nLeaderboard: ${this.LEADERBOARD_BASE_URL}/tournament/${tournament.tournament_number}`;
    await TwilioService.sendMessage(player.phone_number, response);
  }

  static async handleTeamJoin(phoneNumber: string, teamName: string): Promise<void> {
    const tournament = await DatabaseService.getTournamentByNumber(this.DEFAULT_TOURNAMENT_NUMBER);
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
    const leaderboardUrl = `${this.LEADERBOARD_BASE_URL}/tournament/${tournament.tournament_number}`;
    const response = `Welcome to team '${teamName}'! 🏌️‍♂️\n\nYou're now on Hole #${team.current_hole}. Send me your score when you finish each hole.\n\nLeaderboard: ${leaderboardUrl}`;
    await TwilioService.sendMessage(phoneNumber, response);
    // Show help message after joining
    await this.sendHelpMessage(phoneNumber, team, tournament);
  }
}