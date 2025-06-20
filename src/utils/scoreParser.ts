import { ScoreInput } from '../types';

const numberWords: Record<string, number> = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
};

const relativeScores: Record<string, number> = {
  // 1 stroke
  'ace': 1, 'hole in one': 1, 'hole-in-one': 1,
  
  // 1 under par
  'birdie': -1, '🐦': -1, '🐧': -1, '🐤': -1, '🕊️🦆': -1, '🐥': -1, '🐣': -1, '🐦‍⬛': -1, '🦜': -1,
  
  // 2 under par
  'eagle': -2, '🦅': -2,
  
  // 3 under par
  'albatross': -3, 'albatros': -3,
  
  // par
  'par': 0, 'zero': 0,
  
  // 1 over par
  'bogey': 1,
  
  // 2 over par
  'double': 2, 'double bogey': 2, 'double-bogey': 2,
  
  // 3 over par
  'triple': 3, 'triple bogey': 3, 'triple-bogey': 3,
  
  // 4 over par
  'quad': 4, 'quadruple': 4, 'quadruple-bogey': 4,
  
  // 8 strokes
  'snowman': 8, '☃️': 8, '⛄️': 8, '⛇': 8, '☃': 8, '⛄︎': 8
};

export function parseScore(input: string, par: number): ScoreInput | null {
  const normalizedInput = input.toLowerCase().trim();
  
  // Check for exact integer (including 0)
  const integerMatch = normalizedInput.match(/^(\d+)$/);
  if (integerMatch && integerMatch[1]) {
    const strokes = parseInt(integerMatch[1], 10);
    if (strokes >= 0 && strokes <= 20) {
      return {
        raw: input,
        strokes,
        description: getScoreDescription(strokes, par)
      };
    }
  }
  
  // Check for number words
  if (numberWords[normalizedInput] !== undefined) {
    const strokes = numberWords[normalizedInput];
    return {
      raw: input,
      strokes,
      description: getScoreDescription(strokes, par)
    };
  }
  
  // Check for positive relative score (+2 means 2 over par)
  const positiveMatch = normalizedInput.match(/^\+(\d+)$/);
  if (positiveMatch && positiveMatch[1]) {
    const overPar = parseInt(positiveMatch[1], 10);
    const strokes = par + overPar;
    return {
      raw: input,
      strokes,
      description: getScoreDescription(strokes, par)
    };
  }
  
  // Check for negative relative score (-1 means 1 under par)
  const negativeMatch = normalizedInput.match(/^-(\d+)$/);
  if (negativeMatch && negativeMatch[1]) {
    const underPar = parseInt(negativeMatch[1], 10);
    const strokes = par - underPar;
    return {
      raw: input,
      strokes: Math.max(1, strokes), // Minimum 1 stroke
      description: getScoreDescription(Math.max(1, strokes), par)
    };
  }
  
  // Check for relative score strings
  if (relativeScores[normalizedInput] !== undefined) {
    const relativeScore = relativeScores[normalizedInput];
    let strokes: number;
    
    if (relativeScore >= 0) {
      // Absolute strokes (like ace=1, snowman=8)
      strokes = relativeScore;
    } else {
      // Relative to par (like birdie=-1, eagle=-2)
      strokes = par + relativeScore;
    }
    
    return {
      raw: input,
      strokes: Math.max(1, strokes), // Minimum 1 stroke
      description: getScoreDescription(Math.max(1, strokes), par)
    };
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