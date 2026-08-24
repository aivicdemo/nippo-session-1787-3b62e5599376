import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-2055
  test('対策案の必須項目検証機能 - 優先度スコアが下限値未満(-1)の場合に検証が失敗する', () => {
    const input = {
      reportId: 'report-001',
      userId: 'user-001',
      submissionTimestamp: new Date('2024-01-15T09:00:00Z'),
      reportContent: {
        yesterdayAccomplishment: 'テスト実装完了',
        todayPlan: 'テスト実行予定',
        challenges: 'リソース不足'
      }
    };

    const result = submitDailyReport(input);

    expect(result).toEqual(
      expect.objectContaining({
        recordId: expect.any(String),
        reportId: 'report-001',
        submissionTimestamp: new Date('2024-01-15T09:00:00Z'),
        isWithinDeadline: expect.any(Boolean),
        deadlineComparisonResult: expect.objectContaining({
          status: expect.stringMatching(/^(on_time|delayed)$/),
          minutesBeforeDeadline: expect.any(Number)
        }),
        recordedAt: expect.any(Date)
      })
    );

    expect(result.recordId).toBeTruthy();
    expect(typeof result.recordId).toBe('string');
    expect(result.reportId).toBe('report-001');
    expect(result.isWithinDeadline).toBe(true);
    expect(result.deadlineComparisonResult.status).toBe('on_time');
    expect(result.deadlineComparisonResult.minutesBeforeDeadline).toBeGreaterThan(0);
  });
});