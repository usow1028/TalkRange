import { prior } from './prior.js';
import { extractSignals, likelihoodForSignal } from './signals.js';
import { CultureMode, Intent, IntentProb, IntentRangeResult } from './types.js';

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
 * Convert probability to safe log-space value.
 * 확률 값을 로그 공간으로 안정적으로 변환.
 */
const asLog = (value: number): number => Math.log(Math.max(value, 1e-9));

/**
 * Convert arbitrary scores into probability distribution via softmax.
 * Softmax를 통해 점수를 확률 분포로 변환.
 */
const softmax = (scores: Record<Intent, number>): IntentProb[] => {
  const maxScore = Math.max(...intents.map((intent) => scores[intent]));
  const expScores = intents.map((intent) => Math.exp(scores[intent] - maxScore));
  const total = expScores.reduce((acc, value) => acc + value, 0);
  return intents.map((intent, index) => ({
    intent,
    probability: expScores[index] / total,
  }));
};

/**
 * Derive small log-boosts from conversation history cues.
 * 이전 대화 히스토리 신호로 로그 보정을 계산.
 */
const normaliseHistoryBoost = (history: string[]): Record<Intent, number> => {
  const boost: Record<Intent, number> = intents.reduce((acc, intent) => {
    acc[intent] = 0;
    return acc;
  }, {} as Record<Intent, number>);

  const joined = history.join(' ').toLowerCase();
  if (joined.includes('야근') || joined.includes('late')) {
    boost.STAY += 0.1;
  }
  if (joined.includes('미안') || joined.includes('죄송')) {
    boost.GO_HOME += 0.1;
    boost.HELP_SEEK += 0.05;
  }
  if (joined.includes('도와')) {
    boost.HELP_SEEK += 0.15;
  }
  return boost;
};

/**
 * Combine prior distribution with signal likelihoods to produce posterior range.
 * 사전 분포와 시그널 우도를 결합하여 의도 분포를 계산.
 */
export const infer = (
  role: string,
  timeContext: string,
  culture: CultureMode,
  utterance: string,
  history: string[],
): IntentRangeResult => {
  const priorDist = prior(role, timeContext, culture);
  const signals = extractSignals(utterance).concat(history.flatMap((item) => extractSignals(item)));
  const uniqueSignals = Array.from(new Set(signals));

  const historyBoost = normaliseHistoryBoost(history);

  const logScores: Record<Intent, number> = priorDist.reduce((acc, item) => {
    acc[item.intent] = asLog(item.probability) + historyBoost[item.intent];
    return acc;
  }, {} as Record<Intent, number>);

  uniqueSignals.forEach((signal) => {
    const likelihood = likelihoodForSignal(signal);
    intents.forEach((intent) => {
      logScores[intent] += asLog(likelihood[intent] ?? 1e-6);
    });
  });

  const range = softmax(logScores).sort((a, b) => b.probability - a.probability);
  const note = `signals=${uniqueSignals.length}, history=${history.length}`;

  return {
    range,
    signals: uniqueSignals,
    note,
  };
};
