import request from 'supertest';
import scenarios from '../data/scenarios.example.json';
import { createApp } from '../src/api.js';

describe('TalkRange API', () => {
  const app = createApp();

  it('responds to health check', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('validates request body', async () => {
    const response = await request(app).post('/range').send({
      time_context: 'now',
      utterance: 'hello',
    });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('returns range and actions for scenario sample', async () => {
    const scenario = (scenarios as unknown as Array<Record<string, unknown>>)[0];

    const response = await request(app)
      .post('/range')
      .send({
        role: scenario.role,
        time_context: scenario.time_context,
        culture: scenario.culture,
        history: scenario.history,
        utterance: scenario.utterance,
        my_profile: scenario.my_profile,
      });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.intent_range)).toBe(true);
    expect(Array.isArray(response.body.recommended_actions)).toBe(true);

    const probabilityTotal = response.body.intent_range.reduce(
      (acc: number, item: { probability: number }) => acc + item.probability,
      0,
    );
    expect(probabilityTotal).toBeCloseTo(1, 5);

    expect(response.body).toMatchSnapshot({
      intent_range: expect.arrayContaining([
        expect.objectContaining({
          intent: expect.any(String),
          probability: expect.any(Number),
        }),
      ]),
      recommended_actions: expect.arrayContaining([
        expect.objectContaining({
          action: expect.any(String),
          ev: expect.any(Number),
          rationale: expect.any(String),
          template: expect.any(String),
        }),
      ]),
      explain: {
        signals: expect.any(Array),
        note: expect.any(String),
      },
    });
  });
});
