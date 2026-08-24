import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('submitDailyReport', () => {
  test('SCEN-2484: 操作ステップの配列が空のとき、エラーを返す', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'テスト実施',
      todayPlan: 'テスト設計',
      challenges: 'テスト環境の整備',
      reportDate: '2024-01-15',
      operationSteps: []
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('EMPTY_STEPS_ARRAY');
    expect(result.errorMessage).toBe('操作ステップの配列が空です。スコアを計算できません');
    expect(result.proficiencyScore).toBeUndefined();
  });
});