import express, { NextFunction, Request, Response } from 'express';
import { DEFAULT_CULTURE, DEFAULT_PROFILE } from './config.js';
import { ev } from './ev.js';
import { infer } from './inference.js';
import {
  ActionRec,
  Profile,
  RangeRequestBody,
  RangeResponse,
} from './types.js';

/**
 * Clamp numeric value to the [0,1] interval.
 * 값을 0~1 범위로 제한.
 */
const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * Merge incoming profile overrides with defaults.
 * 입력 프로필을 기본값과 병합.
 */
const sanitizeProfile = (incoming?: Partial<Profile>): Profile => {
  if (!incoming) {
    return DEFAULT_PROFILE;
  }
  return {
    relationship: (incoming.relationship ?? DEFAULT_PROFILE.relationship) as Profile['relationship'],
    taskUrgency: clamp01(incoming.taskUrgency ?? DEFAULT_PROFILE.taskUrgency),
    futureImportance: clamp01(incoming.futureImportance ?? DEFAULT_PROFILE.futureImportance),
    tolerance: clamp01(incoming.tolerance ?? DEFAULT_PROFILE.tolerance),
  };
};

/**
 * Validate and sanitize conversation history array.
 * 대화 히스토리 배열을 검증/정제.
 */
const ensureHistory = (history?: string[]): string[] => {
  if (!history) return [];
  return history.filter((item): item is string => typeof item === 'string');
};

/**
 * Validate REST payload and return error message if invalid.
 * REST 본문을 검증하고 문제 시 오류 메시지 반환.
 */
const validateBody = (body: RangeRequestBody): string | undefined => {
  if (!body.role) return 'role is required';
  if (!body.time_context) return 'time_context is required';
  if (!body.utterance) return 'utterance is required';
  return undefined;
};

/**
 * Construct the TalkRange express application with configured routes.
 * TalkRange Express 애플리케이션을 생성한다.
 */
export const createApp = (): express.Express => {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  app.post('/range', (req: Request, res: Response) => {
    const body = req.body as RangeRequestBody;
    const error = validateBody(body);
    if (error) {
      res.status(400).json({ error });
      return;
    }

    const culture = body.culture ?? DEFAULT_CULTURE;
    const history = ensureHistory(body.history);
    const profile = sanitizeProfile(body.my_profile);

    const result = infer(body.role, body.time_context, culture, body.utterance, history);
    const actions = ev(result.range, profile, culture, body.role);

    const response: RangeResponse = {
      intent_range: result.range,
      recommended_actions: actions.map((item: ActionRec) => ({
        ...item,
        intents: item.intents.map((intent) => ({ ...intent })),
      })),
      explain: {
        signals: result.signals,
        note: result.note,
      },
    };

    res.json(response);
  });

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    void _next;
    // eslint-disable-next-line no-console
    console.error('TalkRange API error', error);
    res.status(500).json({ error: 'internal_error' });
  });

  return app;
};
