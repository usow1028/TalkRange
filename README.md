# TalkRange

TalkRange는 포커 메타포를 활용해 한국어 대화에서 의도 분포와 기대값(EV) 기반 행동 추천을 계산하는 TypeScript 라이브러리 겸 REST API입니다. 베이지안 추론으로 시그널을 반영하고, 사용자 프로필/문화 설정을 바탕으로 액션을 제안합니다.

## 구성 요소

- **Bayesian Core**: `src/prior.ts`, `src/signals.ts`, `src/inference.ts`
- **EV Planner**: `src/ev.ts`, `src/actions.ts`
- **REST API**: Express 기반 `src/api.ts`, `src/index.ts`
- **데이터**: `data/likelihood.korean.json`, `data/scenarios.example.json`
- **테스트**: Jest + Supertest (`tests/*.spec.ts`)

## 설치 및 실행

```bash
npm install
npm run dev        # 개발 서버 (http://localhost:3333)
npm run build      # 타입스크립트 컴파일
npm start          # dist/index.js 실행 (빌드 후)
npm test           # Jest 테스트 (스냅샷 포함)
npm run lint       # ESLint 검사
npm run format     # Prettier 정렬
```

## REST API

### POST /range

요청 본문

```json
{
  "role": "상사-야근",
  "time_context": "금요일 야근 직전",
  "culture": "pressure",
  "history": ["이번 주에도 야근이 연속"],
  "utterance": "다들 오늘 끝내고 가야 하는 거 알죠?",
  "my_profile": {
    "relationship": "peer",
    "taskUrgency": 0.7,
    "futureImportance": 0.5,
    "tolerance": 0.4
  }
}
```

응답 예시

```json
{
  "intent_range": [
    { "intent": "STAY", "probability": 0.41 },
    { "intent": "POWER_SIGNAL", "probability": 0.19 }
  ],
  "recommended_actions": [
    {
      "action": "STAY_FULL",
      "ev": 0.622,
      "rationale": "상위 의도(STAY:41%, POWER_SIGNAL:19%)와 헌신/책임감 톤 가정.",
      "template": "오늘은 약속하신 마감까지 책임지고 지원드리겠습니다.",
      "intents": [ ... ]
    }
  ],
  "explain": {
    "signals": ["collective_subject", "immediacy", "authority"],
    "note": "signals=3, history=1"
  }
}
```

### GET /health

```json
{ "status": "ok" }
```

## 환경 변수 설정 (`src/config.ts` 참고)

| 변수 | 설명 | 기본값 |
| --- | --- | --- |
| `TALK_RANGE_CULTURE` | 기본 문화 모드 (`balanced`/`pressure`/`wlb`) | `balanced` |
| `TALK_RANGE_WEIGHT_TIME` | EV 가중치 - 시간 요소 | `0.3` |
| `TALK_RANGE_WEIGHT_REL` | EV 가중치 - 관계 요소 | `0.3` |
| `TALK_RANGE_WEIGHT_TASK` | EV 가중치 - 업무 요소 | `0.2` |
| `TALK_RANGE_WEIGHT_FUTURE` | EV 가중치 - 장기 요소 | `0.2` |
| `TALK_RANGE_PROFILE_TASK` | 기본 프로필 - 긴급도 | `0.4` |
| `TALK_RANGE_PROFILE_FUTURE` | 기본 프로필 - 미래 중요도 | `0.6` |
| `TALK_RANGE_PROFILE_TOLERANCE` | 기본 프로필 - 리스크 허용 | `0.5` |
| `TALK_RANGE_MODE` | 전략 모드 (`gto` or `exploit`) | `gto` |

## GTO 모드 vs Exploit 모드

- **GTO (Game Theory Optimal)**: 사전 분포에 균일 스무딩을 섞어 안정적인 대응. 불확실성이 큰 초기 대응, 균형 잡힌 추천.
- **Exploit**: 관측된 의도를 그대로 활용. 상대 패턴이 뚜렷할 때 빠르게 편향된 액션을 추천.

`TALK_RANGE_MODE=exploit` 으로 전환하여 실험할 수 있습니다.

## 데이터 튜닝 가이드

### likelihood.korean.json

- 키: 시그널 이름, 값: 의도별 우도(합계=1)
- 새로운 시그널 추가 시 `src/signals.ts` 패턴과 JSON에 모두 등록
- 확률 분포는 `sum=1` 유지. 미상 시그널은 자동으로 균등 스무딩 처리

### EV 가중치/프로필 튜닝

- `src/ev.ts` 내 `ACTION_DEFINITIONS` 에서 액션별 의도 포커스/슬로프 조정
- 프로필 파라미터(긴급도/미래 중요도/허용도)는 0~1 범위 추천
- 관계별 가중치는 `relationshipWeight`에서 커스터마이즈

### 시나리오 추가/검증

1. `data/scenarios.example.json`에 새 오브젝트 추가 (`id`는 고유 문자열)
2. `npm test`로 API 스냅샷 확인 (변경 필요 시 `npm test -- -u`)
3. 커스터마이즈된 시나리오는 테스트/문서에 반영

## 개발 팁

- 모든 함수는 JSDoc 주석으로 문맥 설명 및 한/영 병기
- `npm run lint`와 `npm run format`으로 CI 친화적인 포맷 유지
- 테스트는 `CI=true npm test` 로 CI 모드 실행 가능 (스냅샷은 이미 저장됨)

## cURL 예시

```bash
curl -X POST http://localhost:3333/range \
  -H 'Content-Type: application/json' \
  -d '{
    "role": "동료-주말약속",
    "time_context": "토요일 오전",
    "culture": "wlb",
    "history": ["고객 피드백 대기"],
    "utterance": "이번 주말에 다같이 나와서 좀 정리하면 어때?",
    "my_profile": {"relationship": "peer", "taskUrgency": 0.5, "futureImportance": 0.6, "tolerance": 0.6}
  }'
```

## Next.js 간단 뷰 연결 힌트

1. `app/api/range/route.ts`(Next.js 13+)에서 `fetch('http://localhost:3333/range', { method: 'POST', body: JSON.stringify(...) })` 호출
2. SWR/React Query로 응답 캐싱 후 `intent_range` 상위 N개와 `recommended_actions`를 카드 UI로 렌더
3. 환경 변수로 TalkRange API URL을 주입 (`process.env.NEXT_PUBLIC_TALK_RANGE_URL`)
4. 서버 액션을 활용하면 Next.js 서버에서 직접 호출하여 클라이언트에 최적화된 데이터를 전달 가능

