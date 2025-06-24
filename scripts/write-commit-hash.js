const { execSync } = require('child_process');
const { writeFileSync } = require('fs');
const path = require('path');

let commit = process.env.VERCEL_GIT_COMMIT_SHA;

if (!commit) {
  try {
    commit = execSync('git rev-parse HEAD').toString().trim();
  } catch (err) {
    commit = null;
  }
}

try {
  writeFileSync(path.join(__dirname, '../commit.json'), JSON.stringify({ commit }, null, 2));
  console.log('Wrote commit hash:', commit);
} catch (err) {
  console.error('Failed to write commit hash:', err);
  process.exit(1);
} 