import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信検証', () => {
  // SCEN-324
  test('「今日やること」項目が文字数制限を超過したとき、エラーが発生する', () => {
    const excessiveText = 'a'.repeat(501);
    
    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '昨日は機能Aの実装を完了しました',
      todayPlan: excessiveText,
      challenges: '環境構築時の依存関係で課題が発生しています',
      reportDate: '2024-01-15'
    };

    expect(() => submitDailyReport(input)).toThrow(/文字数制限|上限|500文字/);
  });
});