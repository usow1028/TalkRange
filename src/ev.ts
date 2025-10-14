import { renderActionTemplate } from './actions.js';
import { DEFAULT_CULTURE, STRATEGY_MODE, WEIGHT_CONFIG } from './config.js';
import { ActionRec, CultureMode, Intent, IntentProb, Profile } from './types.js';

interface ActionDefinition {
  action: string;
  label: string;
  intentFocus: Partial<Record<Intent, number>>;
  timeSlope: number;
  relationshipSlope: number;
  taskSlope: number;
  futureSlope: number;
  tone: string;
}

const ACTION_DEFINITIONS: ActionDefinition[] = [
  {
    action: 'HARD_GO',
    label: '단호하게 퇴근 선언',
    intentFocus: { GO_HOME: 1, STAY: -0.4, POWER_SIGNAL: -0.2 },
    timeSlope: -0.2,
    relationshipSlope: -0.1,
    taskSlope: -0.3,
    futureSlope: 0.2,
    tone: '단호/명확',
  },
  {
    action: 'SOFT_GO',
    label: '완곡한 철수 제안',
    intentFocus: { GO_HOME: 0.8, SMALL_TALK: 0.2, HELP_SEEK: 0.3 },
    timeSlope: -0.1,
    relationshipSlope: 0.2,
    taskSlope: -0.2,
    futureSlope: 0.3,
    tone: '부드럽고 협조적',
  },
  {
    action: 'STAY_SHORT',
    label: '짧게 머무르기',
    intentFocus: { STAY: 0.6, HELP_SEEK: 0.2 },
    timeSlope: 0.2,
    relationshipSlope: 0.1,
    taskSlope: 0.3,
    futureSlope: 0.1,
    tone: '타협/실무적',
  },
  {
    action: 'STAY_FULL',
    label: '끝까지 남기',
    intentFocus: { STAY: 0.9, POWER_SIGNAL: 0.2 },
    timeSlope: 0.4,
    relationshipSlope: 0.3,
    taskSlope: 0.4,
    futureSlope: 0.2,
    tone: '헌신/책임감',
  },
  {
    action: 'CLARIFY',
    label: '의도 확인 질문',
    intentFocus: { NEUTRAL: 0.5, TEST_BOUNDARY: 0.4, HELP_SEEK: 0.4 },
    timeSlope: 0.1,
    relationshipSlope: 0.2,
    taskSlope: 0.1,
    futureSlope: 0.3,
    tone: '탐색/메타대화',
  },
  {
    action: 'CARE_SUPPORT',
    label: '정서적 지지 제공',
    intentFocus: { SMALL_TALK: 0.4, HELP_SEEK: 0.5, NEUTRAL: 0.2 },
    timeSlope: -0.1,
    relationshipSlope: 0.4,
    taskSlope: -0.1,
    futureSlope: 0.4,
    tone: '공감/케어',
  },
  {
    action: 'HELP_BRIDGE',
    label: '도움 연결 요청',
    intentFocus: { HELP_SEEK: 0.7, TEST_BOUNDARY: 0.2, SMALL_TALK: 0.1 },
    timeSlope: 0.2,
    relationshipSlope: 0.3,
    taskSlope: 0.2,
    futureSlope: 0.4,
    tone: '학습/협력',
  },
];

const relationshipWeight: Record<Profile['relationship'], number> = {
  peer: 0.3,
  manager: 0.6,
  subordinate: 0.2,
  client: 0.7,
  family: 0.4,
  partner: 0.5,
};

/**
 * Provide culture-specific EV adjustments per action.
 * 문화 모드별 행동 EV 보정치를 계산.
 */
const cultureBias = (culture: CultureMode, action: string): number => {
  switch (culture) {
    case 'pressure':
      if (action === 'STAY_FULL') return 0.25;
      if (action === 'HARD_GO') return -0.2;
      break;
    case 'wlb':
      if (action.startsWith('STAY')) return -0.2;
      if (action.includes('GO')) return 0.25;
      break;
    default:
      if (action === 'CLARIFY') return 0.1;
  }
  return 0;
};

/**
 * Build a concise human-readable summary of leading intents.
 * 상위 의도를 사람이 읽기 쉬운 요약으로 변환.
 */
const describeTopIntents = (intentsRange: IntentProb[]): string => {
  if (intentsRange.length === 0) {
    return 'N/A';
  }
  const top = intentsRange.slice(0, 2).map((item) => `${item.intent}:${(item.probability * 100).toFixed(0)}%`);
  return top.join(', ');
};

/**
 * Blend posterior with uniform prior when in GTO mode.
 * GTO 모드에서 후행 분포와 균일 분포를 혼합.
 */
const blendedRange = (range: IntentProb[]): IntentProb[] => {
  if (STRATEGY_MODE === 'exploit') {
    return range;
  }
  const uniform = 1 / range.length;
  return range.map((item) => ({
    intent: item.intent,
    probability: 0.7 * item.probability + 0.3 * uniform,
  }));
};

/**
 * Produce ranked action recommendations leveraging EV heuristics.
 * EV 휴리스틱을 활용하여 행동 추천을 정렬한다.
 */
export const ev = (
  range: IntentProb[],
  profile: Profile,
  culture: CultureMode = DEFAULT_CULTURE,
  role: string,
): ActionRec[] => {
  const adjustedRange = blendedRange(range);
  const topIntentMap = adjustedRange.reduce((acc, item) => {
    acc[item.intent] = item.probability;
    return acc;
  }, {} as Record<Intent, number>);

  const actions = ACTION_DEFINITIONS.map((definition) => {
    const intentScore = Object.entries(definition.intentFocus).reduce((acc, [intent, weight]) => {
      return acc + (topIntentMap[intent as Intent] ?? 0) * weight;
    }, 0);

    const evScore =
      intentScore +
      WEIGHT_CONFIG.time * definition.timeSlope * profile.taskUrgency +
      WEIGHT_CONFIG.relationship * definition.relationshipSlope * relationshipWeight[profile.relationship] +
      WEIGHT_CONFIG.task * definition.taskSlope * profile.taskUrgency +
      WEIGHT_CONFIG.future * definition.futureSlope * profile.futureImportance +
      profile.tolerance * 0.1 +
      cultureBias(culture, definition.action);

    const rationale = `상위 의도(${describeTopIntents(range)})와 ${definition.tone} 톤 가정.`;

    return {
      action: definition.action,
      ev: Number(evScore.toFixed(3)),
      rationale,
      intents: range.slice(0, 3),
      template: renderActionTemplate(role, definition.action, culture),
    } satisfies ActionRec;
  });

  return actions.sort((a, b) => b.ev - a.ev);
};
