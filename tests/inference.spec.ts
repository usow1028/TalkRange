import { infer } from '../src/inference.js';

describe('infer', () => {
  it('normalises posterior distribution', () => {
    const result = infer(
      '동료',
      '퇴근 직전',
      'wlb',
      '미안한데 오늘은 조금 먼저 가도 될까?',
      ['최근 연속 야근으로 지침'],
    );
    const total = result.range.reduce((acc, item) => acc + item.probability, 0);
    expect(total).toBeCloseTo(1, 5);
    const topIntent = result.range[0].intent;
    expect(['GO_HOME', 'HELP_SEEK']).toContain(topIntent);
    const goHomeProb = result.range.find((item) => item.intent === 'GO_HOME')?.probability ?? 0;
    const stayProb = result.range.find((item) => item.intent === 'STAY')?.probability ?? 0;
    expect(goHomeProb).toBeGreaterThan(stayProb);
    expect(result.signals.length).toBeGreaterThan(0);
  });

  it('reacts to boundary pushing signals', () => {
    const pressure = infer(
      '상사',
      '야근',
      'pressure',
      '다들 지금 바로 마무리합시다. 반드시 오늘 끝내야 해요.',
      [],
    );
    const soft = infer(
      '상사',
      '야근',
      'pressure',
      '오늘은 가능하면 여기까지 하고 내일 일찍 마무리하는 게 어떨까요?',
      ['최근 잦은 야근에 대한 불만'],
    );

    expect(pressure.range[0].intent).toBe('STAY');

    const goHomeSoft = soft.range.find((item) => item.intent === 'GO_HOME')?.probability ?? 0;
    const goHomePressure = pressure.range.find((item) => item.intent === 'GO_HOME')?.probability ?? 0;
    expect(goHomeSoft).toBeGreaterThan(goHomePressure);
    expect(pressure.range[0].probability).toBeGreaterThan(goHomeSoft);
  });
});
