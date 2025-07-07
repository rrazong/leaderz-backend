const CHARS = '23478GLFZHARD';

export function generateTournamentKey(tournamentNumber: number): string {
  let result = '';
  const base = CHARS.length;
  
  while (tournamentNumber > 0) {
    result = CHARS[tournamentNumber % base] + result;
    tournamentNumber = Math.floor(tournamentNumber / base);
  }
  
  // Pad with leading '2' if needed to ensure minimum length
  while (result.length < 4) {
    result = '2' + result;
  }
  
  return result;
}

export function tournamentKeyToNumber(tournamentKey: string): number {
  let result = 0;
  const base = CHARS.length;
  
  for (let i = 0; i < tournamentKey.length; i++) {
    const char = tournamentKey[i];
    if (!char) continue;
    const charIndex = CHARS.indexOf(char);
    if (charIndex === -1) {
      throw new Error(`Invalid character in tournament key: ${char}`);
    }
    result = result * base + charIndex;
  }
  
  return result;
} 