import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('submitDailyReport', () => {
  test('SCEN-2521: [error] 初回テスト報告の入力検証 - 報告日時が未来日のとき入力検証エラーが返される', () => {
    // Arrange
    const currentDate = new Date('2024-01-15T08:30:00Z');
    const futureReportDate = '2024-01-16'; // 明日の日付
    
    const submitDailyReportInput = {
      userId: 'test-user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'テスト実装を完了しました',
      todayPlan: 'ユーザーインターフェースのテストを実施します',
      challenges: 'データベース接続に関する問題を解決中です',
      reportDate: futureReportDate,
    };

    // Act & Assert
    expect(() => submitDailyReport(submitDailyReportInput, currentDate)).toThrow(/報告日時/);
  });
});