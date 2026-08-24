import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2201: [normal] 日報入力検証機能 - 3つの必須項目がすべて入力されており形式要件を満たしている場合、送信が確定される
  test('3つの必須項目がすべて入力され形式要件を満たしている場合、日報送信が確定される', () => {
    const submitTimestamp = new Date('2024-01-15T08:45:00Z');
    const reportDate = '2024-01-15';

    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-engineering-a',
      yesterdayAccomplishment: '顧客A社との打ち合わせ実施、要件定義ドキュメント作成',
      todayPlan: '要件定義ドキュメントのレビュー、設計書作成開始',
      challenges: '顧客A社からの追加要件が不明確',
      reportDate: reportDate,
    };

    const result: SubmitDailyReportOutput = submitDailyReport(
      input,
      submitTimestamp
    );

    expect(result).toBeDefined();
    expect(result.reportId).toBeTruthy();
    expect(result.reportId).toMatch(/^report-/);
    expect(result.submissionTimestamp).toBe(submitTimestamp.toISOString());
    expect(result.isWithinDeadline).toBe(true);
  });
});