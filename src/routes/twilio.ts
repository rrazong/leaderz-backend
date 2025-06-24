import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { WhatsAppHandler } from '../services/whatsappHandler';
import { TwilioWebhookBody } from '../types/index';

const router = Router();

// Twilio webhook for incoming WhatsApp messages
router.post('/webhook', [
  body('Body').notEmpty().withMessage('Message body is required'),
  body('From').notEmpty().withMessage('From number is required'),
  body('To').notEmpty().withMessage('To number is required'),
  body('MessageSid').notEmpty().withMessage('Message SID is required'),
  body('AccountSid').notEmpty().withMessage('Account SID is required')
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const webhookBody = req.body as TwilioWebhookBody;
    
    // Handle the message asynchronously
    WhatsAppHandler.handleMessage(webhookBody).catch(error => {
      console.error('Error in WhatsApp handler:', error);
    });

    // Respond immediately to Twilio
    return res.status(200).send();
  } catch (error) {
    console.error('Error in Twilio webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Route for handling team join requests (when new players send team names)
router.post('/join-team', [
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('teamName').notEmpty().withMessage('Team name is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phoneNumber, teamName } = req.body;
    
    await WhatsAppHandler.handleTeamJoin(phoneNumber, teamName);
    
    return res.status(200).json({ message: 'Team join request processed' });
  } catch (error) {
    console.error('Error joining team:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 