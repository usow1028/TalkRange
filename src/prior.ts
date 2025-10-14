import { CultureMode, Intent, IntentProb } from './types.js';

const intents: Intent[] = [
  'GO_HOME',
  'STAY',
  'NEUTRAL',
  'TEST_BOUNDARY',
  'POWER_SIGNAL',
  'SMALL_TALK',
  'HELP_SEEK',
];

/**
 * Create base weight vector for intents.
 * 의도별 기본 가중치 벡터를 생성.
 */
const cloneBase = (): Record<Intent, number> => ({
  GO_HOME: 1,
  STAY: 1,
  NEUTRAL: 1,
  TEST_BOUNDARY: 0.6,
  POWER_SIGNAL: 0.6,
  SMALL_TALK: 0.8,
  HELP_SEEK: 0.8,
});

/**
 * Adjust weights based on cultural posture.
 * 문화 모드에 따른 가중치 조정.
 */
const applyCulture = (weights: Record<Intent, number>, culture: CultureMode): void => {
  switch (culture) {
    case 'pressure':
      weights.STAY += 0.6;
      weights.POWER_SIGNAL += 0.4;
      weights.GO_HOME -= 0.2;
      break;
    case 'wlb':
      weights.GO_HOME += 0.8;
      weights.STAY -= 0.3;
      weights.NEUTRAL += 0.2;
      break;
    case 'balanced':
    default:
      weights.NEUTRAL += 0.2;
      break;
  }
};

/**
 * Apply role-specific tweaks for prior distribution.
 * 역할별로 사전 분포 보정.
 */
const applyRole = (weights: Record<Intent, number>, role: string): void => {
  const lower = role.toLowerCase();
  if (lower.includes('상사') || lower.includes('manager')) {
    weights.POWER_SIGNAL += 0.5;
    weights.STAY += 0.3;
  } else if (lower.includes('동료') || lower.includes('peer')) {
    weights.SMALL_TALK += 0.4;
    weights.HELP_SEEK += 0.2;
  } else if (lower.includes('가족') || lower.includes('family')) {
    weights.GO_HOME += 0.5;
    weights.SMALL_TALK += 0.3;
  } else if (lower.includes('고객') || lower.includes('client')) {
    weights.TEST_BOUNDARY += 0.4;
    weights.POWER_SIGNAL += 0.2;
  }
};

/**
 * Shift weights based on time context cues.
 * 시간 컨텍스트에 따른 가중치 변형.
 */
const applyTime = (weights: Record<Intent, number>, timeContext: string): void => {
  const lower = timeContext.toLowerCase();
  if (lower.includes('late') || lower.includes('퇴근') || lower.includes('밤')) {
    weights.GO_HOME += 0.6;
    weights.STAY -= 0.2;
  }
  if (lower.includes('deadline') || lower.includes('마감')) {
    weights.STAY += 0.5;
    weights.HELP_SEEK += 0.4;
  }
  if (lower.includes('lunch') || lower.includes('점심')) {
    weights.SMALL_TALK += 0.3;
  }
};

/**
 * Normalize weight vector into valid probability distribution.
 * 가중치 벡터를 확률 분포로 정규화.
 */
const normalize = (weights: Record<Intent, number>): IntentProb[] => {
  let total = 0;
  intents.forEach((intent) => {
    total += Math.max(weights[intent], 0.05);
  });
  return intents.map((intent) => ({
    intent,
    probability: Math.max(weights[intent], 0.05) / total,
  }));
};

/**
 * Compute the prior distribution for intents given contextual knobs.
 * 역할/시간/문화 기반 사전 분포 계산.
 */
export const prior = (
  role: string,
  timeContext: string,
  culture: CultureMode,
): IntentProb[] => {
  const weights = cloneBase();
  applyCulture(weights, culture);
  applyRole(weights, role);
  applyTime(weights, timeContext);
  return normalize(weights);
};
