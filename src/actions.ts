import { CultureMode } from './types.js';

interface TemplateEntry {
  roles: string[];
  action: string;
  text: string;
}

const TEMPLATES: TemplateEntry[] = [
  {
    roles: ['상사', 'manager'],
    action: 'HARD_GO',
    text: '팀장님, 오늘은 약속드린 시간까지 집중했으니 마저 정리하고 먼저 퇴근하겠습니다.',
  },
  {
    roles: ['상사', 'manager'],
    action: 'SOFT_GO',
    text: '팀장님, 지금 마무리된 부분 공유드리고 남은 항목은 내일 아침에 정리해도 괜찮을까요?',
  },
  {
    roles: ['상사', 'manager'],
    action: 'CLARIFY',
    text: '이번 요청의 핵심 기대치가 무엇인지 다시 한번 정리해 주실 수 있을까요?',
  },
  {
    roles: ['동료', 'peer'],
    action: 'STAY_SHORT',
    text: '지금 급한 부분만 같이 맞추고 30분 뒤에는 각자 정리하는 걸로 할까?',
  },
  {
    roles: ['동료', 'peer'],
    action: 'SOFT_GO',
    text: '오늘은 여기까지 하고 내일 오전에 이어서 하면 어떨까?',
  },
  {
    roles: ['고객', 'client'],
    action: 'CLARIFY',
    text: '말씀 주신 범위를 다시 확인하고 싶은데, 가장 우선순위가 무엇인지 알려주실 수 있을까요?',
  },
  {
    roles: ['고객', 'client'],
    action: 'STAY_FULL',
    text: '오늘은 약속하신 마감까지 책임지고 지원드리겠습니다.',
  },
  {
    roles: ['가족', 'family'],
    action: 'SOFT_GO',
    text: '오늘은 조금 쉬고 싶어서 그런데, 내일 아침에 다시 이야기해도 될까?',
  },
  {
    roles: ['파트너', 'partner'],
    action: 'CARE_SUPPORT',
    text: '지금 힘든 것 같아 보여서, 내가 도울 수 있는 게 있으면 말해줘.',
  },
  {
    roles: ['벤더', 'vendor'],
    action: 'STAY_SHORT',
    text: '납기 조정을 위해 지금 핵심 이슈만 먼저 해결하고 세부 사항은 다음 미팅에서 조율하죠.',
  },
  {
    roles: ['교수', 'professor'],
    action: 'HELP_BRIDGE',
    text: '마감 전에 필요한 기준을 정확히 이해하고 싶습니다. 중요한 포인트를 짚어주실 수 있을까요?',
  },
];

/**
 * Append cultural nuance markers to the template.
 * 문화 모드에 맞는 뉘앙스를 템플릿에 추가.
 */
const culturePolish = (culture: CultureMode, template: string): string => {
  if (culture === 'pressure') {
    return `${template} (약속 이행 강조)`;
  }
  if (culture === 'wlb') {
    return `${template} (균형 존중 강조)`;
  }
  return template;
};

/**
 * Retrieve suggested Korean phrasing template for action and role.
 * 역할/행동 조합에 맞는 한국어 템플릿을 반환한다.
 */
export const renderActionTemplate = (
  role: string,
  action: string,
  culture: CultureMode,
): string => {
  const matched = TEMPLATES.find(
    (entry) => entry.action === action && entry.roles.some((item) => role.includes(item)),
  );
  if (matched) {
    return culturePolish(culture, matched.text);
  }
  return culturePolish(
    culture,
    '상황을 더 알고 싶어요. 핵심 의도를 공유해 주시면 맞춤 대응할게요.',
  );
};
