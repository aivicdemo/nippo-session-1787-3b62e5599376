import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  test('SCEN-2196: 今日やることが空文字列の場合、該当フィールドのみにエラーが表示される', () => {
    // Arrange
    const input = {
      userId: 'user-123',
      teamId: 'team-001',
      yesterdayAccomplishment: '顧客A対応、システム調査',
      todayPlan: '',
      challenges: 'DBパフォーマンス低下',
      reportDate: '2024-01-15',
    };

    // Act & Assert
    expect(() => submitDailyReport(input)).toThrow(/今日やること/);
  });
});