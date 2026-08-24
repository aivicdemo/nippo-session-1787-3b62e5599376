import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2655
  test('初回テスト報告入力検証機能 - 報告日時が未来日時のとき不合格判定となる', () => {
    const currentTime = new Date('2024-01-15T08:30:00Z');
    const futureReportDate = '2024-01-16'; // 明日の日付
    const futureSubmissionTimestamp = new Date('2024-01-16T09:00:00Z').toISOString();

    const input = {
      userId: 'test-user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'タスクA完了',
      todayPlan: 'タスクB実施',
      challenges: '課題なし',
      reportDate: futureReportDate,
    };

    const mockCurrentDate = new Date('2024-01-15T08:30:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(mockCurrentDate);

    try {
      expect(() => {
        submitDailyReport(input, futureSubmissionTimestamp);
      }).toThrow(/報告日時/);
    } finally {
      jest.useRealTimers();
    }
  });
});