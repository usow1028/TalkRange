import dotenv from 'dotenv';
import { CultureMode, Profile } from './types.js';

dotenv.config();

/**
 * Weight configuration for EV scoring.
 * 기대값 계산을 위한 가중치 설정.
 */
export interface WeightConfig {
  time: number;
  relationship: number;
  task: number;
  future: number;
}

const cultureEnv = process.env.TALK_RANGE_CULTURE as CultureMode | undefined;

/**
 * Default culture selection derived from environment or fallback.
 * 환경 변수 기반 기본 문화 모드.
 */
export const DEFAULT_CULTURE: CultureMode = cultureEnv ?? 'balanced';

/**
 * Safely parse numeric weights from environment values.
 * 환경 변수 문자열을 수치로 안전하게 변환.
 */
const parseWeight = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return fallback;
};

/**
 * EV weight configuration resolved from ENV with sensible defaults.
 * 환경 변수 기반 EV 가중치 설정.
 */
export const WEIGHT_CONFIG: WeightConfig = {
  time: parseWeight(process.env.TALK_RANGE_WEIGHT_TIME, 0.3),
  relationship: parseWeight(process.env.TALK_RANGE_WEIGHT_REL, 0.3),
  task: parseWeight(process.env.TALK_RANGE_WEIGHT_TASK, 0.2),
  future: parseWeight(process.env.TALK_RANGE_WEIGHT_FUTURE, 0.2),
};

/**
 * Default profile baseline used when my_profile is omitted.
 * 프로필 미제공 시 사용할 기본값.
 */
export const DEFAULT_PROFILE: Profile = {
  relationship: 'peer',
  taskUrgency: parseWeight(process.env.TALK_RANGE_PROFILE_TASK, 0.4),
  futureImportance: parseWeight(process.env.TALK_RANGE_PROFILE_FUTURE, 0.6),
  tolerance: parseWeight(process.env.TALK_RANGE_PROFILE_TOLERANCE, 0.5),
};

/**
 * Strategy toggle: GTO vs Exploit mode selection via ENV.
 * 전략 모드 토글 (GTO/Exploit) 환경 변수 처리.
 */
export const STRATEGY_MODE: 'gto' | 'exploit' =
  (process.env.TALK_RANGE_MODE as 'gto' | 'exploit' | undefined) ?? 'gto';
