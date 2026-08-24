import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2485
  test('操作習熟度スコア計算機能 - 操作ステップの配列がnullのとき、エラーを返す', () => {
    const input = {
      userId: 'user-123',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed feature X',
      todayPlan: 'Start feature Y',
      challenges: 'Database performance issue',
      reportDate: '2024-01-15',
      operationSteps: null as any,
    };

    let caughtError: any = null;
    try {
      submitDailyReport(input);
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError).toEqual(
      expect.objectContaining({
        errorCode: 'INVALID_STEPS_ARRAY',
        message: expect.stringMatching(/ステップ配列|操作ステップ.*null/),
      })
    );
  });
});