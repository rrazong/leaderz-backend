import { Response } from 'express';

interface SSEClient {
  res: Response;
  tournamentNumber: string;
  type: 'leaderboard' | 'chat' | 'unified';
}

class SSEManager {
  private clients: SSEClient[] = [];

  addClient(res: Response, tournamentNumber: string, type: 'leaderboard' | 'chat' | 'unified') {
    const client: SSEClient = { res, tournamentNumber, type };
    this.clients.push(client);
    res.on('close', () => {
      this.removeClient(res);
    });
  }

  removeClient(res: Response) {
    this.clients = this.clients.filter(client => client.res !== res);
  }

  broadcast(tournamentNumber: string, type: 'leaderboard' | 'chat', data: any) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach(client => {
      if (client.tournamentNumber === tournamentNumber && 
          (client.type === type || client.type === 'unified')) {
        client.res.write(payload);
      }
    });
  }
}

export const sseManager = new SSEManager(); 