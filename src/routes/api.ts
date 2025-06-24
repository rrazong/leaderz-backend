import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { DatabaseService } from '../services/databaseService';
import fs from 'fs';
import path from 'path';

const router = Router();

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  let commit = null;
  try {
    const commitPath = path.join(__dirname, '../../commit.json');
    if (fs.existsSync(commitPath)) {
      const commitData = JSON.parse(fs.readFileSync(commitPath, 'utf-8'));
      commit = commitData.commit;
    }
  } catch (e) {
    // ignore
  }
  try {
    // Test database connection
    await DatabaseService.testConnection();
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      commit
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Database connection failed',
      commit
    });
  }
});

// Get leaderboard for a tournament
router.get('/leaderboard/:tournamentNumber', async (req: Request, res: Response) => {
  try {
    const { tournamentNumber } = req.params;
    
    if (!tournamentNumber) {
      return res.status(400).json({ error: 'Tournament number is required' });
    }
    
    const tournament = await DatabaseService.getTournamentByNumber(parseInt(tournamentNumber));
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const leaderboard = await DatabaseService.getLeaderboard(tournament.id);
    const parsArray = await DatabaseService.getPars(tournament.golf_course_id);
    
    // Transform pars array into object format expected by frontend
    const pars = parsArray.reduce((acc, hole) => {
      acc[hole.hole_number.toString()] = hole.par;
      return acc;
    }, {} as { [hole_number: string]: number });
    
    return res.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        tournament_number: tournament.tournament_number,
        status: tournament.status
      },
      leaderboard,
      pars
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get paginated chat messages for a tournament
router.get('/chat/:tournamentNumber', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tournamentNumber } = req.params;
    if (!tournamentNumber) {
      return res.status(400).json({ error: 'Tournament number is required' });
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const tournament = await DatabaseService.getTournamentByNumber(parseInt(tournamentNumber));
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const chatMessages = await DatabaseService.getChatMessages(tournament.id, page, limit);
    
    return res.json(chatMessages);
  } catch (error) {
    console.error('Error getting chat messages:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Golf Course routes
router.post('/golf-courses', [
  body('name').notEmpty().withMessage('Golf course name is required'),
  body('location').notEmpty().withMessage('Golf course location is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, location } = req.body;
    const golfCourse = await DatabaseService.createGolfCourse(name, location);
    
    return res.status(201).json(golfCourse);
  } catch (error) {
    console.error('Error creating golf course:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/golf-courses/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Golf course ID is required' });
    }
    
    await DatabaseService.deleteGolfCourse(id);
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting golf course:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Tournament routes
router.post('/tournaments', [
  body('name').notEmpty().withMessage('Tournament name is required'),
  body('golfCourseId').notEmpty().withMessage('Golf course ID is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, golfCourseId } = req.body;
    
    const tournament = await DatabaseService.createTournament(name, golfCourseId);
    
    return res.status(201).json(tournament);
  } catch (error) {
    console.error('Error creating tournament:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tournaments/:tournamentNumber', async (req: Request, res: Response) => {
  try {
    const { tournamentNumber } = req.params;
    if (!tournamentNumber) {
      return res.status(400).json({ error: 'Tournament number is required' });
    }
    
    const tournament = await DatabaseService.getTournamentByNumber(parseInt(tournamentNumber));
    
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    
    return res.json(tournament);
  } catch (error) {
    console.error('Error getting tournament:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/tournaments/:id', [
  body('name').optional().notEmpty().withMessage('Tournament name cannot be empty'),
  body('status').optional().isIn(['active', 'completed', 'cancelled']).withMessage('Invalid status')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Tournament ID is required' });
    }
    
    const updates = req.body;
    
    const tournament = await DatabaseService.updateTournament(id, updates);
    
    return res.json(tournament);
  } catch (error) {
    console.error('Error updating tournament:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/tournaments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Tournament ID is required' });
    }
    
    await DatabaseService.deleteTournament(id);
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 