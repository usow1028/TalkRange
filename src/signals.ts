import { createRequire } from 'module';
import { Intent } from './types.js';

const requireJson = createRequire(import.meta.url);

const likelihoodTable = requireJson('../data/likelihood.korean.json') as Record<
  string,
  Record<Intent, number>
>;

const DEFAULT_SMOOTHING = 0.15;

const questionRegex = /\?|나요|까\?/;
const collectiveRegex = /(다들|모두|우리\s*|전체)/;
const immediacyRegex = /(지금|바로|당장|오늘 안)/;
const softenerRegex = /(가능하면|좀|아무래도|혹시|괜찮으시다면)/;
const authorityRegex = /(당연히|필수|규정|원칙|반드시)/;
const gratitudeRegex = /(감사|고맙|고마워|덕분)/;
const apologyRegex = /(미안|죄송|송구)/;
const suggestionRegex = /(해볼까|어떨까요|하자|합시다|어때)/;
const boundaryRegex = /(무조건|해야만|끝까지|버티)/;
const careRegex = /(괜찮|걱정|살펴|도와줄게)/;

const KNOWN_SIGNALS = new Set(Object.keys(likelihoodTable));

/**
 * Extract conversational signals from a Korean utterance via rule patterns.
 * 규칙 기반으로 발화에서 시그널 목록을 추출한다.
 */
export const extractSignals = (utterance: string): string[] => {
  const signals = new Set<string>();
  const lower = utterance.toLowerCase();

  if (questionRegex.test(utterance)) {
    signals.add('question');
  }
  if (collectiveRegex.test(utterance)) {
    signals.add('collective_subject');
  }
  if (immediacyRegex.test(utterance)) {
    signals.add('immediacy');
  }
  if (softenerRegex.test(utterance)) {
    signals.add('softener');
  }
  if (authorityRegex.test(utterance)) {
    signals.add('authority');
  }
  if (gratitudeRegex.test(utterance)) {
    signals.add('gratitude');
  }
  if (apologyRegex.test(utterance)) {
    signals.add('apology');
  }
  if (suggestionRegex.test(utterance)) {
    signals.add('suggestion');
  }
  if (boundaryRegex.test(utterance)) {
    signals.add('boundary_push');
  }
  if (careRegex.test(utterance)) {
    signals.add('care');
  }
  if (lower.trim().length === 0) {
    signals.add('silence');
  }

  return Array.from(signals);
};

/**
 * Retrieve likelihood distribution for a given signal with smoothing fallback.
 * 시그널별 의도 우도 분포를 스무딩하여 반환.
 */
export const likelihoodForSignal = (
  signal: string,
): Record<Intent, number> => {
  if (KNOWN_SIGNALS.has(signal)) {
    return likelihoodTable[signal as keyof typeof likelihoodTable] as Record<Intent, number>;
  }
  const intents = Object.keys(likelihoodTable.question) as Intent[];
  const uniform = 1 / intents.length;
  const smoothed: Record<Intent, number> = intents.reduce((acc, intent) => {
    acc[intent] = DEFAULT_SMOOTHING * uniform + (1 - DEFAULT_SMOOTHING) * uniform;
    return acc;
  }, {} as Record<Intent, number>);
  return smoothed;
};
