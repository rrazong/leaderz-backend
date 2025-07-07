# Database Migrations

This directory contains database migration scripts for the Leaderz backend.

## Migration System

Migrations are executed in chronological order based on their timestamp filenames.

### Migration File Naming Convention

Migration files must follow this format:
```
migrate-YYYYMMDD-HHMMSS.ts
```

Examples:
- `migrate-20250707-104535.ts` - Tournament keys migration
- `migrate-20250708-143022.ts` - Future migration

### Running Migrations

To run all pending migrations:

```bash
npm run db:migrate
```

This will:
1. Find all migration files in the `scripts/` directory
2. Sort them by timestamp (oldest first)
3. Execute each migration in order
4. Stop on first failure

### Creating New Migrations

1. Create a new file with the current timestamp:
   ```bash
   # Get current timestamp
   date +"%Y%m%d-%H%M%S"
   
   # Create migration file
   touch scripts/migrate-YYYYMMDD-HHMMSS.ts
   ```

2. Implement the migration logic:
   ```typescript
   import pool from '../src/database/pgPool';
   
   async function migrateExample() {
     try {
       console.log('Starting example migration...');
       
       // Your migration logic here
       await pool.query('ALTER TABLE example ADD COLUMN new_field VARCHAR(255)');
       
       console.log('Example migration completed successfully!');
     } catch (error) {
       console.error('Error during migration:', error);
       throw error;
     } finally {
       await pool.end();
     }
   }
   
   // Run migration if this file is executed directly
   if (require.main === module) {
     migrateExample()
       .then(() => {
         console.log('Migration completed');
         process.exit(0);
       })
       .catch((error) => {
         console.error('Migration failed:', error);
         process.exit(1);
       });
   }
   
   export { migrateExample };
   ```

### Migration Best Practices

1. **Idempotent**: Migrations should be safe to run multiple times
2. **Atomic**: Each migration should be a single logical change
3. **Reversible**: Consider how to rollback changes if needed
4. **Tested**: Test migrations on a copy of production data first
5. **Documented**: Include clear comments explaining what the migration does

### Current Migrations

- `migrate-20250707-104535.ts` - Adds tournament keys to existing tournaments

### Troubleshooting

If a migration fails:
1. Check the error message for details
2. Fix the issue in the migration file
3. Re-run `npm run db:migrate`

The migration runner will continue from where it left off. 