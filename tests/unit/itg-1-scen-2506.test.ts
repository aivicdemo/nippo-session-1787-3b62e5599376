import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2506: [normal] 初回テスト報告の入力検証機能 - テキスト形式が不正な場合に修正指示が返される
  test('不正なテキスト形式を含む日報送信時にバリデーションエラーが返される', () => {
    const invalidReportInput: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '\x00\x01',
      todayPlan: '営業資料作成',
      challenges: 'システム連携テスト',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(invalidReportInput)).toThrow(/テキスト形式|制御文字/);
  });
});