import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信処理', () => {
  // SCEN-315
  test('朝会報告入力フォーム検証 - 「今日やること」項目が空文字列のとき、エラー表示される', () => {
    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'タスクA完了',
      todayPlan: '',
      challenges: '課題X',
      reportDate: '2024-01-15',
    };

    expect(() => {
      submitDailyReport(input);
    }).toThrow(/今日やること/);
  });
});