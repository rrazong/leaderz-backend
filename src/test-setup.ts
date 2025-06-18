import { DatabaseService } from './services/databaseService';
import { parseScore } from './utils/scoreParser';

async function testSetup() {
  console.log('🧪 Testing Leaderz Backend Setup...\n');

  // Test score parsing
  console.log('📊 Testing Score Parsing:');
  const testCases = [
    { input: '4', par: 4, expected: 'par' },
    { input: 'birdie', par: 4, expected: 'birdie' },
    { input: 'eagle', par: 4, expected: 'eagle' },
    { input: '+1', par: 4, expected: 'bogey' },
    { input: 'hole in one', par: 4, expected: 'hole in one' }
  ];

  testCases.forEach(({ input, par, expected }) => {
    const result = parseScore(input, par);
    const status = result?.description === expected ? '✅' : '❌';
    console.log(`${status} "${input}" (par ${par}) -> ${result?.description || 'null'}`);
  });

  console.log('\n🏌️ Testing Database Connection:');
  try {
    // Try to get the default tournament
    const tournament = await DatabaseService.getTournamentByUrlId('SD2025');
    if (tournament) {
      console.log('✅ Database connection successful');
      console.log(`✅ Found tournament: ${tournament.name}`);
      
      // Test getting golf course holes
      const holes = await DatabaseService.getGolfCourseHoles(tournament.golf_course_id);
      console.log(`✅ Found ${holes.length} holes for the golf course`);
    } else {
      console.log('⚠️  Tournament not found - make sure to run the database initialization scripts');
    }
  } catch (error) {
    console.log('❌ Database connection failed:', error);
    console.log('   Make sure your environment variables are set correctly');
  }

  console.log('\n🎯 Setup test completed!');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSetup().catch(console.error);
}

export { testSetup }; 