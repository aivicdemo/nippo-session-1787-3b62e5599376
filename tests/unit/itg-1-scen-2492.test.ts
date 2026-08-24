import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2492: [error] 操作習熟度スコア計算機能 - 期待ステップ定義が欠落しているとき、エラーを返す
  test('期待ステップ定義がnullのとき、ERR_MISSING_EXPECTED_STEPSエラーを返す', () => {
    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-A',
      yesterdayAccomplishment: '昨日は顧客向けAPIの実装を完了しました',
      todayPlan: '本日はテストコードを作成する予定です',
      challenges: 'データベース接続がタイムアウトする問題が発生しています',
      reportDate: '2024-12-19',
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: ['データベース接続', 'タイムアウト'],
        frequency: [2, 2],
      }),
      assessImpactScore: jest.fn().mockReturnValue({
        impactScore: 75,
        expectedSteps: null,
      }),
      classifyIssueSeverity: jest.fn().mockReturnValue({
        severity: 'high',
      }),
    };

    expect(() => {
      submitDailyReport(input, mockTextAnalysisServiceAdapter);
    }).toThrow(/期待ステップ定義/);
  });
});