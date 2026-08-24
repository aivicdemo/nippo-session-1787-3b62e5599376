import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報入力検証機能', () => {
  // SCEN-2191: [normal] 日報入力検証機能 - 昨日やったことが空文字列の場合、該当項目にエラーメッセージが表示されて修正が促される
  test('should reject submission and display error when yesterdayAccomplishment is empty string', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '',
      todayPlan: 'タスクA',
      challenges: '課題1',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/昨日やったこと/);
  });
});