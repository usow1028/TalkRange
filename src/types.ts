/**
 * Intent labels to describe conversational posture.
 * 대화 의도 라벨 집합 정의.
 */
export type Intent =
  | 'GO_HOME'
  | 'STAY'
  | 'NEUTRAL'
  | 'TEST_BOUNDARY'
  | 'POWER_SIGNAL'
  | 'SMALL_TALK'
  | 'HELP_SEEK';

/**
 * Culture mode enumerations supported by the engine.
 * 엔진이 지원하는 문화 모드 정의.
 */
export type CultureMode = 'balanced' | 'pressure' | 'wlb';

/**
 * Inference input payload.
 * 추론에 필요한 입력 데이터 구조.
 */
export interface ConversationInput {
  role: string;
  timeContext: string;
  culture: CultureMode;
  history: string[];
  utterance: string;
  myProfile: Profile;
}

/**
 * User profile knobs for EV modeling.
 * 기대값 모델에 사용되는 프로필 정보.
 */
export interface Profile {
  relationship: 'peer' | 'manager' | 'subordinate' | 'client' | 'family' | 'partner';
  taskUrgency: number; // 0~1
  futureImportance: number; // 0~1
  tolerance: number; // 0~1 risk tolerance
}

/**
 * Posterior probability of an intent.
 * 의도 후행 확률 구조.
 */
export interface IntentProb {
  intent: Intent;
  probability: number;
}

/**
 * Range output from inference.
 * 추론 출력 구조체.
 */
export interface IntentRangeResult {
  range: IntentProb[];
  signals: string[];
  note: string;
}

/**
 * Action recommendation payload.
 * 행동 추천 결과 구조체.
 */
export interface ActionRec {
  action: string;
  ev: number;
  rationale: string;
  intents: IntentProb[];
  template: string;
}

/**
 * API request schema.
 * API 요청 본문 타입 정의.
 */
export interface RangeRequestBody {
  role: string;
  time_context: string;
  culture?: CultureMode;
  history?: string[];
  utterance: string;
  my_profile?: Partial<Profile>;
}

/**
 * API response schema.
 * API 응답 본문 타입 정의.
 */
export interface RangeResponse {
  intent_range: IntentProb[];
  recommended_actions: ActionRec[];
  explain: {
    signals: string[];
    note: string;
  };
}
