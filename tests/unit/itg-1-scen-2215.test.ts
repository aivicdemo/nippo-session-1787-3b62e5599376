import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2215: [error] 朝会報告の入力検証機能 - 今日やることに禁止文字が含まれるとき入力エラーが返される
  test('今日やることに禁止文字が含まれる場合、入力検証エラーを返す', () => {
    const maliciousInput: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'システムの基本設定が完了しました',
      todayPlan: '<script>alert("test")</script>',
      challenges: 'API統合に時間がかかっています',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(maliciousInput)).toThrow(/禁止文字/);
  });
});