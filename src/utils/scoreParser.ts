import { ScoreInput } from '../types/index';

export function parseScore(input: string, par: number): ScoreInput | null {
  const normalizedInput = input.toLowerCase().trim();
  
  // Check for exact integer
  const integerMatch = normalizedInput.match(/^(\d+)$/);
  if (integerMatch && integerMatch[1]) {
    const strokes = parseInt(integerMatch[1], 10);
    if (strokes >= 1) {
      return {
        raw: input,
        strokes,
        description: getScoreDescription(strokes, par)
      };
    }
  }
  
  return null;
}

function getScoreDescription(strokes: number, par: number): string {
  const difference = strokes - par;
  
  if (strokes === 1) return 'hole in one';
  if (difference === -3) return 'albatross';
  if (difference === -2) return 'eagle';
  if (difference === -1) return 'birdie';
  if (difference === 0) return 'par';
  if (difference === 1) return 'bogey';
  if (difference === 2) return 'double bogey';
  if (difference === 3) return 'triple bogey';
  if (difference === 4) return 'quadruple bogey';
  if (difference > 4) return `${difference} over par`;
  
  return `${strokes} strokes`;
} 