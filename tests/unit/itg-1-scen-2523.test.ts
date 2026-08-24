import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('submitDailyReport - 初回テスト報告の入力検証', () => {
  // SCEN-2523
  test('課題内容の文字数が上限を超えるとき入力検証エラーが返される', () => {
    const challengesText = 'a'.repeat(501);
    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Yesterday task completed',
      todayPlan: 'Today plan scheduled',
      challenges: challengesText,
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/課題|文字|上限/);
  });
});