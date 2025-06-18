import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER || '';

if (!accountSid || !authToken || !phoneNumber) {
  throw new Error('Missing Twilio configuration. Please check your environment variables.');
}

const client = twilio(accountSid, authToken);

export class TwilioService {
  static async sendMessage(to: string, message: string): Promise<void> {
    try {
      await client.messages.create({
        body: message,
        from: phoneNumber,
        to: `whatsapp:${to}`
      });
    } catch (error) {
      console.error('Error sending Twilio message:', error);
      throw new Error('Failed to send WhatsApp message');
    }
  }

  static formatPhoneNumber(phoneNumber: string): string {
    // Remove whatsapp: prefix if present
    return phoneNumber.replace('whatsapp:', '');
  }
} 