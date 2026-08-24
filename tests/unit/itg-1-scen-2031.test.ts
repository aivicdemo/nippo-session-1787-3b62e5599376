import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Daily Report Management - submitDailyReport', () => {
  // SCEN-2031: [error] 対策案・実行計画の必須項目検証 - 実行計画の開始日時がnullのとき検証エラーになる
  test('should return validation error when countermeasure plan start date is null', () => {
    const input = {
      reportId: 'report-001',
      userId: 'user-001',
      submissionTimestamp: new Date('2026-08-20T09:30:00Z'),
      reportContent: {
        yesterdayAccomplishment: 'Completed unit tests for login module',
        todayPlan: 'Implement API authentication',
        challenges: 'Database connection timeout issues',
      },
      countermeasurePlan: {
        description: 'テスト対策の実施',
        startDate: null,
        endDate: new Date('2026-08-20T17:00:00Z'),
        assignee: 'user001',
      },
    };

    expect(() => submitDailyReport(input)).toThrow(/開始日時/);
  });
});