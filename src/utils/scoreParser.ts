import { ScoreInput } from '../types';

const scoreMap: Record<string, number> = {
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'hole in one': 1, 'ace': 1,
  'albatross': -3,
  'eagle': -2,
  'birdie': -1,
  'par': 0, '0': 0,
  'bogey': 1, '+1': 1,
  'double bogey': 2, '+2': 2, 'double': 2,
  'triple bogey': 3, '+3': 3, 'triple': 3,
  'quad': 4, '+4': 4, 'quadruple': 4, 'quadruple bogey': 4,
  'double par': 8, 'max': 8
};

export function parseScore(input: string, par: number): ScoreInput | null {
  const normalizedInput = input.toLowerCase().trim();
  
  // Check for exact matches
  if (scoreMap[normalizedInput] !== undefined) {
    const relativeScore = scoreMap[normalizedInput];
    const strokes = relativeScore >= 0 ? par + relativeScore : par + relativeScore;
    
    return {
      raw: input,
      strokes: Math.max(1, strokes), // Minimum 1 stroke
      description: getScoreDescription(strokes, par)
    };
  }
  
  // Check for "bogey on X" format
  const bogeyMatch = normalizedInput.match(/^(bogey|double bogey|triple bogey|quadruple bogey)\s+on\s+(\d+)$/);
  if (bogeyMatch) {
    const scoreType = bogeyMatch[1];
    const holeNumber = bogeyMatch[2];
    if (scoreType && holeNumber && scoreType in scoreMap) {
      const relativeScore = scoreMap[scoreType];
      if (relativeScore !== undefined) {
        const strokes = par + relativeScore;
        
        return {
          raw: input,
          strokes: Math.max(1, strokes),
          description: `${scoreType} on hole ${holeNumber}`
        };
      }
    }
  }
  
  // Check for numeric input
  const numericMatch = normalizedInput.match(/^(\d+)$/);
  if (numericMatch) {
    const matchValue = numericMatch[1];
    if (matchValue) {
      const strokes = parseInt(matchValue, 10);
      if (strokes >= 1 && strokes <= 20) {
        return {
          raw: input,
          strokes,
          description: getScoreDescription(strokes, par)
        };
      }
    }
  }
  
  return null;
}

function getScoreDescription(strokes: number, par: number): string {
  const difference = strokes - par;
  
  if (strokes === 1 && par > 1) return 'hole in one';
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