import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface MigrationFile {
  filename: string;
  timestamp: string;
  fullPath: string;
}

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    const scriptsDir = path.join(__dirname);
    const migrationFiles: MigrationFile[] = [];
    
    // Find all migration files
    const files = fs.readdirSync(scriptsDir);
    const migrationPattern = /^migrate-\d{8}-\d{6}\.ts$/;
    
    for (const file of files) {
      if (migrationPattern.test(file)) {
        const timestamp = file.replace('migrate-', '').replace('.ts', '');
        migrationFiles.push({
          filename: file,
          timestamp,
          fullPath: path.join(scriptsDir, file)
        });
      }
    }
    
    // Sort by timestamp (oldest first)
    migrationFiles.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      return;
    }
    
    console.log(`Found ${migrationFiles.length} migration(s):`);
    migrationFiles.forEach(migration => {
      console.log(`  - ${migration.filename}`);
    });
    
    // Run each migration
    for (const migration of migrationFiles) {
      console.log(`\n🔄 Running migration: ${migration.filename}`);
      console.log('=' .repeat(50));
      
      try {
        // Execute the migration file
        execSync(`tsx ${migration.fullPath}`, { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        
        console.log(`✅ Migration ${migration.filename} completed successfully`);
      } catch (error) {
        console.error(`❌ Migration ${migration.filename} failed:`);
        console.error(error);
        process.exit(1);
      }
    }
    
    console.log('\n🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration runner completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration runner failed:', error);
      process.exit(1);
    });
}

export { runMigrations }; 