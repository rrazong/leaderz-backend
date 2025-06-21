import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { DatabaseService } from '../services/databaseService';
import { connectionManager } from '../services/connectionManager';
import { nanoid } from 'nanoid';

const router = Router();

// Get leaderboard for a tournament
router.get('/leaderboard/:tournamentId', async (req: Request, res: Response) => {
  try {
    const { tournamentId } = req.params;
    
    if (!tournamentId) {
      return res.status(400).json({ error: 'Tournament ID is required' });
    }
    
    const tournament = await DatabaseService.getTournamentByUrlId(tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const leaderboard = await DatabaseService.getLeaderboard(tournament.id);
    const pars = await DatabaseService.getPars(tournament.golf_course_id);
    
    // Transform pars from array to object format expected by frontend
    const parsObject = pars.reduce((acc, hole) => {
      acc[hole.hole_number] = hole.par;
      return acc;
    }, {} as { [hole_number: string]: number });
    
    return res.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        url_id: tournament.url_id,
        status: tournament.status
      },
      leaderboard,
      pars: parsObject
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get paginated chat messages for a tournament
router.get('/chat/:tournamentId', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tournamentId } = req.params;
    if (!tournamentId) {
      return res.status(400).json({ error: 'Tournament ID is required' });
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const tournament = await DatabaseService.getTournamentByUrlId(tournamentId);
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

// Server-Sent Events for real-time chat updates
router.get('/chat/events/:tournamentId', (req: Request, res: Response) => {
  const { tournamentId } = req.params;
  
  if (!tournamentId) {
    return res.status(400).json({ error: 'Tournament ID is required' });
  }

  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Add connection to manager
  connectionManager.addConnection(tournamentId, res, 'chat');

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', tournamentId })}\n\n`);

  // Keep connection alive with periodic pings
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
  }, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
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
    
    // Generate a 6-character URL-friendly ID
    const urlId = nanoid(6);
    
    const tournament = await DatabaseService.createTournament(name, golfCourseId, urlId);
    
    return res.status(201).json(tournament);
  } catch (error) {
    console.error('Error creating tournament:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tournaments/:urlId', async (req: Request, res: Response) => {
  try {
    const { urlId } = req.params;
    if (!urlId) {
      return res.status(400).json({ error: 'Tournament URL ID is required' });
    }
    
    const tournament = await DatabaseService.getTournamentByUrlId(urlId);
    
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

// Server-Sent Events for real-time leaderboard updates
router.get('/events/:tournamentId', (req: Request, res: Response) => {
  const { tournamentId } = req.params;
  
  if (!tournamentId) {
    return res.status(400).json({ error: 'Tournament ID is required' });
  }

  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Add connection to manager
  connectionManager.addConnection(tournamentId, res, 'leaderboard');

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', tournamentId })}\n\n`);

  // Keep connection alive with periodic pings
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
  }, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
});

// Test endpoint to manually trigger broadcasts (for debugging)
router.post('/test-broadcast/:tournamentId', async (req: Request, res: Response) => {
  try {
    const { tournamentId } = req.params;
    const { type, data } = req.body;

    if (!tournamentId) {
      return res.status(400).json({ error: 'Tournament ID is required' });
    }

    if (!type || !['leaderboard', 'chat'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "leaderboard" or "chat"' });
    }

    connectionManager.broadcastToTournament(tournamentId, data, type as 'leaderboard' | 'chat');
    
    return res.json({ 
      message: `Broadcast sent to ${connectionManager.getConnectionCount(tournamentId, type as 'leaderboard' | 'chat')} connections`,
      type,
      tournamentId
    });
  } catch (error) {
    console.error('Error in test broadcast:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 