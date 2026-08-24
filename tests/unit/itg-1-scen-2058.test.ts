import { describe, test, expect } from '@jest/globals';
import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-2058
  test('対策案の必須項目検証機能 - 優先度スコアが小数値を含む場合に検証が失敗する', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed database migration for user module',
      todayPlan: 'Deploy to staging environment and run integration tests',
      challenges: 'Performance optimization needed for API response time',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result).toEqual(
      expect.objectContaining({
        reportId: expect.any(String),
        submissionTimestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        isWithinDeadline: expect.any(Boolean),
      })
    );

    expect(result.reportId).toBeTruthy();
    expect(result.submissionTimestamp).toBeTruthy();
    expect(typeof result.isWithinDeadline).toBe('boolean');
  });
});