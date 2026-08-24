import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Report Submission with Null Developer ID', () => {
  // SCEN-260: [error] 報告送信時刻の遅延判定機能 - 開発エンジニアの ID が null のとき、エラーが発生して処理が進まない
  test('should throw ValidationError when developer ID is null', () => {
    const reportData = {
      reportId: 'report-001',
      userId: null as unknown as string,
      teamId: 'team-001',
      submissionTimestamp: new Date('2024-01-15T08:30:00Z'),
      reportContent: {
        yesterdayAccomplishment: '機能A実装',
        todayPlan: 'テスト実施',
        challenges: 'パフォーマンス課題'
      }
    };

    expect(() => submitDailyReport(reportData)).toThrow(/userId|developer|required/i);
  });
});