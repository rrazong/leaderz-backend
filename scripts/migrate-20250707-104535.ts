import dotenv from 'dotenv';
import pool from '../src/database/pgPool';
import { generateTournamentKey } from '../src/utils/tournamentKeyGenerator';

// Load environment variables
dotenv.config();

async function migrateTournamentKeys() {
  try {
    console.log('Starting tournament key migration...');
    
    // First, check if tournament_key column exists, if not create it
    console.log('Checking if tournament_key column exists...');
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tournaments' AND column_name = 'tournament_key'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('Creating tournament_key column...');
      await pool.query(`
        ALTER TABLE tournaments 
        ADD COLUMN tournament_key VARCHAR(20) UNIQUE
      `);
      console.log('✅ tournament_key column created successfully');
    } else {
      console.log('✅ tournament_key column already exists');
    }
    
    // Get all tournaments without tournament_key
    const { rows: tournaments } = await pool.query(
      'SELECT id, tournament_number FROM tournaments WHERE tournament_key IS NULL'
    );
    
    console.log(`Found ${tournaments.length} tournaments without tournament keys`);
    
    if (tournaments.length === 0) {
      console.log('No tournaments need migration. Exiting.');
      return;
    }
    
    // Update each tournament with its generated key
    for (const tournament of tournaments) {
      const tournamentKey = generateTournamentKey(tournament.tournament_number);
      
      await pool.query(
        'UPDATE tournaments SET tournament_key = $1 WHERE id = $2',
        [tournamentKey, tournament.id]
      );
      
      console.log(`Updated tournament ${tournament.tournament_number} with key: ${tournamentKey}`);
    }
    
    console.log('Tournament key migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateTournamentKeys()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateTournamentKeys }; 