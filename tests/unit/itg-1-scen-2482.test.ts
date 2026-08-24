import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2482
  test('操作習熟度スコア計算機能 - 報告送信完了時刻が欠落しているとき、エラーを返す', () => {
    const incompleteReportRecordWithoutCompletedAt = {
      reportId: 'report-001',
      userId: 'user-001',
      teamId: 'team-001',
      reportDate: '2024-01-15',
      yesterdayAccomplishment: 'Completed feature development',
      todayPlan: 'Code review and testing',
      challenges: 'Database performance issue',
      submissionTimestamp: '2024-01-15T08:30:00Z',
      completedAt: null as unknown as Date,
    };

    expect(() => submitDailyReport(incompleteReportRecordWithoutCompletedAt as any)).toThrow(/報告送信完了時刻/);
  });
});