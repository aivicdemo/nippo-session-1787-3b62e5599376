import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報入力・送信', () => {
  // SCEN-331
  test('日報入力バリデーション機能 - 今日やることが1文字のとき入力ルールを満たす', () => {
    const input: SubmitDailyReportInput = {
      userId: 'eng001',
      teamId: 'team-a',
      yesterdayAccomplishment: 'テスト',
      todayPlan: 'A',
      challenges: 'なし',
      reportDate: '2024-01-15',
    };

    const result: SubmitDailyReportOutput = submitDailyReport(input);

    expect(result).toHaveProperty('reportId');
    expect(result.reportId).toBeTruthy();
    expect(result).toHaveProperty('submissionTimestamp');
    expect(typeof result.submissionTimestamp).toBe('string');
    expect(result).toHaveProperty('isWithinDeadline');
    expect(typeof result.isWithinDeadline).toBe('boolean');
  });
});