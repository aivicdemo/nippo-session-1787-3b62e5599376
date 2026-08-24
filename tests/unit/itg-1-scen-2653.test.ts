import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('課題の影響度判定と優先度スコア表示', () => {
  // SCEN-2653: [error] 初回テスト報告入力検証機能 - 影響度スコアが100を超える値のとき不合格判定となる
  test('影響度スコアが100を超える場合、ValidationErrorをスロー', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['ネットワーク遅延', 'デプロイ失敗'],
        frequencies: { 'ネットワーク遅延': 3, 'デプロイ失敗': 2 }
      }),
      assessImpactScore: jest.fn().mockResolvedValue(101),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high')
    };

    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-alpha',
      yesterdayAccomplishment: 'API実装を完了した',
      todayPlan: 'テスト実行を開始する',
      challenges: 'ネットワーク遅延によりデプロイが遅れている',
      reportDate: '2024-01-15'
    };

    expect(
      () => submitDailyReport(input, mockTextAnalysisServiceAdapter)
    ).toThrow(/影響度スコア/);
  });
});