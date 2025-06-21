import { Response } from 'express';

interface SSEConnection {
  tournamentId: string;
  response: Response;
  type: 'leaderboard' | 'chat';
}

class ConnectionManager {
  private connections: SSEConnection[] = [];

  addConnection(tournamentId: string, response: Response, type: 'leaderboard' | 'chat') {
    const connection: SSEConnection = { tournamentId, response, type };
    this.connections.push(connection);

    // Clean up on disconnect
    response.on('close', () => {
      this.removeConnection(connection);
    });

    return connection;
  }

  removeConnection(connection: SSEConnection) {
    const index = this.connections.findIndex(
      conn => conn.response === connection.response && conn.tournamentId === connection.tournamentId
    );
    if (index !== -1) {
      this.connections.splice(index, 1);
    }
  }

  broadcastToTournament(tournamentId: string, data: any, type: 'leaderboard' | 'chat') {
    const tournamentConnections = this.connections.filter(
      conn => conn.tournamentId === tournamentId && conn.type === type
    );

    console.log(`Broadcasting ${type} update to ${tournamentConnections.length} connections for tournament ${tournamentId}`);

    tournamentConnections.forEach(connection => {
      try {
        connection.response.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error) {
        console.error('Error broadcasting to connection:', error);
        // Remove dead connections
        this.removeConnection(connection);
      }
    });
  }

  getConnectionCount(tournamentId: string, type?: 'leaderboard' | 'chat') {
    return this.connections.filter(
      conn => conn.tournamentId === tournamentId && (!type || conn.type === type)
    ).length;
  }
}

export const connectionManager = new ConnectionManager(); 